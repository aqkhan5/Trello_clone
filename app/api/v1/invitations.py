from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.api.deps import (
    get_current_user,
    get_invitation_service,
    require_workspace_admin,
)
from app.core.notifications import send_invitation_email
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace_invitation import (
    InvitationCreate,
    InvitationResponse,
    TrelloNotificationItemResponse,
)
from app.schemas.workspace_member import WorkspaceMemberResponse
from app.services.invitation_service import InvitationService

router = APIRouter(tags=["Invitations & Notifications"])


@router.post(
    "/workspaces/{workspace_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a member to a workspace (Admin/Owner only)",
)
async def invite_workspace_member(
    workspace_id: UUID,
    payload: InvitationCreate,
    background_tasks: BackgroundTasks,
    workspace: Workspace = Depends(require_workspace_admin),
    current_user: User = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
):
    """Create an invitation and send a transactional notification in the background."""
    invitation = await service.create_invitation(
        workspace_id=workspace_id,
        current_user_id=current_user.id,
        data=payload,
    )

    # Queue transactional notification in background
    background_tasks.add_task(
        send_invitation_email,
        recipient_email=invitation.email,
        workspace_name=workspace.name,
        token=invitation.token,
    )

    return invitation


@router.get(
    "/invitations/my-pending",
    response_model=list[TrelloNotificationItemResponse],
    summary="Get pending invitations for in-app notification bell",
)
async def get_my_pending_invitations(
    current_user: User = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
):
    """Retrieve all active, unexpired pending invitations addressed to the logged-in user."""
    return await service.list_pending_invitations_for_user(current_user)


@router.post(
    "/invitations/{token}/accept",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept workspace invitation (Direct link or Notification Bell)",
)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
):
    """Accept invitation and become an active workspace member."""
    return await service.accept_invitation(token=token, current_user=current_user)


@router.post(
    "/invitations/{token}/decline",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Decline workspace invitation",
)
async def decline_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
):
    """Decline and dismiss an active invitation."""
    await service.decline_invitation(token=token, current_user=current_user)
    return None