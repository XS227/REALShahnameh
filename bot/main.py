"""Entry point for running the REAL Shahnameh Telegram bot."""

from __future__ import annotations

import logging
from decimal import Decimal

from telegram.ext import ApplicationBuilder, CommandHandler

from .config import load_settings
from .database import Database
from .handlers import (
    build_balance_handler,
    build_progress_handler,
    build_start_handler,
    build_token_report_handler,
    build_reward_handler,
    help_command,
)
from .session_manager import SessionManager
from .audit import AuditLogger
from .real_token import MockRealTokenAdapter, ProductionRealTokenAdapter
from .security import AntiCheatEngine, RateLimiter, SignatureService
from .token_service import TokenService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    """Start the Telegram bot application."""

    settings = load_settings()
    database = Database(settings.database_url)
    database.create_all()

    session_manager = SessionManager()

    global_rate_limiter = RateLimiter(settings.real_rate_limit_per_minute)
    anti_cheat = AntiCheatEngine(
        max_amount=Decimal(settings.real_mock_max_amount),
        required_metadata_keys=["challenge_id"],
    )
    audit_logger = AuditLogger(session_factory=database.session)

    if settings.real_mode == "mock":
        adapter = MockRealTokenAdapter(
            max_amount=Decimal(settings.real_mock_max_amount),
            rate_limiter=global_rate_limiter,
        )
    else:
        signature_service = SignatureService(settings.real_api_secret or "")
        adapter = ProductionRealTokenAdapter(
            base_url=settings.real_api_base_url,
            api_key=settings.real_api_key or "",
            signature_service=signature_service,
            rate_limiter=global_rate_limiter,
        )

    token_service = TokenService(
        database=database,
        adapter=adapter,
        audit_logger=audit_logger,
        anti_cheat=anti_cheat,
        per_user_rate_limiter=RateLimiter(settings.real_rate_limit_per_minute),
    )

    application = ApplicationBuilder().token(settings.bot_token).build()

    application.bot_data["db"] = database
    application.bot_data["sessions"] = session_manager
    application.bot_data["token_service"] = token_service
    application.bot_data["admin_user_ids"] = settings.admin_user_ids

    application.add_handler(CommandHandler("start", build_start_handler(session_manager)))
    application.add_handler(CommandHandler("help", help_command(session_manager)))
    application.add_handler(CommandHandler("progress", build_progress_handler(session_manager)))
    application.add_handler(CommandHandler("balance", build_balance_handler(session_manager)))
    application.add_handler(CommandHandler("reward", build_reward_handler()))
    application.add_handler(CommandHandler("token_report", build_token_report_handler()))

    logger.info("Starting REAL Shahnameh bot")
    application.run_polling()


if __name__ == "__main__":
    main()
