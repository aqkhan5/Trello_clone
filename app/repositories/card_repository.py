from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card

class CardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, card: Card) -> Card:
        """Add card, flush, and refresh."""
        self.db.add(card)
        await self.db.flush()
        await self.db.refresh(card)
        return card

    async def get_by_id(self, card_id: UUID) -> Card | None:
        """Fetch card by primary key."""
        result = await self.db.execute(select(Card).where(Card.id == card_id))
        return result.scalar_one_or_none()

    async def list_for_list(
        self, list_id: UUID, include_archived: bool = False
    ) -> list[Card]:
        """Fetch all cards belonging to a list, sorted by position."""
        query = select(Card).where(Card.list_id == list_id)
        if not include_archived:
            query = query.where(Card.is_archived.is_(False))

        query = query.order_by(Card.position.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_max_position(self, list_id: UUID) -> Decimal | None:
        """Get the highest current position value within a list."""
        query = select(func.max(Card.position)).where(Card.list_id == list_id)
        result = await self.db.execute(query)
        return result.scalar()

    async def delete(self, card: Card) -> None:
        """Delete card and flush."""
        await self.db.delete(card)
        await self.db.flush()
