# app/services/list_service.py
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.list import List as ListModel
from app.repositories.list_repository import ListRepository
from app.schemas.list import ListCreate, ListUpdate

DEFAULT_POSITION_STEP = Decimal("65536.0")


class ListService:
    def __init__(self, list_repo: ListRepository, db: AsyncSession):
        self.list_repo = list_repo
        self.db = db

    async def create_list(self, board_id: UUID, data: ListCreate) -> ListModel:
        """Create a new list with calculated fractional position if omitted."""
        if data.position is not None:
            assigned_position = data.position
        else:
            max_pos = await self.list_repo.get_max_position(board_id)
            if max_pos is not None:
                assigned_position = max_pos + DEFAULT_POSITION_STEP
            else:
                assigned_position = DEFAULT_POSITION_STEP

        list_obj = ListModel(
            board_id=board_id,
            title=data.title,
            position=assigned_position,
            is_archived=False,
        )
        await self.list_repo.create(list_obj)
        await self.db.commit()
        await self.db.refresh(list_obj)
        return list_obj

    async def update_list(self, list_obj: ListModel, data: ListUpdate) -> ListModel:
        """Apply updates to a list and commit."""
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(list_obj, key, value)

        await self.db.commit()
        await self.db.refresh(list_obj)
        return list_obj

    async def delete_list(self, list_obj: ListModel) -> None:
        """Delete list entity and commit."""
        await self.list_repo.delete(list_obj)
        await self.db.commit()