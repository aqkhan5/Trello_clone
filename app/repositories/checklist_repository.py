# app/repositories/checklist_repository.py
# Purpose: Provide database operations for checklists and their checklist items.
# Working: Queries and flushes changes through one session; the service commits transactions.

# Typed IDs, position calculations, and SQLAlchemy async query/session helpers.
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Models managed by this repository.
from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem


# Repository for checklist and checklist-item persistence.
# Business rules and transaction commits belong to the service layer.
class ChecklistRepository:
    def __init__(self, db: AsyncSession):
        # Reuse the request-scoped database session for all operations.
        self.db = db

   
    # Checklist persistence and ordering

    async def create_checklist(self, checklist: Checklist) -> Checklist:
        """Add checklist, flush, and refresh."""
        # Flush the INSERT without committing, then reload generated fields.
        self.db.add(checklist)
        await self.db.flush()
        await self.db.refresh(checklist)
        return checklist

    async def get_checklist_by_id(self, checklist_id: UUID) -> Checklist | None:
        """Fetch checklist with items eagerly loaded."""
        # Load items with the checklist so response serialization avoids extra queries.
        query = (
            select(Checklist)
            .where(Checklist.id == checklist_id)
            .options(selectinload(Checklist.items))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_checklists_for_card(self, card_id: UUID) -> list[Checklist]:
        """Fetch all checklists for card with items eagerly loaded and sorted by position."""
        # Checklists are ordered by position; their nested items are sorted below too.
        query = (
            select(Checklist)
            .where(Checklist.card_id == card_id)
            .options(selectinload(Checklist.items))
            .order_by(Checklist.position.asc())
        )
        result = await self.db.execute(query)
        checklists = list(result.scalars().all())
        for cl in checklists:
            cl.items.sort(key=lambda item: item.position)
        return checklists

    async def get_max_checklist_position(self, card_id: UUID) -> Decimal | None:
        """Get highest position value among checklists in a card."""
        # Services use this value to append a checklist at the end of a card.
        query = select(func.max(Checklist.position)).where(
            Checklist.card_id == card_id
        )
        result = await self.db.execute(query)
        return result.scalar()

    async def delete_checklist(self, checklist: Checklist) -> None:
        """Delete checklist and flush."""
        # Flush the deletion; the service decides when the transaction is committed.
        await self.db.delete(checklist)
        await self.db.flush()

    # Checklist-item persistence and ordering helpers

    async def create_item(self, item: ChecklistItem) -> ChecklistItem:
        """Add item, flush, and refresh."""
        # Persist the item without committing and reload generated fields.
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def get_item_by_id(self, item_id: UUID) -> ChecklistItem | None:
        """Fetch checklist item by ID."""
        # Return the item when found; callers handle the missing-item case.
        result = await self.db.execute(
            select(ChecklistItem).where(ChecklistItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_max_item_position(self, checklist_id: UUID) -> Decimal | None:
        """Get highest position value among items in a checklist."""
        # Services use this value to calculate the next item's position.
        query = select(func.max(ChecklistItem.position)).where(
            ChecklistItem.checklist_id == checklist_id
        )
        result = await self.db.execute(query)
        return result.scalar()

    async def delete_item(self, item: ChecklistItem) -> None:
        """Delete checklist item and flush."""
        # Remove the item while leaving commit control to the service layer.
        await self.db.delete(item)
        await self.db.flush()