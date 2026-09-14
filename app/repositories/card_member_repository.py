from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.card_member import CardMember
from app.models.user import User

class CardMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_member(self, card_id: UUID, user_id: UUID) -> CardMember | None:
        """Query card_members by composite primary key."""
        query = select(CardMember).where(
            CardMember.card_id == card_id,
            CardMember.user_id == user_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def assign_member(self, card_id: UUID, user_id: UUID) -> CardMember:
        """Assign user to card, flush, and refresh."""
        member = CardMember(card_id=card_id, user_id=user_id)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def remove_member(self, member: CardMember) -> None:
        """Delete assignment from session."""
        await self.db.delete(member)
        await self.db.flush()

    async def list_card_members(self, card_id: UUID) -> list[CardMember]:
        """List all members assigned to card with eagerly loaded user details."""
        query = (
            select(CardMember)
            .where(CardMember.card_id == card_id)
            .options(selectinload(CardMember.user))
            .order_by(CardMember.assigned_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
