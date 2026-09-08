# Standard library and FastAPI imports used to define typed route handlers.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

# Authentication and authorization dependencies.
# These run before the endpoint body and reject unauthorized requests.
from app.api.deps import (
    get_current_user,
    require_workspace_admin,
)
from app.db.session import get_db

# Database models used as dependency results and endpoint return types.
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_member import WorkspaceMember

# Repositories provide database access for the invitation workflow.
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace_invitation import (
    InvitationCreate,
    InvitationResponse,
)
from app.schemas.workspace_member import WorkspaceMemberResponse

# Service layer where invitation validation and transaction rules are applied.
from app.services.invitation_service import InvitationService

# Invitation routes are tagged together in the generated API documentation.
router = APIRouter(tags=["Workspace Invitations"])


# Create an invitation. Workspace admin authorization is required.
@router.post(
    "/workspaces/{workspace_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a user to a workspace",
)
async def create_invitation(
    workspace_id: UUID,
    payload: InvitationCreate,
    workspace_and_admin: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceInvitation:
    """Send an invitation to join the workspace (Workspace Admin only)."""
    # The authorization dependency has already loaded the workspace and admin membership.
    workspace, admin_member = workspace_and_admin

    # All repositories share the request-scoped database session.
    invitation_repo = InvitationRepository(db)
    workspace_repo = WorkspaceRepository(db)
    user_repo = UserRepository(db)
    # The service coordinates duplicate checks, token generation, and persistence.
    service = InvitationService(invitation_repo, workspace_repo, user_repo, db)

    return await service.create_invitation(
        workspace=workspace, inviter_id=admin_member.user_id, data=payload
    )


# List invitations for a workspace. Workspace admin authorization is required.
@router.get(
    "/workspaces/{workspace_id}/invitations",
    response_model=list[InvitationResponse],
    status_code=status.HTTP_200_OK,
    summary="List pending invitations for a workspace",
)
async def list_workspace_invitations(
    workspace_id: UUID,
    _: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WorkspaceInvitation]:
    """Retrieve all pending invitations issued for this workspace."""
    # The underscore marks the authorization dependency result as intentionally unused.
    invitation_repo = InvitationRepository(db)
    # Listing is a read-only repository operation, so no service is needed.
    return await invitation_repo.list_for_workspace(workspace_id)


# Accept an invitation using its token and the currently authenticated account.
@router.post(
    "/invitations/{token}/accept",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept an invitation and join the workspace",
)
async def accept_invitation(
    token: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceMember:
    """Accept an invitation token using the authenticated account."""
    # Authentication supplies the current user; the service verifies that the
    # user's email matches the invitation and that the token is still valid.
    invitation_repo = InvitationRepository(db)
    workspace_repo = WorkspaceRepository(db)
    user_repo = UserRepository(db)
    # The service creates the workspace membership and marks the invitation accepted.
    service = InvitationService(invitation_repo, workspace_repo, user_repo, db)

    return await service.accept_invitation(token=token, current_user=current_user)