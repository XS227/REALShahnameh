"""Audit logging utilities for REAL token transactions."""

from __future__ import annotations

import json
import logging
from contextlib import AbstractContextManager
from dataclasses import dataclass
from decimal import Decimal
from typing import Mapping, Protocol

from sqlalchemy.orm import Session

from .models import TokenTransaction, User

logger = logging.getLogger(__name__)


class SessionFactory(Protocol):
    def __call__(self) -> AbstractContextManager[Session]:
        ...


@dataclass(slots=True)
class AuditLogger:
    """Persists transaction attempts for audit purposes."""

    session_factory: SessionFactory

    def log_transaction(
        self,
        *,
        telegram_id: int,
        amount: Decimal,
        reason: str,
        status: str,
        nonce: str,
        signature: str | None,
        external_id: str | None,
        metadata: Mapping[str, str] | None = None,
    ) -> None:
        metadata_json = json.dumps(metadata) if metadata else None
        with self.session_factory() as session:
            user = session.query(User).filter(User.telegram_id == telegram_id).one_or_none()
            transaction = TokenTransaction(
                user_id=user.id if user else None,
                telegram_id=telegram_id,
                amount=amount,
                reason=reason,
                status=status,
                external_id=external_id,
                nonce=nonce,
                signature=signature,
                metadata=metadata_json,
            )
            session.add(transaction)
            logger.info(
                "Audit log entry created: telegram_id=%s amount=%s status=%s external_id=%s",
                telegram_id,
                amount,
                status,
                external_id,
            )
