# app/repositories/attachment_repository.py
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attachment import Attachment


class AttachmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, attachment: Attachment) -> Attachment:
        """Add attachment to session, flush, and refresh."""
        self.db.add(attachment)
        await self.db.flush()
        await self.db.refresh(attachment)
        return attachment

    async def get_by_id(self, attachment_id: UUID) -> Attachment | None:
        """Fetch attachment by ID."""
        result = await self.db.execute(
            select(Attachment).where(Attachment.id == attachment_id)
        )
        return result.scalar_one_or_none()

    async def list_for_card(self, card_id: UUID) -> list[Attachment]:
        """List all attachments for a card ordered by created_at descending."""
        query = (
            select(Attachment)
            .where(Attachment.card_id == card_id)
            .order_by(Attachment.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete(self, attachment: Attachment) -> None:
        """Delete attachment and flush."""
        await self.db.delete(attachment)
        await self.db.flush()