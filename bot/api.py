"""FastAPI application exposing REAL Shahnameh services."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Iterator, Mapping

from fastapi import Depends, FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field, condecimal
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .audit import AuditLogger
from .config import Settings, load_settings
from .database import Database
from .models import Progress, RealBalance, Transaction, User
from .real_token import MockRealTokenAdapter, ProductionRealTokenAdapter, RealTokenTransaction
from .security import AntiCheatEngine, RateLimiter, SignatureService
from .token_service import TokenIssuanceFailed, TokenService


class ProgressResponse(BaseModel):
    chapter: str
    updated_at: datetime

    class Config:
        orm_mode = True


class TransactionResponse(BaseModel):
    amount: Decimal
    transaction_type: str
    description: str | None
    created_at: datetime

    class Config:
        orm_mode = True


class UserSummaryResponse(BaseModel):
    telegram_id: int
    username: str | None
    first_seen: datetime
    balance: Decimal | None = None
    current_chapter: str | None = None


class UserDetailResponse(UserSummaryResponse):
    progress: list[ProgressResponse]
    transactions: list[TransactionResponse]


class UserCreateRequest(BaseModel):
    telegram_id: int = Field(..., ge=1)
    username: str | None = None


class ProgressUpdateRequest(BaseModel):
    chapter: str = Field(..., min_length=1)


class RewardRequest(BaseModel):
    telegram_id: int = Field(..., ge=1)
    amount: condecimal(max_digits=10, decimal_places=2, gt=0)
    reason: str = Field(..., min_length=1)
    metadata: Mapping[str, str] | None = None


class RewardResponse(BaseModel):
    transaction_id: str
    status: str
    amount: Decimal
    processed_at: str


def _build_user_summary(user: User) -> UserSummaryResponse:
    progress_entries = sorted(
        user.progress,
        key=lambda item: item.updated_at or datetime.min,
        reverse=True,
    )
    balance = user.real_balance.amount if user.real_balance else None
    current_chapter = progress_entries[0].chapter if progress_entries else None

    return UserSummaryResponse(
        telegram_id=user.telegram_id,
        username=user.username,
        first_seen=user.first_seen,
        balance=balance,
        current_chapter=current_chapter,
    )


def _build_user_detail(user: User) -> UserDetailResponse:
    summary = _build_user_summary(user)
    progress_entries = sorted(
        user.progress,
        key=lambda item: item.updated_at or datetime.min,
        reverse=True,
    )
    transaction_entries = sorted(
        user.transactions,
        key=lambda item: item.created_at or datetime.min,
        reverse=True,
    )

    return UserDetailResponse(
        **summary.dict(),
        progress=[ProgressResponse.from_orm(entry) for entry in progress_entries],
        transactions=[TransactionResponse.from_orm(entry) for entry in transaction_entries],
    )


def _create_token_service(settings: Settings, database: Database) -> TokenService:
    global_rate_limiter = RateLimiter(settings.real_rate_limit_per_minute)
    anti_cheat = AntiCheatEngine(
        max_amount=Decimal(settings.real_mock_max_amount),
        required_metadata_keys=["challenge_id"],
    )
    audit_logger = AuditLogger(session_factory=database.session)

    if settings.real_mode == "mock":
        adapter = MockRealTokenAdapter(
            max_amount=Decimal(settings.real_mock_max_amount),
            rate_limiter=global_rate_limiter,
        )
    else:
        signature_service = SignatureService(settings.real_api_secret or "")
        adapter = ProductionRealTokenAdapter(
            base_url=settings.real_api_base_url,
            api_key=settings.real_api_key or "",
            signature_service=signature_service,
            rate_limiter=global_rate_limiter,
        )

    return TokenService(
        database=database,
        adapter=adapter,
        audit_logger=audit_logger,
        anti_cheat=anti_cheat,
        per_user_rate_limiter=RateLimiter(settings.real_rate_limit_per_minute),
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings(require_bot_token=False)

    database = Database(settings.database_url)
    database.create_all()
    token_service = _create_token_service(settings, database)

    app = FastAPI(title="REAL Shahnameh API", version="1.0.0")
    app.state.settings = settings
    app.state.database = database
    app.state.token_service = token_service

    def get_session() -> Iterator[Session]:
        with database.session() as session:
            yield session

    def get_token_service() -> TokenService:
        return token_service

    @app.get("/health", response_model=dict)
    def healthcheck() -> Mapping[str, str]:
        return {"status": "ok"}

    @app.get("/users", response_model=list[UserSummaryResponse])
    def list_users(
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
        session: Session = Depends(get_session),
    ) -> list[UserSummaryResponse]:
        stmt = (
            select(User)
            .options(selectinload(User.progress), selectinload(User.real_balance))
            .order_by(User.first_seen.desc())
            .offset(offset)
            .limit(limit)
        )
        users = session.scalars(stmt).all()
        return [_build_user_summary(user) for user in users]

    @app.post(
        "/users",
        response_model=UserDetailResponse,
        status_code=status.HTTP_201_CREATED,
    )
    def create_user(
        payload: UserCreateRequest,
        session: Session = Depends(get_session),
    ) -> UserDetailResponse:
        existing = session.scalar(select(User).where(User.telegram_id == payload.telegram_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

        user = User(telegram_id=payload.telegram_id, username=payload.username)
        session.add(user)
        session.flush()

        session.add(RealBalance(user_id=user.id, amount=Decimal("0")))
        session.add(Progress(user_id=user.id, chapter="intro"))
        session.add(
            Transaction(
                user_id=user.id,
                amount=Decimal("0"),
                transaction_type="account_created",
                description="Account created via API",
            )
        )

        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(
                selectinload(User.progress),
                selectinload(User.real_balance),
                selectinload(User.transactions),
            )
        )
        created_user = session.scalars(stmt).one()
        return _build_user_detail(created_user)

    @app.get("/users/{telegram_id}", response_model=UserDetailResponse)
    def get_user(
        telegram_id: int,
        session: Session = Depends(get_session),
    ) -> UserDetailResponse:
        stmt = (
            select(User)
            .where(User.telegram_id == telegram_id)
            .options(
                selectinload(User.progress),
                selectinload(User.real_balance),
                selectinload(User.transactions),
            )
        )
        user = session.scalars(stmt).one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return _build_user_detail(user)

    @app.post("/users/{telegram_id}/progress", response_model=ProgressResponse)
    def record_progress(
        telegram_id: int,
        payload: ProgressUpdateRequest,
        session: Session = Depends(get_session),
    ) -> ProgressResponse:
        user = session.scalar(select(User).where(User.telegram_id == telegram_id))
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        progress = Progress(user_id=user.id, chapter=payload.chapter)
        session.add(progress)
        session.flush()
        session.refresh(progress)
        return ProgressResponse.from_orm(progress)

    @app.post("/rewards", response_model=RewardResponse)
    def reward_user(
        payload: RewardRequest,
        service: TokenService = Depends(get_token_service),
    ) -> RewardResponse:
        metadata = dict(payload.metadata or {})
        try:
            transaction: RealTokenTransaction = service.reward_user(
                telegram_id=payload.telegram_id,
                amount=payload.amount,
                reason=payload.reason,
                metadata=metadata,
            )
        except TokenIssuanceFailed as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        return RewardResponse(
            transaction_id=transaction.transaction_id,
            status=transaction.status,
            amount=transaction.amount,
            processed_at=transaction.processed_at,
        )

    return app


app = create_app()
