"""Polls bot_config table every 60 s — no bot restart needed for config changes."""

import sqlite3
import threading
import logging
import os

logger = logging.getLogger(__name__)


class DynamicConfig:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or os.getenv("DB_PATH", "/var/www/shahnameh/hakim-bot/hakim.db")
        self._cfg: dict[str, str] = {}
        self._lock = threading.RLock()
        self._load()
        self._start_polling()

    # ── public API ───────────────────────────────────────────────────────

    def get(self, key: str, default: str = "") -> str:
        with self._lock:
            return self._cfg.get(key, default)

    def get_int(self, key: str, default: int = 0) -> int:
        try:
            return int(self.get(key, str(default)))
        except ValueError:
            return default

    def get_float(self, key: str, default: float = 0.0) -> float:
        try:
            return float(self.get(key, str(default)))
        except ValueError:
            return default

    def is_active(self) -> bool:
        return self.get("bot_active", "true").lower() == "true"

    # ── internals ────────────────────────────────────────────────────────

    def _load(self) -> None:
        try:
            conn = sqlite3.connect(self.db_path, timeout=5)
            rows = conn.execute("SELECT key, value FROM bot_config").fetchall()
            conn.close()
            with self._lock:
                self._cfg = {k: v for k, v in rows}
            logger.debug("DynamicConfig: reloaded %d keys", len(rows))
        except Exception as exc:
            logger.error("DynamicConfig reload error: %s", exc)

    def _start_polling(self) -> None:
        def _poll():
            import time
            while True:
                time.sleep(60)
                self._load()
        t = threading.Thread(target=_poll, daemon=True, name="config-poller")
        t.start()
        logger.info("DynamicConfig: polling every 60 s")
