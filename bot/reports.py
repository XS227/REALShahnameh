"""Reporting utilities for REAL token usage dashboards."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Dict, Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import TokenTransaction


@dataclass(slots=True)
class TokenReport:
    total_amount: Decimal
    total_transactions: int
    failures: int
    top_users: list[tuple[int, Decimal]]
    daily_totals: Dict[str, Decimal]


def build_token_report(session: Session) -> TokenReport:
    total_amount = session.scalar(
        select(func.coalesce(func.sum(TokenTransaction.amount), 0))
    )
    total_transactions = session.scalar(select(func.count(TokenTransaction.id))) or 0
    failures = session.scalar(
        select(func.count(TokenTransaction.id)).where(TokenTransaction.status != "accepted")
    ) or 0

    # Top users by amount
    top_rows: Iterable[tuple[int, Decimal]] = (
        session.query(TokenTransaction.telegram_id, func.coalesce(func.sum(TokenTransaction.amount), 0))
        .filter(TokenTransaction.status == "accepted")
        .group_by(TokenTransaction.telegram_id)
        .order_by(func.sum(TokenTransaction.amount).desc())
        .limit(5)
    )
    top_users = [(row[0], Decimal(row[1])) for row in top_rows]

    # Daily totals for dashboards
    daily_data: Dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    rows = session.query(TokenTransaction.created_at, TokenTransaction.amount).all()
    for created_at, amount in rows:
        date_key = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else str(created_at)
        daily_data[date_key] += Decimal(amount)

    return TokenReport(
        total_amount=Decimal(total_amount or 0),
        total_transactions=total_transactions,
        failures=failures,
        top_users=top_users,
        daily_totals=dict(sorted(daily_data.items())),
    )


def render_report_text(report: TokenReport) -> str:
    lines = [
        "REAL Token rapport:",
        f"Totalt antall transaksjoner: {report.total_transactions}",
        f"Total mengde utbetalt: {report.total_amount}",
        f"Feilede transaksjoner: {report.failures}",
        "Topp-brukere:",
    ]

    if report.top_users:
        for telegram_id, amount in report.top_users:
            lines.append(f" • {telegram_id}: {amount} REAL")
    else:
        lines.append(" • Ingen utbetalinger registrert")

    lines.append("Daglige summer:")
    if report.daily_totals:
        for day, amount in report.daily_totals.items():
            lines.append(f" • {day}: {amount} REAL")
    else:
        lines.append(" • Ingen data")

    return "\n".join(lines)
