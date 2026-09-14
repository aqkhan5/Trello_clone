# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from uuid import UUID
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

# ---------------------------------------------------------------------------
# Repository: WorkspaceRepository
# ---------------------------------------------------------------------------
# Handles database operations for workspaces and workspace members.
class WorkspaceRepository:
    def __init__ (self, db: AsyncSession):
        self.db = db

    async def create(self, workspace: Workspace) -> Workspace:
        self.db.add(workspace)
        await self.db.flush()
        await self.db.refresh(workspace)
        return workspace

    async def get_by_id(self, workspace_id: UUID) -> Workspace | None:
        result = await self.db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        return result.scalar_one_or_none()

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

    
    async def add_member(self, member: WorkspaceMember) -> WorkspaceMember:
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_member(
            self, workspace_id: UUID, user_id: UUID
    ) -> WorkspaceMember | None :
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id==workspace_id,
            WorkspaceMember.user_id == user_id
            )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_members(self, workspace_id: UUID) -> list[WorkspaceMember]:
        query = (
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .options(selectinload(WorkspaceMember.user))
            .order_by(WorkspaceMember.joined_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def remove_member(self, member: WorkspaceMember) -> None:
        await self.db.delete(member)
        await self.db. flush()

    async def delete(self, workspace: Workspace) -> None:
        await self.db.delete(workspace)
        await self.db.flush()
