"""Logs bot conversations and users to SQLite for admin live-log view."""

import sqlite3
import logging
import os
import threading
from datetime import datetime

logger = logging.getLogger(__name__)
_lock = threading.Lock()


def _conn():
    db_path = os.getenv("DB_PATH", "/var/www/shahnameh/hakim-bot/hakim.db")
    return sqlite3.connect(db_path, timeout=5)


def ensure_tables() -> None:
    with _lock:
        conn = _conn()
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
        conn.commit()
        conn.close()


def log_message(chat_id: int, username: str, direction: str, text: str) -> None:
    with _lock:
        try:
            conn = _conn()
            conn.execute(
                "INSERT INTO bot_messages(chat_id,username,direction,text) VALUES(?,?,?,?)",
                (chat_id, username or "", direction, text[:2000])
            )
            conn.commit()
            conn.close()
        except Exception as exc:
            logger.warning("chat_logger.log_message error: %s", exc)


def upsert_user(chat_id: int, username: str, lang: str) -> None:
    with _lock:
        try:
            conn = _conn()
            conn.execute("""
                INSERT INTO bot_users(chat_id, username, lang)
                VALUES (?, ?, ?)
                ON CONFLICT(chat_id) DO UPDATE SET
                    username  = excluded.username,
                    lang      = excluded.lang,
                    last_seen = CURRENT_TIMESTAMP,
                    active    = 1
            """, (chat_id, username or "", lang or "en"))
            conn.commit()
            conn.close()
        except Exception as exc:
            logger.warning("chat_logger.upsert_user error: %s", exc)
