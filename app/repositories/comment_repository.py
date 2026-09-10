from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment


class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, comment: Comment) -> Comment:
        """Add comment to session, flush, and refresh."""
        self.db.add(comment)
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def get_by_id(self, comment_id: UUID) -> Comment | None:
        """Fetch a single comment with user eagerly loaded."""
        query = (
            select(Comment)
            .where(Comment.id == comment_id)
            .options(selectinload(Comment.user))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_for_card(self, card_id: UUID) -> list[Comment]:
        """Fetch comments for card ordered by created_at descending."""
        query = (
            select(Comment)
            .where(Comment.card_id == card_id)
            .options(selectinload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete(self, comment: Comment) -> None:
        """Delete comment and flush."""
        await self.db.delete(comment)
        await self.db.flush()