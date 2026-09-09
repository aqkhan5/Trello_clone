# Business logic for card creation, editing, ordering, movement, and deletion.

# Numeric positions allow cards to be inserted or moved without renumbering
# every other card in the list.
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.repositories.card_repository import CardRepository
from app.repositories.list_repository import ListRepository
from app.schemas.card import CardCreate, CardMove, CardUpdate

# Used as the initial position and as the default spacing between new cards.
DEFAULT_POSITION_STEP = Decimal("65536.0")


# Coordinates card business rules and owns transaction commits.
# Repository classes perform database operations but do not commit changes.
class CardService:
    def __init__(
        self,
        card_repo: CardRepository,
        list_repo: ListRepository,
        db: AsyncSession,
    ):
        # Repositories share the same request-scoped database session.
        self.card_repo = card_repo
        self.list_repo = list_repo
        self.db = db

    async def create_card(
        self, list_id: UUID, user_id: UUID, data: CardCreate
    ) -> Card:
        """Create a card with calculated fractional position if omitted."""
        # Respect an explicitly supplied position; otherwise append after the
        # current last card using the configured spacing step.
        if data.position is not None:
            assigned_position = data.position
        else:
            max_pos = await self.card_repo.get_max_position(list_id)
            if max_pos is not None:
                assigned_position = max_pos + DEFAULT_POSITION_STEP
            else:
                assigned_position = DEFAULT_POSITION_STEP

        # New cards start active and inherit the authenticated user as creator.
        card = Card(
            list_id=list_id,
            created_by=user_id,
            title=data.title,
            description=data.description,
            due_date=data.due_date,
            is_completed=data.is_completed,
            position=assigned_position,
            is_archived=False,
        )
        # Persist and commit the complete card creation before returning it.
        await self.card_repo.create(card)
        await self.db.commit()
        await self.db.refresh(card)
        return card

    async def update_card(self, card: Card, data: CardUpdate) -> Card:
        """Apply updates to card entity and commit."""
        # Partial updates change only fields supplied by the caller.
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(card, key, value)

        await self.db.commit()
        await self.db.refresh(card)
        return card

    async def move_card(self, card: Card, data: CardMove) -> Card:
        """Move card within same list or across lists with new fractional position."""
        # When crossing lists, verify the destination exists before changing the
        # card's foreign key. Same-list moves only need a new position.
        if card.list_id != data.target_list_id:
            target_list = await self.list_repo.get_by_id(data.target_list_id)
            if not target_list:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target list not found",
                )
            card.list_id = data.target_list_id

        # The caller supplies the destination position, preserving list ordering.
        
        if data.position is not None:
            card.position = data.position

        await self.db.commit()
        await self.db.refresh(card)
        return card

    async def delete_card(self, card: Card) -> None:
        """Delete card from database and commit."""
        # Repository deletion is flushed first; this service commits the transaction.
        await self.card_repo.delete(card)
        await self.db.commit()