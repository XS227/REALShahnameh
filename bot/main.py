"""Entry point for running the REAL Shahnameh Telegram bot."""

from __future__ import annotations

import logging

from telegram.ext import ApplicationBuilder, CommandHandler

from .config import load_settings
from .database import Database
from .handlers import (
    build_balance_handler,
    build_faq_handler,
    build_progress_handler,
    build_start_handler,
    help_command,
)
from .observability import init_observability, set_active_sessions
from .session_manager import SessionManager

logger = logging.getLogger(__name__)


def main() -> None:
    """Start the Telegram bot application."""

    init_observability()

    settings = load_settings()
    database = Database(settings.database_url)
    database.create_all()

    session_manager = SessionManager(on_change=set_active_sessions)

    application = ApplicationBuilder().token(settings.bot_token).build()

    application.bot_data["db"] = database
    application.bot_data["sessions"] = session_manager

    application.add_handler(CommandHandler("start", build_start_handler(session_manager)))
    application.add_handler(CommandHandler("help", help_command(session_manager)))
    application.add_handler(CommandHandler("progress", build_progress_handler(session_manager)))
    application.add_handler(CommandHandler("balance", build_balance_handler(session_manager)))
    application.add_handler(CommandHandler("faq", build_faq_handler(session_manager)))

    logger.info("Starting REAL Shahnameh bot")
    application.run_polling()


if __name__ == "__main__":
    main()
