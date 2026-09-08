from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# 1. Create the async database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True  # Set to False in production; True helps see SQL queries during development
)

# 2. Create the async session
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)
# 3. FastAPI dependency for handling DB sessions per request
# Request-scoped database session dependency.
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
