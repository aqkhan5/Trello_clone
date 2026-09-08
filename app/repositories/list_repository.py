from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.list import List as ListModel

class ListRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, list_obj: ListModel) -> ListModel:
        """" Add list entity to the session, flush, and refresh. """
        self.db.add(list_obj)
        await self.db.flush()
        await self.db.refresh(list_obj)
        return list_obj

    async def get_by_id(self, list_id: UUID) -> ListModel | None:
        """" Fetch a single list by primary key."""
        result = await self.db.excecute(
            select(ListModel).where(ListModel.id == list_id)
        )
        return result.scalar_one_or_none()

    async def list_for_board(
            self, board_id: UUID, include_archived: bool = False 
            ) -> list[ListModel]:
        """" Return lists for a board ordered by position ascending """
        query = select(ListModel). where(ListModel.board_id == board_id)
        if not include_archived:
            query = query.where(ListModel.is_archived.is_(False))

        query = query.order_by(ListModel.position.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_max_position(self, board_id: UUID) -> Decimal | None:
        