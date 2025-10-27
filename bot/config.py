"""Application configuration and environment loading."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise RuntimeError(f"Invalid integer value: {value!r}") from exc


def _parse_csv(value: str | None) -> list[int]:
    if not value:
        return []
    result: list[int] = []
    for item in value.split(","):
        item = item.strip()
        if not item:
            continue
        try:
            result.append(int(item))
        except ValueError as exc:
            raise RuntimeError(f"Invalid admin id value: {item!r}") from exc
    return result

from dotenv import load_dotenv


@dataclass(slots=True)
class Settings:
    """Configuration values required by the bot."""

    bot_token: str
    database_url: str
    real_mode: str
    real_api_base_url: str
    real_api_key: str | None
    real_api_secret: str | None
    real_rate_limit_per_minute: int
    real_mock_max_amount: int
    admin_user_ids: list[int]


def load_settings(env_file: Optional[str] = None) -> Settings:
    """Load environment variables from ``.env`` and return ``Settings``.

    Parameters
    ----------
    env_file:
        Optional path to an ``.env`` file. Defaults to ``.env`` in the project root.
    """

    if env_file is None:
        env_file = Path(__file__).resolve().parent.parent / ".env"

    load_dotenv(env_file)

    bot_token = os.getenv("BOT_TOKEN")
    database_url = os.getenv("DATABASE_URL", "sqlite:///data/bot.db")
    real_mode = os.getenv("REAL_MODE", "mock").lower()
    real_api_base_url = os.getenv("REAL_API_BASE_URL", "https://api.real-token.example")
    real_api_key = os.getenv("REAL_API_KEY")
    real_api_secret = os.getenv("REAL_API_SECRET")
    real_rate_limit = _parse_int(os.getenv("REAL_RATE_LIMIT_PER_MINUTE"), 60)
    real_mock_max_amount = _parse_int(os.getenv("REAL_MOCK_MAX_AMOUNT"), 1000)
    admin_user_ids = _parse_csv(os.getenv("ADMIN_USER_IDS"))

    if not bot_token:
        raise RuntimeError("BOT_TOKEN must be set in environment variables.")

    if real_mode not in {"mock", "production"}:
        raise RuntimeError("REAL_MODE must be 'mock' or 'production'.")

    if real_mode == "production" and (not real_api_key or not real_api_secret):
        raise RuntimeError("REAL_API_KEY and REAL_API_SECRET must be set for production mode.")

    return Settings(
        bot_token=bot_token,
        database_url=database_url,
        real_mode=real_mode,
        real_api_base_url=real_api_base_url,
        real_api_key=real_api_key,
        real_api_secret=real_api_secret,
        real_rate_limit_per_minute=real_rate_limit,
        real_mock_max_amount=real_mock_max_amount,
        admin_user_ids=admin_user_ids,
    )
