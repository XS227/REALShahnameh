#!/usr/bin/env python3
"""Create hakim.db with bot_config table and default values."""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("DB_PATH", "/var/www/shahnameh/hakim-bot/hakim.db")

DEFAULTS = {
    # AI
    "ai_provider":       "openai",
    "telegram_token":    os.getenv("TELEGRAM_TOKEN", ""),
    "openai_api_key":    "",
    "openai_model":      "gpt-4o",
    "anthropic_api_key": "",
    "anthropic_model":   "claude-sonnet-4-6",
    # Rikets Ære (Trust)
    "trust_max":           "1000",
    "trust_daily_gain":    "10",
    "trust_decay_days":    "7",
    "trust_decay_amount":  "5",
    "trust_new_user":      "100",
    # Sesong
    "season_name":         "Sesong 1",
    "season_number":       "1",
    "season_end_date":     "",
    # Bot
    "bot_active":          "true",
    "daily_message_limit": "50",
    "hakim_max_tokens":    "900",
    "hakim_temperature":   "0.75",
}

conn = sqlite3.connect(DB_PATH)
conn.execute("""
    CREATE TABLE IF NOT EXISTS bot_config (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
conn.execute("""
    CREATE TABLE IF NOT EXISTS bot_messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id    INTEGER NOT NULL,
        username   TEXT,
        direction  TEXT NOT NULL CHECK(direction IN ('in','out')),
        text       TEXT NOT NULL,
        ts         DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
conn.execute("""
    CREATE TABLE IF NOT EXISTS bot_users (
        chat_id     INTEGER PRIMARY KEY,
        username    TEXT,
        lang        TEXT,
        trust_score INTEGER DEFAULT 0,
        active      INTEGER DEFAULT 1,
        first_seen  DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
conn.execute("""
    CREATE TABLE IF NOT EXISTS bot_config_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        key        TEXT NOT NULL,
        old_value  TEXT,
        new_value  TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

for key, value in DEFAULTS.items():
    conn.execute(
        "INSERT OR IGNORE INTO bot_config (key, value) VALUES (?, ?)",
        (key, value),
    )

conn.commit()
conn.close()
print(f"Database initialized: {DB_PATH}")
