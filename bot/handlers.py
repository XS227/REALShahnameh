"""Telegram command handlers."""

from __future__ import annotations

import logging
from decimal import Decimal, InvalidOperation
from typing import Final

from sqlalchemy import select
from telegram import Update
from telegram.ext import ContextTypes

from .models import Progress, RealBalance, Transaction, User
from .observability import CommandTimer
from .session_manager import SessionManager
from .token_service import TokenIssuanceFailed
from .reports import build_token_report, render_report_text

logger = logging.getLogger(__name__)

WELCOME_NEW_USER: Final[str] = (
    "Velkommen til REAL Shahnameh, {name}!\n"
    "Vi har laget en guidet introduksjon slik at du raskt kommer i gang."
)
WELCOME_RETURNING_USER: Final[str] = (
    "Velkommen tilbake!\n"
    "Skriv /progress for å plukke opp der du slapp, eller /help for mer informasjon."
)
ONBOARDING_STEPS: Final[list[tuple[str, str]]] = [
    (
        "1. Bli kjent",
        "Du registreres automatisk og får en REAL-saldo. Vi bruker denne til å låse opp belønninger.",
    ),
    (
        "2. Sett et mål",
        "Bestem deg for hvilket kapittel du vil utforske først. /progress viser hvor du er.",
    ),
    (
        "3. Utforsk",
        "Følg historiene i Shahnameh og løs utfordringer for å øke saldoen din.",
    ),
    (
        "4. Få hjelp",
        "Bruk /help når som helst eller /faq for svar på vanlige spørsmål.",
    ),
]
HELP_SECTIONS: Final[list[tuple[str, list[str]]]] = [
    (
        "Grunnleggende kommandoer",
        [
            "/start – start onboarding eller nullstill fremdriften",
            "/progress – se hvilket kapittel og oppdrag du jobber med",
            "/balance – se REAL-saldo og siste transaksjon",
            "/faq – vanlige spørsmål og svar",
        ],
    ),
    (
        "Kontakt og støtte",
        [
            "Svar på denne chatten om du trenger manuell hjelp",
            "E-post: support@realshahnameh.example",
        ],
    ),
]
FAQ_ENTRIES: Final[list[tuple[str, str]]] = [
    (
        "Hvordan tjener jeg REAL?",
        "Du mottar REAL ved å fullføre oppdrag. Nye oppdrag kommer når du gjør fremdrift med /progress.",
    ),
    (
        "Kan jeg tilbakestille historien?",
        "Ja, kjør /start igjen for å starte på nytt. Vi beholder saldoen din og tidligere transaksjoner.",
    ),
    (
        "Hvor finner jeg mer hjelp?",
        "Skriv til support eller les lanseringsplanen i dokumentasjonen for veiledning.",
    ),
]


def _format_sections(sections: list[tuple[str, list[str]]]) -> str:
    lines: list[str] = []
    for title, entries in sections:
        lines.append(f"\n{title}:")
        for entry in entries:
            lines.append(f" • {entry}")
    return "\n".join(lines).strip()


def _format_onboarding() -> str:
    return "\n\n".join(f"{title}\n{description}" for title, description in ONBOARDING_STEPS)


def _format_faq() -> str:
    entries = [f"Q: {question}\nA: {answer}" for question, answer in FAQ_ENTRIES]
    return "\n\n".join(entries)


def build_start_handler(session_manager: SessionManager):
    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        timer = CommandTimer("start")
        status = "success"
        if update.effective_user is None or update.message is None:
            status = "ignored"
            timer.finish(status)
            return

        telegram_user = update.effective_user
        db = context.bot_data["db"]

        try:
            session_manager.set_state(telegram_user.id, "onboarding")

            db = context.bot_data["db"]
            with db.session() as session:
                existing_user = session.scalar(select(User).where(User.telegram_id == telegram_user.id))
                if existing_user is None:
                    user = User(
                        telegram_id=telegram_user.id,
                        username=telegram_user.username,
                    )
                    session.add(user)
                    session.flush()

                    session.add(RealBalance(user_id=user.id, amount=0))
                    session.add(Progress(user_id=user.id, chapter="intro"))
                    session.add(
                        Transaction(
                            user_id=user.id,
                            amount=0,
                            transaction_type="account_created",
                            description="Konto opprettet gjennom /start.",
                        )
                    )
                    welcome_text = WELCOME_NEW_USER.format(name=telegram_user.first_name or telegram_user.username or "venn")
                    logger.info("New user registered", extra={"telegram_id": telegram_user.id})
                else:
                    session_manager.set_state(telegram_user.id, "returning")
                    welcome_text = WELCOME_RETURNING_USER
                    logger.info("Returning user resumed session", extra={"telegram_id": telegram_user.id})

            onboarding_text = _format_onboarding()
            await update.message.reply_text(f"{welcome_text}\n\n{onboarding_text}")
            session_manager.set_state(telegram_user.id, "active")
        except Exception:
            status = "error"
            logger.exception("Failed to execute /start handler")
            raise
        finally:
            timer.finish(status)

    return start


def help_command(_: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        timer = CommandTimer("help")
        status = "success"
        if update.message is None:
            status = "ignored"
            timer.finish(status)
            return

        try:
            help_text = _format_sections(HELP_SECTIONS)
            await update.message.reply_text(f"Her er en oversikt over hva du kan gjøre:\n{help_text}")
        except Exception:
            status = "error"
            logger.exception("Failed to execute /help handler")
            raise
        finally:
            timer.finish(status)

    return handler


def build_progress_handler(session_manager: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        timer = CommandTimer("progress")
        status = "success"
        if update.effective_user is None or update.message is None:
            status = "ignored"
            timer.finish(status)
            return

        try:
            session = session_manager.get(update.effective_user.id)
            db = context.bot_data["db"]
            with db.session() as db_session:
                user = db_session.scalar(select(User).where(User.telegram_id == update.effective_user.id))
                if user:
                    latest_progress = db_session.scalar(
                        select(Progress)
                        .where(Progress.user_id == user.id)
                        .order_by(Progress.updated_at.desc())
                        .limit(1)
                    )
                else:
                    latest_progress = None

                if latest_progress:
                    text = (
                        f"Du jobber nå med kapittel '{latest_progress.chapter}'.\n"
                        f"Samtalestatus: {session.state}."
                    )
                else:
                    text = "Ingen progresjon funnet. Start reisen med /start."
            await update.message.reply_text(text)
        except Exception:
            status = "error"
            logger.exception("Failed to execute /progress handler")
            raise
        finally:
            timer.finish(status)

    return handler


def build_balance_handler(_: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        timer = CommandTimer("balance")
        status = "success"
        if update.effective_user is None or update.message is None:
            status = "ignored"
            timer.finish(status)
            return

        try:
            db = context.bot_data["db"]
            with db.session() as db_session:
                user = db_session.scalar(select(User).where(User.telegram_id == update.effective_user.id))
                if user and user.real_balance:
                    last_transaction = db_session.scalar(
                        select(Transaction)
                        .where(Transaction.user_id == user.id)
                        .order_by(Transaction.created_at.desc())
                        .limit(1)
                    )
                    transaction_line = (
                        f"Siste transaksjon: {last_transaction.transaction_type} ({last_transaction.amount})."
                        if last_transaction
                        else "Ingen transaksjoner registrert ennå."
                    )
                    text = (
                        f"Din REAL-saldo er: {user.real_balance.amount}.\n"
                        f"{transaction_line}"
                    )
                else:
                    text = "Fant ingen REAL-saldo. Bruk /start for å registrere deg."
            await update.message.reply_text(text)
        except Exception:
            status = "error"
            logger.exception("Failed to execute /balance handler")
            raise
        finally:
            timer.finish(status)

    return handler


def build_faq_handler(_: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        timer = CommandTimer("faq")
        status = "success"
        if update.message is None:
            status = "ignored"
            timer.finish(status)
            return

        try:
            await update.message.reply_text(_format_faq())
        except Exception:
            status = "error"
            logger.exception("Failed to execute /faq handler")
            raise
        finally:
            timer.finish(status)

    return handler


def build_reward_handler():
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.effective_user is None or update.message is None:
            return

        admins: list[int] = context.bot_data.get("admin_user_ids", [])
        if update.effective_user.id not in admins:
            await update.message.reply_text("Du har ikke tilgang til denne kommandoen.")
            return

        if not context.args or len(context.args) < 3:
            await update.message.reply_text(
                "Bruk: /reward <telegram_id> <amount> <reason> [key=value ...]"
            )
            return

        try:
            recipient_id = int(context.args[0])
            amount = Decimal(context.args[1])
        except (ValueError, InvalidOperation):
            await update.message.reply_text("Ugyldige argumenter. Kontroller ID og beløp.")
            return

        reason = context.args[2]
        metadata = {"issued_by": str(update.effective_user.id)}

        for pair in context.args[3:]:
            if "=" not in pair:
                continue
            key, value = pair.split("=", 1)
            metadata[key] = value

        metadata.setdefault("challenge_id", reason)

        token_service = context.bot_data.get("token_service")
        if token_service is None:
            await update.message.reply_text("Token-tjenesten er ikke konfigurert.")
            return

        try:
            transaction = token_service.reward_user(
                telegram_id=recipient_id,
                amount=amount,
                reason=reason,
                metadata=metadata,
            )
        except TokenIssuanceFailed as exc:
            await update.message.reply_text(f"Utbetaling feilet: {exc}")
            return

        await update.message.reply_text(
            "Utbetaling sendt:\n"
            f"ID: {transaction.transaction_id}\n"
            f"Status: {transaction.status}\n"
            f"Beløp: {transaction.amount} REAL"
        )

    return handler


def build_token_report_handler():
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.effective_user is None or update.message is None:
            return

        admins: list[int] = context.bot_data.get("admin_user_ids", [])
        if update.effective_user.id not in admins:
            await update.message.reply_text("Du har ikke tilgang til denne rapporten.")
            return

        db = context.bot_data["db"]
        with db.session() as session:
            report = build_token_report(session)

        await update.message.reply_text(render_report_text(report))

    return handler
