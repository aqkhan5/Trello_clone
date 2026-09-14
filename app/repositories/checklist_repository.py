from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem

class ChecklistRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

   

    async def create_checklist(self, checklist: Checklist) -> Checklist:
        """Add checklist, flush, and refresh."""
        self.db.add(checklist)
        await self.db.flush()
        await self.db.refresh(checklist)
        return checklist

    async def get_checklist_by_id(self, checklist_id: UUID) -> Checklist | None:
        """Fetch checklist with items eagerly loaded."""
        query = (
            select(Checklist)
            .where(Checklist.id == checklist_id)
            .options(selectinload(Checklist.items))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_checklists_for_card(self, card_id: UUID) -> list[Checklist]:
        """Fetch all checklists for card with items eagerly loaded and sorted by position."""
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
        query = select(func.max(Checklist.position)).where(
            Checklist.card_id == card_id
        )
        result = await self.db.execute(query)
        return result.scalar()

    async def delete_checklist(self, checklist: Checklist) -> None:
        """Delete checklist and flush."""
        await self.db.delete(checklist)
        await self.db.flush()

    async def create_item(self, item: ChecklistItem) -> ChecklistItem:
        """Add item, flush, and refresh."""
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def get_item_by_id(self, item_id: UUID) -> ChecklistItem | None:
        """Fetch checklist item by ID."""
        result = await self.db.execute(
            select(ChecklistItem).where(ChecklistItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_max_item_position(self, checklist_id: UUID) -> Decimal | None:
        """Get highest position value among items in a checklist."""
        query = select(func.max(ChecklistItem.position)).where(
            ChecklistItem.checklist_id == checklist_id
        )
        result = await self.db.execute(query)
        return result.scalar()

    async def delete_item(self, item: ChecklistItem) -> None:
        """Delete checklist item and flush."""
        await self.db.delete(item)
        await self.db.flush()
