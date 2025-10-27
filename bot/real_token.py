"""REAL token adapter implementations."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Mapping, MutableMapping, Optional

from .security import RateLimiter, SignatureService

logger = logging.getLogger(__name__)


class RealTokenError(Exception):
    """Base exception for REAL token interactions."""


class TransactionRejected(RealTokenError):
    """Raised when a transaction is rejected by the upstream API."""


@dataclass(slots=True)
class RealTokenTransaction:
    transaction_id: str
    status: str
    amount: Decimal
    processed_at: str


class RealTokenAdapter:
    """Abstract adapter interface."""

    def issue_tokens(
        self,
        *,
        telegram_id: int,
        amount: Decimal,
        reason: str,
        nonce: str,
        metadata: Optional[Mapping[str, str]] = None,
    ) -> RealTokenTransaction:
        raise NotImplementedError

    def get_transaction(self, transaction_id: str) -> RealTokenTransaction:
        raise NotImplementedError


class MockRealTokenAdapter(RealTokenAdapter):
    """In-memory adapter used for tests and development."""

    def __init__(self, *, max_amount: Decimal, rate_limiter: RateLimiter | None = None) -> None:
        self.max_amount = max_amount
        self.rate_limiter = rate_limiter
        self._transactions: MutableMapping[str, RealTokenTransaction] = {}
        self.last_signature: str | None = None

    def issue_tokens(
        self,
        *,
        telegram_id: int,
        amount: Decimal,
        reason: str,
        nonce: str,
        metadata: Optional[Mapping[str, str]] = None,
    ) -> RealTokenTransaction:
        metadata = metadata or {}
        key = f"mock:{telegram_id}"
        if self.rate_limiter:
            self.rate_limiter.check(key)

        if amount > self.max_amount:
            raise TransactionRejected("Amount exceeds mock limit")

        transaction_id = f"mock-{nonce}"
        transaction = RealTokenTransaction(
            transaction_id=transaction_id,
            status="accepted",
            amount=amount,
            processed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )
        self._transactions[transaction_id] = transaction
        self.last_signature = f"mock-signature:{nonce}"
        logger.debug("Mock transaction stored: %s", transaction)
        return transaction

    def get_transaction(self, transaction_id: str) -> RealTokenTransaction:
        try:
            return self._transactions[transaction_id]
        except KeyError as exc:
            raise RealTokenError(f"Unknown mock transaction: {transaction_id}") from exc


class ProductionRealTokenAdapter(RealTokenAdapter):
    """HTTP-based adapter used in production."""

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        signature_service: SignatureService,
        rate_limiter: RateLimiter,
        session_factory=None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.signature_service = signature_service
        self.rate_limiter = rate_limiter
        self.session_factory = session_factory
        self.last_signature: str | None = None

    def issue_tokens(
        self,
        *,
        telegram_id: int,
        amount: Decimal,
        reason: str,
        nonce: str,
        metadata: Optional[Mapping[str, str]] = None,
    ) -> RealTokenTransaction:
        path = "/v1/transactions"
        body: Dict[str, Any] = {
            "recipient": {"telegram_id": telegram_id},
            "amount": f"{amount:.2f}",
            "currency": "REAL",
            "reason": reason,
            "nonce": nonce,
            "metadata": dict(metadata or {}),
        }
        return self._post(path, body)

    def get_transaction(self, transaction_id: str) -> RealTokenTransaction:
        path = f"/v1/transactions/{transaction_id}"
        response = self._request("GET", path)
        return self._parse_transaction(response)

    # Internal helpers -------------------------------------------------
    def _post(self, path: str, body: Mapping[str, Any]) -> RealTokenTransaction:
        response = self._request("POST", path, json_body=body)
        return self._parse_transaction(response)

    def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: Mapping[str, Any] | None = None,
    ) -> Mapping[str, Any]:
        import requests

        url = f"{self.base_url}{path}"
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        body = dict(json_body or {})

        payload: Mapping[str, Any] = body if method == "POST" else {}
        signature = self.signature_service.sign(method, path, timestamp, payload)
        self.last_signature = signature

        headers = {
            "X-REAL-API-KEY": self.api_key,
            "X-REAL-SIGNATURE": signature,
            "X-REAL-TIMESTAMP": timestamp,
            "Content-Type": "application/json",
        }

        logger.debug("Sending %s request to %s", method, url)
        self.rate_limiter.check("production:global")

        attempt = 0
        while True:
            attempt += 1
            try:
                response = requests.request(method, url, json=body if body else None, headers=headers, timeout=10)
            except requests.RequestException as exc:
                if attempt >= 3:
                    raise RealTokenError("Network error") from exc
                sleep_for = 2 ** attempt
                logger.warning("Network error, retrying in %s seconds", sleep_for)
                time.sleep(sleep_for)
                continue

            if response.status_code in {429, 500, 502, 503, 504} and attempt < 3:
                sleep_for = 2 ** attempt
                logger.warning(
                    "Upstream error %s, retrying in %s seconds", response.status_code, sleep_for
                )
                time.sleep(sleep_for)
                continue

            break

        if response.status_code >= 400:
            logger.error("REAL API error %s: %s", response.status_code, response.text)
            raise TransactionRejected(f"API responded with status {response.status_code}")

        try:
            payload = response.json()
        except json.JSONDecodeError as exc:
            raise RealTokenError("Invalid JSON response from REAL API") from exc

        logger.debug("REAL API response: %s", payload)
        return payload

    def _parse_transaction(self, payload: Mapping[str, Any]) -> RealTokenTransaction:
        try:
            return RealTokenTransaction(
                transaction_id=str(payload["transaction_id"]),
                status=str(payload["status"]),
                amount=Decimal(str(payload["amount"])),
                processed_at=str(payload["processed_at"]),
            )
        except KeyError as exc:
            raise RealTokenError("Unexpected payload format") from exc
        except (TypeError, ValueError) as exc:
            raise RealTokenError("Invalid payload values") from exc
