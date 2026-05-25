#!/usr/bin/env python3
"""Hakim Bot — Shahnameh AI Guardian (Telegram)"""

import logging
from telegram import Update
from telegram.error import BadRequest, Forbidden, NetworkError, TelegramError
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)
from config import TELEGRAM_TOKEN
from dynamic_config import DynamicConfig
from hakim_ai import get_provider, _quota_response, _error_response, _no_key_response
from knowledge_base import KnowledgeBase
import chat_logger

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

OPENING_VERSE = "بسی رنج بردم در این سال سی\nعجم زنده کردم بدین پارسی\n\n"

cfg       = DynamicConfig()
knowledge = KnowledgeBase()
chat_logger.ensure_tables()


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = _lang(update)
    season = cfg.get("season_name", "Sesong 1")

    greetings = {
        "fa": f"من حکیم فردوسی‌ام، نگهبان ریکت — {season}. هر آنچه از قوانین ریکت خواهی بپرس.",
        "tg": f"Ман Ҳаким Фирдавсӣ ҳастам, нигаҳбони Риккет — {season}.",
        "ru": f"Я Хаким Фирдоуси, страж Рикета — {season}.",
        "tr": f"Ben Hakim Firdevsi'yim, Riket'in bekçisi — {season}.",
        "ar": f"أنا الحكيم الفردوسي، حارس المملكة — {season}.",
        "no": f"Jeg er Hakim Ferdowsi, Rikets vokter — {season}. Spør meg om Rikets lover.",
    }
    body = greetings.get(lang, f"I am Hakim Ferdowsi, guardian of the Realm — {season}.")
    await update.message.reply_text(OPENING_VERSE + body)


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        OPENING_VERSE + "Ask Hakim any question about the Realm and its laws."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not cfg.is_active():
        await update.message.reply_text("Riket hviler. Kom tilbake snart.")
        return

    user_text = update.message.text or ""
    lang      = _lang(update)
    user      = update.message.from_user
    chat_id   = update.effective_chat.id
    username  = getattr(user, "username", None) or getattr(user, "first_name", None) or ""

    chat_logger.upsert_user(chat_id, username, lang)
    chat_logger.log_message(chat_id, username, "in", user_text)

    await context.bot.send_chat_action(chat_id=chat_id, action="typing")

    relevant = knowledge.search(user_text)
    # Try primary provider; on quota/auth failure fall back to Anthropic
    primary_name = cfg.get("ai_provider", "openai")
    provider = get_provider(primary_name)
    response = await provider.respond(user_text, relevant, lang, cfg)
    if response in (_quota_response(lang), _error_response(lang), _no_key_response(lang)):
        fallback_name = "anthropic" if primary_name == "openai" else "openai"
        response = await get_provider(fallback_name).respond(user_text, relevant, lang, cfg)

    chat_logger.log_message(chat_id, username, "out", response)
    await update.message.reply_text(response)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    err = context.error
    if isinstance(err, (BadRequest, Forbidden)):
        logger.warning("Telegram error (ignored): %s", err)
    elif isinstance(err, NetworkError):
        logger.warning("Network error (will retry): %s", err)
    else:
        logger.error("Unhandled error: %s", err, exc_info=err)


def _lang(update: Update) -> str:
    code = getattr(update.message.from_user, "language_code", None) or "en"
    return code.split("-")[0]


def main() -> None:
    if not TELEGRAM_TOKEN:
        raise RuntimeError("TELEGRAM_TOKEN is not set in .env")

    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)

    logger.info("Hakim awakens — polling for messages...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
