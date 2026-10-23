from typing import AsyncGenerator, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Async Engine for FastAPI runtime
engine_kwargs: dict[str, Any] = {"echo": False}
if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

async_engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Sync engine for scripts/migrations if needed
sync_engine_kwargs: dict[str, Any] = {}
if "sqlite" in settings.SYNC_DATABASE_URL:
    sync_engine_kwargs["connect_args"] = {"check_same_thread": False}

sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    **sync_engine_kwargs
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
