from uuid import UUID
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

class WorkspaceRepository:
    def __init__ (self, db: AsyncSession):
        self.db = db

    # Add workspace to session, flush, and refresh
    async def create(self, workspace: Workspace) -> Workspace:
        self.db.add(workspace)
        await self.db.flush()
        await self.db.refresh(workspace)
        return workspace


    # Fetch workspace by primary key.
    async def get_by_id(self, workspace_id: UUID) -> Workspace | None:
        result = await self.db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        return result.scalar_one_or_none()


    # Query workspaces where the user is either the owner or an active member.
    async def list_for_user(self, user_id: UUID) -> list[Workspace]:
        query = (
            select(Workspace).outerjoin(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id).
                   where(
                       or_(
                           Workspace.owner_id == user_id,
                           WorkspaceMember.user_id == user_id
                       )
                   )
                   .distinct()
                   .order_by(Workspace.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    
    # Add a member entity to the session and flush
    async def add_member(self, member: WorkspaceMember) -> WorkspaceMember:
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    # Query workspace_members filtered by composite (workspace_id, user_id).
    async def get_member(
            self, workspace_id: UUID, user_id: UUID
    ) -> WorkspaceMember | None :
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id==workspace_id,
            WorkspaceMember.user_id == user_id
            )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    # Return all workspace members with their user relation eagerly loaded.
    async def list_members(self, workspace_id: UUID) -> list[WorkspaceMember]:
        query = ( select(WorkspaceMember)
        .where( WorkspaceMember.workspace_id == workspace_id )
        .options(selectinload(WorkspaceMember.user))
        .order_by(WorkspaceMember.joined_at.asc())

        )
        