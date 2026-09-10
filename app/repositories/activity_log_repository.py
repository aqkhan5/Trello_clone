from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity_log import ActivityLog


class ActivityLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: ActivityLog) -> ActivityLog:
        """Add activity log to session and flush."""
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_for_entity(
        self, entity_type: str, entity_id: UUID
    ) -> list[ActivityLog]:
        """Query activity logs by entity type and ID, ordered by created_at descending."""
        query = (
            select(ActivityLog)
            .where(
                ActivityLog.entity_type == entity_type,
                ActivityLog.entity_id == entity_id,
            )
            .options(selectinload(ActivityLog.user))
            .order_by(ActivityLog.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())