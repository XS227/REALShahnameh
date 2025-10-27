"""Telegram command handlers."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Final

from sqlalchemy import select
from telegram import Update
from telegram.ext import ContextTypes

from .models import Progress, RealBalance, User
from .session_manager import SessionManager
from .token_service import TokenIssuanceFailed
from .reports import build_token_report, render_report_text

WELCOME_MESSAGE: Final[str] = (
    "Velkommen til REAL Shahnameh bot!\n"
    "Bruk /help for å se tilgjengelige kommandoer."
)
HELP_MESSAGE: Final[str] = (
    "Tilgjengelige kommandoer:\n"
    "/start - registrer deg og start på nytt\n"
    "/help - vis denne hjelpemeldingen\n"
    "/progress - vis nåværende progresjon\n"
    "/balance - vis REAL-saldo"
)


def build_start_handler(session_manager: SessionManager):
    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.effective_user is None or update.message is None:
            return

        telegram_user = update.effective_user
        session_manager.set_state(telegram_user.id, "active")

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
            else:
                session_manager.set_state(telegram_user.id, "returning")

        await update.message.reply_text(WELCOME_MESSAGE)

    return start


def help_command(_: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.message is None:
            return

        await update.message.reply_text(HELP_MESSAGE)

    return handler


def build_progress_handler(session_manager: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.effective_user is None or update.message is None:
            return

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
                text = f"Du er på kapittel: {latest_progress.chapter} (status: {session.state})."
            else:
                text = "Ingen progresjon funnet. Start reisen med /start."
        await update.message.reply_text(text)

    return handler


def build_balance_handler(_: SessionManager):
    async def handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.effective_user is None or update.message is None:
            return

        db = context.bot_data["db"]
        with db.session() as db_session:
            user = db_session.scalar(select(User).where(User.telegram_id == update.effective_user.id))
            if user and user.real_balance:
                text = f"Din REAL-saldo er: {user.real_balance.amount}"
            else:
                text = "Fant ingen REAL-saldo. Bruk /start for å registrere deg."
        await update.message.reply_text(text)

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
