"""Application configuration and environment loading."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


@dataclass(slots=True)
class Settings:
    """Configuration values required by the bot."""

    bot_token: str
    database_url: str


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

    if not bot_token:
        raise RuntimeError("BOT_TOKEN must be set in environment variables.")

    return Settings(bot_token=bot_token, database_url=database_url)
