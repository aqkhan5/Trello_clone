# app/api/v1/workspaces.py

# Standard library and framework imports.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_workspace_admin,
    require_workspace_member,
)
from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.schemas.workspace_member import (
    WorkspaceMemberResponse,
    WorkspaceMemberUpdate,
)
from app.services.workspace_service import WorkspaceService

# All routes in this module are exposed under /workspaces.
router = APIRouter(prefix="/workspaces", tags=["Workspaces"])



# Workspace Endpoints
# Create a workspace for the authenticated user.
@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace",
)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """Create a workspace and assign creator as ADMIN in a single transaction."""
    # The service coordinates workspace creation and owner membership in one transaction.
    workspace_repo = WorkspaceRepository(db)
    workspace_service = WorkspaceService(workspace_repo, db)
    return await workspace_service.create_workspace(current_user.id, payload)


# Return every workspace that the authenticated user owns or belongs to.
@router.get(
    "",
    response_model=list[WorkspaceResponse],
    status_code=status.HTTP_200_OK,
    summary="List all accessible workspaces",
)
async def list_my_workspaces(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Workspace]:
    """Retrieve all workspaces where the current user is owner or member."""
    # Listing is a read-only repository query, so no service layer is needed here.
    workspace_repo = WorkspaceRepository(db)
    return await workspace_repo.list_for_user(current_user.id)


# Get one workspace after membership authorization has succeeded.
@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get workspace details",
)
async def get_workspace(
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
) -> Workspace:
    """Fetch workspace details if current user is an authorized member."""
    # The dependency performs the lookup and access check before this handler runs.
    workspace, _ = workspace_and_member
    return workspace


# Update workspace fields; only administrators or the owner may do this.
@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update workspace details",
)
async def update_workspace(
    payload: WorkspaceUpdate,
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """Update workspace name or description (Requires ADMIN or Owner)."""
    # Authorization is handled by require_workspace_admin; the service applies the update.
    workspace, _ = workspace_and_member
    workspace_repo = WorkspaceRepository(db)
    workspace_service = WorkspaceService(workspace_repo, db)
    return await workspace_service.update_workspace(workspace, payload)


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workspace",
)
async def delete_workspace(
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Delete a workspace and cascade all child records (Requires ADMIN or Owner)."""
    # The service handles deletion and commits the transaction before returning 204.
    workspace, _ = workspace_and_member
    workspace_repo = WorkspaceRepository(db)
    workspace_service = WorkspaceService(workspace_repo, db)
    await workspace_service.delete_workspace(workspace)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Workspace Member Endpoints

# List members after confirming the requester belongs to the workspace.
@router.get(
    "/{workspace_id}/members",
    response_model=list[WorkspaceMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List workspace members",
)
async def list_workspace_members(
    workspace_id: UUID,
    _: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WorkspaceMember]:
    """List all members joined to the workspace (eager loads profile details)."""
    # The underscore marks the dependency result as intentionally unused here.
    workspace_repo = WorkspaceRepository(db)
    return await workspace_repo.list_members(workspace_id)


@router.patch(
    "/{workspace_id}/members/{user_id}",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Update member role",
)
async def update_member_role(
    user_id: UUID,
    payload: WorkspaceMemberUpdate,
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceMember:
    """Update member role. Enforces the rule that the workspace owner cannot be demoted."""
    # The admin dependency authorizes the requester; the service enforces owner-role rules.
    workspace, _ = workspace_and_member
    workspace_repo = WorkspaceRepository(db)
    workspace_service = WorkspaceService(workspace_repo, db)
    return await workspace_service.update_member_role(
        workspace=workspace, target_user_id=user_id, new_role=payload.role
    )


@router.delete(
    "/{workspace_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove member from workspace",
)
async def remove_workspace_member(
    user_id: UUID,
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Remove member from workspace. Enforces the rule that the workspace owner cannot be removed."""
    # The service validates the target and commits the membership deletion.
    workspace, _ = workspace_and_member
    workspace_repo = WorkspaceRepository(db)
    workspace_service = WorkspaceService(workspace_repo, db)
    await workspace_service.remove_member(
        workspace=workspace, target_user_id=user_id
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)