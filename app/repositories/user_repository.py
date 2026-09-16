import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Fetch a user by primary key."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Fetch a user by email address."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_reset_token_hash(self, token_hash: str) -> User | None:
        """Fetch a user with a matching reset token hash that hasn't expired."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(User).where(
                User.reset_token_hash == token_hash,
                User.reset_token_expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        """Add to session, flush, and refresh."""
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
