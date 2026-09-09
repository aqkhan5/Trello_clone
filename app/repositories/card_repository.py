# Data-access operations for cards, including list ordering and archiving.

# Typed identifiers and SQLAlchemy query/session helpers.
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

# Card entity queried and persisted by this repository.
from app.models.card import Card


# Repository layer for card persistence.
# Transaction commits are handled by the service layer that calls this class.
class CardRepository:
    def __init__(self, db: AsyncSession):
        # Reuse the request-scoped async database session.
        self.db = db

    async def create(self, card: Card) -> Card:
        """Add card, flush, and refresh."""
        # Flush makes the INSERT visible in the current transaction without committing.
        self.db.add(card)
        await self.db.flush()
        # Refresh loads database-generated fields before returning the card.
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
        # Archived cards are hidden by default; callers can request them explicitly.
        query = select(Card).where(Card.list_id == list_id)
        if not include_archived:
            query = query.where(Card.is_archived.is_(False))

        # Position determines the visual order of cards within the list.
        query = query.order_by(Card.position.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_max_position(self, list_id: UUID) -> Decimal | None:
        """Get the highest current position value within a list."""
        # Services use this value when calculating a new card's position.
        query = select(func.max(Card.position)).where(Card.list_id == list_id)
        result = await self.db.execute(query)
        return result.scalar()

    async def delete(self, card: Card) -> None:
        """Delete card and flush."""
        # Flush the deletion now; the surrounding service decides when to commit.
        await self.db.delete(card)
        await self.db.flush()