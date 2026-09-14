from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate

class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository, db: AsyncSession):
        self.workspace_repo = workspace_repo
        self.db = db

    async def create_workspace(
        self, user_id: UUID, data: WorkspaceCreate
    ) -> Workspace:
        """Create workspace and assign owner as ADMIN in a single transaction."""
        workspace = Workspace(
            name=data.name,
            description=data.description,
            owner_id=user_id,
        )
        await self.workspace_repo.create(workspace)

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id,
            role=WorkspaceRole.ADMIN,
        )
        await self.workspace_repo.add_member(member)

        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def update_workspace(
        self, workspace: Workspace, data: WorkspaceUpdate
    ) -> Workspace:
        """Update workspace fields and commit."""
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(workspace, key, value)

        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def delete_workspace(self, workspace: Workspace) -> None:
        """Delete workspace and all dependent rows committed by cascade."""
        await self.workspace_repo.delete(workspace)
        await self.db.commit()

    async def update_member_role(
        self, workspace: Workspace, target_user_id: UUID, new_role: WorkspaceRole
    ) -> WorkspaceMember:
        """Update member role enforcing that workspace owner cannot be demoted."""
        if workspace.owner_id == target_user_id and new_role != WorkspaceRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The workspace owner cannot be demoted from ADMIN",
            )

        member = await self.workspace_repo.get_member(workspace.id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace member not found",
            )

        member.role = new_role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(
        self, workspace: Workspace, target_user_id: UUID
    ) -> None:
        """Remove member enforcing that workspace owner cannot be removed."""
        if workspace.owner_id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The workspace owner cannot be removed from the workspace",
            )

        member = await self.workspace_repo.get_member(workspace.id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace member not found",
            )

        await self.workspace_repo.remove_member(member)
        await self.db.commit()
