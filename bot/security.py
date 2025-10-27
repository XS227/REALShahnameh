"""Security utilities for REAL token transactions."""

from __future__ import annotations

import hmac
import json
import logging
import time
from collections import deque
from dataclasses import dataclass
from decimal import Decimal
from hashlib import sha256
from typing import Deque, Dict, Iterable, Mapping

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Raised when a rate limit threshold has been exceeded."""

    def __init__(self, key: str, limit: int, window_seconds: int) -> None:
        super().__init__(
            f"Rate limit exceeded for {key!r}: limit={limit} per {window_seconds}s"
        )
        self.key = key
        self.limit = limit
        self.window_seconds = window_seconds


class RateLimiter:
    """Simple sliding-window rate limiter."""

    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._events: Dict[str, Deque[float]] = {}

    def _prune(self, key: str, now: float) -> None:
        events = self._events.setdefault(key, deque())
        while events and now - events[0] > self.window_seconds:
            events.popleft()

    def check(self, key: str) -> None:
        now = time.monotonic()
        events = self._events.setdefault(key, deque())
        self._prune(key, now)
        if len(events) >= self.limit:
            raise RateLimitExceeded(key, self.limit, self.window_seconds)
        events.append(now)


class AntiCheatViolation(Exception):
    """Raised when anti-cheat heuristics deny a transaction."""

    def __init__(self, reason: str) -> None:
        super().__init__(f"Anti-cheat rule triggered: {reason}")
        self.reason = reason


@dataclass(slots=True)
class AntiCheatContext:
    telegram_id: int
    amount: Decimal
    metadata: Mapping[str, str] | None


class AntiCheatEngine:
    """Basic anti-cheat heuristics."""

    def __init__(
        self,
        max_amount: Decimal,
        required_metadata_keys: Iterable[str] | None = None,
    ) -> None:
        self.max_amount = max_amount
        self.required_metadata_keys = set(required_metadata_keys or [])

    def evaluate(self, context: AntiCheatContext) -> None:
        if context.amount <= 0:
            raise AntiCheatViolation("non_positive_amount")

        if context.amount > self.max_amount:
            raise AntiCheatViolation("amount_above_threshold")

        if self.required_metadata_keys:
            metadata = context.metadata or {}
            missing = [key for key in self.required_metadata_keys if key not in metadata]
            if missing:
                raise AntiCheatViolation("missing_metadata:" + ",".join(sorted(missing)))


class SignatureService:
    """Creates and validates HMAC-SHA256 signatures for requests."""

    def __init__(self, secret: str) -> None:
        self.secret = secret.encode()

    def build_payload(self, method: str, path: str, timestamp: str, body: Mapping[str, object]) -> bytes:
        serialized_body = json.dumps(body, separators=(",", ":"), sort_keys=True)
        payload = f"{method.upper()}|{path}|{timestamp}|{serialized_body}".encode()
        logger.debug("Signature payload: %s", payload)
        return payload

    def sign(self, method: str, path: str, timestamp: str, body: Mapping[str, object]) -> str:
        payload = self.build_payload(method, path, timestamp, body)
        signature = hmac.new(self.secret, payload, sha256).hexdigest()
        return signature

    def validate(
        self,
        signature: str,
        method: str,
        path: str,
        timestamp: str,
        body: Mapping[str, object],
    ) -> bool:
        expected = self.sign(method, path, timestamp, body)
        return hmac.compare_digest(signature, expected)
