"""High-level orchestration for REAL token payouts."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Mapping, Optional

from sqlalchemy import select

from .audit import AuditLogger
from .database import Database
from .models import RealBalance, User
from .real_token import RealTokenAdapter, RealTokenError, RealTokenTransaction
from .security import AntiCheatContext, AntiCheatEngine, AntiCheatViolation, RateLimitExceeded, RateLimiter

logger = logging.getLogger(__name__)


class TokenServiceError(Exception):
    """Base error for token service operations."""


class TokenIssuanceFailed(TokenServiceError):
    pass


@dataclass(slots=True)
class TokenService:
    database: Database
    adapter: RealTokenAdapter
    audit_logger: AuditLogger
    anti_cheat: AntiCheatEngine
    per_user_rate_limiter: RateLimiter

    def reward_user(
        self,
        *,
        telegram_id: int,
        amount: Decimal,
        reason: str,
        metadata: Optional[Mapping[str, str]] = None,
    ) -> RealTokenTransaction:
        metadata = dict(metadata or {})
        nonce = metadata.get("nonce") or str(uuid.uuid4())
        metadata.setdefault("nonce", nonce)

        logger.debug("Rewarding user %s amount=%s reason=%s", telegram_id, amount, reason)

        try:
            self.per_user_rate_limiter.check(f"user:{telegram_id}")
        except RateLimitExceeded as exc:
            self.audit_logger.log_transaction(
                telegram_id=telegram_id,
                amount=amount,
                reason=reason,
                status="rate_limited",
                nonce=nonce,
                signature=None,
                external_id=None,
                metadata=metadata,
            )
            raise TokenIssuanceFailed(str(exc)) from exc

        context = AntiCheatContext(
            telegram_id=telegram_id,
            amount=amount,
            metadata=metadata,
        )
        try:
            self.anti_cheat.evaluate(context)
        except AntiCheatViolation as exc:
            self.audit_logger.log_transaction(
                telegram_id=telegram_id,
                amount=amount,
                reason=reason,
                status="rejected",
                nonce=nonce,
                signature=None,
                external_id=None,
                metadata=metadata,
            )
            raise TokenIssuanceFailed(str(exc)) from exc

        try:
            transaction = self.adapter.issue_tokens(
                telegram_id=telegram_id,
                amount=amount,
                reason=reason,
                nonce=nonce,
                metadata=metadata,
            )
        except RealTokenError as exc:
            self.audit_logger.log_transaction(
                telegram_id=telegram_id,
                amount=amount,
                reason=reason,
                status="failed",
                nonce=nonce,
                signature=getattr(self.adapter, "last_signature", None),
                external_id=None,
                metadata=metadata,
            )
            raise TokenIssuanceFailed(str(exc)) from exc

        signature = getattr(self.adapter, "last_signature", None)
        self.audit_logger.log_transaction(
            telegram_id=telegram_id,
            amount=amount,
            reason=reason,
            status=transaction.status,
            nonce=nonce,
            signature=signature,
            external_id=transaction.transaction_id,
            metadata=metadata,
        )

        if transaction.status == "accepted":
            self._update_balance(telegram_id, amount)

        return transaction

    # ------------------------------------------------------------------
    def _update_balance(self, telegram_id: int, amount: Decimal) -> None:
        with self.database.session() as session:
            user = session.scalar(select(User).where(User.telegram_id == telegram_id))
            if not user:
                logger.warning("User %s not found while updating balance", telegram_id)
                return

            if user.real_balance is None:
                balance = RealBalance(user_id=user.id, amount=amount)
                session.add(balance)
            else:
                user.real_balance.amount += amount

            logger.info("User %s balance updated by %s REAL", telegram_id, amount)
