from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _make_engine():
    settings = get_settings()
    connect_args: dict = {}
    if settings.is_sqlite:
        # SQLite requires check_same_thread=False for async use
        connect_args = {"check_same_thread": False}
    elif settings.is_postgres:
        try:
            import asyncpg  # noqa: F401
        except ImportError as e:
            raise RuntimeError(
                "asyncpg is required for PostgreSQL. Install it with:\n"
                "  pip install asyncpg\n"
                "Note: asyncpg requires Microsoft C++ Build Tools on Windows.\n"
                "Alternatively, use SQLite by setting DATABASE_URL=sqlite+aiosqlite:///./umlforge.db"
            ) from e
    return create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _make_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def create_all_tables() -> None:
    """Create all tables in the database (used in tests and SQLite mode)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
