# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ---------------------------------------------------------------------------
# Database Connection Engine
# ---------------------------------------------------------------------------
# Async engine that manages connections to the PostgreSQL database
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True
)

# Factory that generates database sessions for queries
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# ---------------------------------------------------------------------------
# Database Session Dependency
# ---------------------------------------------------------------------------
# Provides a database session for each API request and automatically closes it
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
