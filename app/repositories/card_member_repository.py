# Purpose: Provide database operations for assigning users to cards.
# Working: Queries and flushes assignments through one session; the service commits transactions.

# Typed IDs and SQLAlchemy async query/session helpers.
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Models used for card assignments and nested user details.
from app.models.card_member import CardMember
from app.models.user import User


# Repository for card-member assignment persistence.
# Business validation and transaction commits belong to the service layer.
class CardMemberRepository:
    def __init__(self, db: AsyncSession):
        # Reuse the request-scoped database session.
        self.db = db

    async def get_member(self, card_id: UUID, user_id: UUID) -> CardMember | None:
        """Query card_members by composite primary key."""
        # A card ID and user ID together identify one assignment.
        query = select(CardMember).where(
            CardMember.card_id == card_id,
            CardMember.user_id == user_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def assign_member(self, card_id: UUID, user_id: UUID) -> CardMember:
        """Assign user to card, flush, and refresh."""
        # Create the assignment without committing; the caller controls the transaction.
        member = CardMember(card_id=card_id, user_id=user_id)
        self.db.add(member)
        await self.db.flush()
        # Reload generated fields such as the assignment timestamp.
        await self.db.refresh(member)
        return member

    async def remove_member(self, member: CardMember) -> None:
        """Delete assignment from session."""
        # Remove the link while keeping both the card and user records intact.
        await self.db.delete(member)
        await self.db.flush()

    async def list_card_members(self, card_id: UUID) -> list[CardMember]:
        """List all members assigned to card with eagerly loaded user details."""
        # Eager loading prevents one extra user query for every returned assignment.
        query = (
            select(CardMember)
            .where(CardMember.card_id == card_id)
            .options(selectinload(CardMember.user))
            # Preserve assignment history order in API responses.
            .order_by(CardMember.assigned_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())