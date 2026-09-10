# Purpose: Provide database operations for board labels and card-label links.
# Working: Queries and flushes changes through one session; the service commits transactions.

# Typed IDs and SQLAlchemy async query/session helpers.
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Models persisted and queried by this repository.
from app.models.card_label import CardLabel
from app.models.label import Label


# Repository for label taxonomy and card-label associations.
# It does not enforce business rules or commit transactions.
class LabelRepository:
    def __init__(self, db: AsyncSession):
        # Reuse the request-scoped database session for every operation.
        self.db = db

    async def create(self, label: Label) -> Label:
        """Add label, flush, and refresh."""
        # Flush the INSERT without committing, then reload generated fields.
        self.db.add(label)
        await self.db.flush()
        await self.db.refresh(label)
        return label

    async def get_by_id(self, label_id: UUID) -> Label | None:
        """Fetch label by ID."""
        result = await self.db.execute(select(Label).where(Label.id == label_id))
        return result.scalar_one_or_none()

    async def list_for_board(self, board_id: UUID) -> list[Label]:
        """Fetch all taxonomy labels defined for a board."""
        # Keep board labels alphabetically ordered for predictable API responses.
        query = select(Label).where(Label.board_id == board_id).order_by(Label.name.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_card_label(self, card_id: UUID, label_id: UUID) -> CardLabel | None:
        """Fetch association between a card and a label."""
        # The card/label pair identifies one association record.
        query = select(CardLabel).where(
            CardLabel.card_id == card_id,
            CardLabel.label_id == label_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def attach_to_card(self, card_id: UUID, label_id: UUID) -> CardLabel:
        """Create card-label attachment and flush."""
        # Create the many-to-many link; the caller decides when to commit it.
        card_label = CardLabel(card_id=card_id, label_id=label_id)
        self.db.add(card_label)
        await self.db.flush()
        return card_label

    async def detach_from_card(self, card_label: CardLabel) -> None:
        """Delete card-label attachment and flush."""
        # Remove only the association, leaving both the card and label intact.
        await self.db.delete(card_label)
        await self.db.flush()

    async def list_for_card(self, card_id: UUID) -> list[Label]:
        """Retrieve all labels assigned to a card."""
        # Join through the association table and return labels alphabetically.
        query = (
            select(Label)
            .join(CardLabel, Label.id == CardLabel.label_id)
            .where(CardLabel.card_id == card_id)
            .order_by(Label.name.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete(self, label: Label) -> None:
        """Delete label taxonomy and flush."""
        # Delete the label record; related links follow configured cascade rules.
        await self.db.delete(label)
        await self.db.flush()