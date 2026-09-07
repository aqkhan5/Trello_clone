# Imports — Standard library, FastAPI exceptions, SQLAlchemy session,
# workspace models, repository layer, and request/response schemas

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


# WorkspaceService — Business logic for workspace CRUD and membership management.
# Receives a WorkspaceRepository and an AsyncSession via constructor injection.

class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository, db: AsyncSession):
        self.workspace_repo = workspace_repo
        self.db = db

    # Create — Persist a new workspace and auto-assign the creator as ADMIN member.
    # Both inserts happen within a single DB transaction (committed at the end).

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

    # Update — Apply partial updates to workspace fields (name, description, etc.).
    # Only fields present in the request payload are modified (exclude_unset).

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

    # Delete — Remove the workspace entirely.
    # Dependent rows (members, boards, etc.) are cleaned up via DB cascade rules.

    async def delete_workspace(self, workspace: Workspace) -> None:
        """Delete workspace and all dependent rows committed by cascade."""
        await self.workspace_repo.delete(workspace)
        await self.db.commit()

    # Update Member Role — Change a member's role within the workspace.
    # Guard: the workspace owner can never be demoted below ADMIN.
    # Raises 404 if the target user is not a member of the workspace.

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

    # Remove Member — Delete a user's membership from the workspace.
    # Guard: the workspace owner cannot be removed (use delete_workspace instead).
    # Raises 404 if the target user is not a member of the workspace.

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