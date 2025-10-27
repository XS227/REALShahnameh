"""CLI verktøy for admin- og support-teamet."""

from __future__ import annotations

import argparse
from typing import Iterable, Sequence

from sqlalchemy import select

from .config import load_settings
from .database import Database
from .models import Transaction, User


def _print_table(headers: Sequence[str], rows: Iterable[Sequence[object]]) -> None:
    widths = [len(header) for header in headers]
    data_rows = [[str(value) for value in row] for row in rows]

    for data_row in data_rows:
        for index, value in enumerate(data_row):
            widths[index] = max(widths[index], len(value))

    header_line = " | ".join(header.ljust(widths[idx]) for idx, header in enumerate(headers))
    separator = "-+-".join("-" * width for width in widths)
    print(header_line)
    print(separator)
    for data_row in data_rows:
        print(" | ".join(value.ljust(widths[idx]) for idx, value in enumerate(data_row)))


def list_users(database: Database) -> None:
    with database.session() as session:
        users = session.scalars(select(User).order_by(User.first_seen.desc())).all()
        rows = []
        for user in users:
            balance = user.real_balance.amount if user.real_balance else "0"
            progress_entries = len(user.progress)
            rows.append(
                (
                    user.id,
                    user.telegram_id,
                    user.username or "-",
                    user.first_seen.isoformat(timespec="seconds"),
                    balance,
                    progress_entries,
                )
            )

    headers = ("ID", "Telegram-ID", "Brukernavn", "Registrert", "REAL-saldo", "Progresjon")
    _print_table(headers, rows)


def show_user(database: Database, telegram_id: int | None, user_id: int | None) -> None:
    with database.session() as session:
        query = select(User)
        if telegram_id is not None:
            query = query.where(User.telegram_id == telegram_id)
        if user_id is not None:
            query = query.where(User.id == user_id)

        user = session.scalar(query)

        if user is None:
            print("Fant ingen bruker som matcher kriteriene.")
            return

        balance = user.real_balance.amount if user.real_balance else "0"
        print(f"Bruker-ID: {user.id}")
        print(f"Telegram-ID: {user.telegram_id}")
        print(f"Brukernavn: {user.username or '-'}")
        print(f"Registrert: {user.first_seen.isoformat(timespec='seconds')}")
        print(f"REAL-saldo: {balance}")
        print("Progresjonshistorikk:")
        for progress_entry in user.progress:
            print(f"  - {progress_entry.chapter} (sist oppdatert {progress_entry.updated_at.isoformat(timespec='seconds')})")

        transactions = session.scalars(
            select(Transaction)
            .where(Transaction.user_id == user.id)
            .order_by(Transaction.created_at.desc())
        ).all()
        if transactions:
            print("Transaksjoner:")
            for transaction in transactions:
                print(
                    "  - "
                    f"{transaction.created_at.isoformat(timespec='seconds')} | "
                    f"{transaction.transaction_type} | {transaction.amount} | {transaction.description or ''}"
                )
        else:
            print("Transaksjoner: ingen registrerte hendelser enda.")


def list_transactions(database: Database, telegram_id: int | None) -> None:
    with database.session() as session:
        query = select(Transaction).order_by(Transaction.created_at.desc())
        if telegram_id is not None:
            query = query.join(User).where(User.telegram_id == telegram_id)

        transactions = session.scalars(query).all()
        rows = []
        for transaction in transactions:
            rows.append(
                (
                    transaction.id,
                    transaction.user.telegram_id,
                    transaction.transaction_type,
                    transaction.amount,
                    transaction.created_at.isoformat(timespec="seconds"),
                    transaction.description or "",
                )
            )

    headers = ("ID", "Telegram-ID", "Type", "Beløp", "Tidspunkt", "Beskrivelse")
    _print_table(headers, rows)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Adminverktøy for REAL Shahnameh boten")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("list-users", help="Vis en tabell over alle registrerte brukere")

    show_parser = subparsers.add_parser("show-user", help="Vis detaljert informasjon om en bruker")
    show_parser.add_argument("--telegram-id", type=int, dest="telegram_id", help="Telegram-ID for brukeren")
    show_parser.add_argument("--user-id", type=int, dest="user_id", help="Intern database-ID for brukeren")

    list_transactions_parser = subparsers.add_parser(
        "list-transactions", help="Vis transaksjoner, valgfritt filtrert på Telegram-ID"
    )
    list_transactions_parser.add_argument("--telegram-id", type=int, dest="telegram_id", help="Filtrer på Telegram-ID")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    settings = load_settings()
    database = Database(settings.database_url)

    if args.command == "list-users":
        list_users(database)
    elif args.command == "show-user":
        show_user(database, args.telegram_id, args.user_id)
    elif args.command == "list-transactions":
        list_transactions(database, args.telegram_id)


if __name__ == "__main__":
    main()
