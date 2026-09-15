from datetime import datetime, timedelta, timezone
import secrets
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_member import WorkspaceMember
from app.models.user import User

from app.repositories.invitation_repository import InvitationRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.repositories.user_repository import UserRepository

from app.schemas.workspace_invitation import (
    InvitationCreate,
    InvitationStatus,
)

class InvitationService:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        workspace_repo: WorkspaceRepository,
        user_repo: UserRepository,
        db: AsyncSession,
    ):
        self.invitation_repo = invitation_repo
        self.workspace_repo = workspace_repo
        self.user_repo = user_repo
        self.db = db

    async def create_invitation(
        self,
        workspace_id: UUID,
        current_user_id: UUID,
        data: InvitationCreate,
    ) -> WorkspaceInvitation:
        """Generate a secure workspace invitation if the user is not already a member."""
        normalized_email = data.email.lower()

        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        target_user = await self.user_repo.get_by_email(normalized_email)
        if target_user:
            existing_member = await self.workspace_repo.get_member(
                workspace_id=workspace_id, user_id=target_user.id
            )
            if existing_member or workspace.owner_id == target_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This user is already a member of the workspace",
                )

        active_invite = await self.invitation_repo.get_pending_by_workspace_and_email(
            workspace_id=workspace_id, email=normalized_email
        )
        if active_invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation has already been sent to this email address",
            )

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = WorkspaceInvitation(
            workspace_id=workspace_id,
            invited_by=current_user_id,
            email=normalized_email,
            role=data.role,
            token=token,
            status=InvitationStatus.PENDING,
            expires_at=expires_at,
        )

        created_invite = await self.invitation_repo.create(invitation)
        await self.db.commit()
        return created_invite

    async def list_pending_invitations_for_user(
        self, user: User
    ) -> list[WorkspaceInvitation]:
        """Retrieve all active pending invitations for the user's notification bell."""
        return await self.invitation_repo.list_pending_for_email(user.email)

    async def accept_invitation(
        self, token: str, current_user: User
    ) -> WorkspaceMember:
        """Validate token and atomically add the current user as a workspace member."""
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found or invalid link",
            )

        if invitation.email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation was addressed to a different email address",
            )

        current_utc = datetime.now(timezone.utc)
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This invitation is no longer active (status: {invitation.status})",
            )

        if invitation.expires_at <= current_utc:
            invitation.status = InvitationStatus.EXPIRED
            await self.invitation_repo.update(invitation)
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired",
            )

        existing_member = await self.workspace_repo.get_member(
            workspace_id=invitation.workspace_id, user_id=current_user.id
        )
        if existing_member:
            invitation.status = InvitationStatus.ACCEPTED
            await self.invitation_repo.update(invitation)
            await self.db.commit()
            return existing_member

        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=current_user.id,
            role=invitation.role,
        )
        self.db.add(member)

        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = current_utc
        await self.invitation_repo.update(invitation)

        await self.db.commit()
        await self.db.refresh(member)
        return member


    async def decline_invitation(
        self, token: str, current_user: User
    ) -> None:
        """Decline a pending invitation and mark its status as DECLINED."""
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found or invalid link",
            )

        if invitation.email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation was addressed to a different email address",
            )

        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is no longer pending",
            )

        invitation.status = InvitationStatus.DECLINED
        await self.invitation_repo.update(invitation)
        await self.db.commit()


    async def list_workspace_invitations(
        self, workspace_id: UUID
    ) -> list[WorkspaceInvitation]:
        """Fetch all invitations issued for a workspace (Admin view)."""
        return await self.invitation_repo.list_for_workspace(workspace_id)