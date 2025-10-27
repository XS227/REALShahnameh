"""Database configuration and session management."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker


Base = declarative_base()


class Database:
    """Simple wrapper around SQLAlchemy engine and sessions."""

    def __init__(self, url: str) -> None:
        if url.startswith("sqlite"):
            # Ensure the SQLite directory exists for relative paths
            database_path = url.split("///")[-1]
            if database_path and not database_path.startswith(":"):
                Path(database_path).parent.mkdir(parents=True, exist_ok=True)

        self.engine = create_engine(url, echo=False, future=True)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False)

    def create_all(self) -> None:
        """Create database tables based on the defined models."""

        Base.metadata.create_all(self.engine)

    @contextmanager
    def session(self) -> Iterator[Session]:
        """Provide a transactional scope around a series of operations."""

        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
