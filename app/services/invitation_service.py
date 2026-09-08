# Standard library utilities for secure tokens, expiry times, and UUIDs.
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

# FastAPI error responses and database session type.
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

# Database models used while creating and accepting invitations.
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_invitation import WorkspaceInvitation
from app.models.workspace_member import WorkspaceMember

# Repositories keep database queries separate from business rules.
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository

# Request data and the invitation lifecycle enum.
from app.schemas.workspace_invitation import InvitationCreate, InvitationStatus


# Business rules for inviting users to workspaces and accepting invitations.
# This service coordinates multiple repositories and owns the transaction flow.
class InvitationService:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        workspace_repo: WorkspaceRepository,
        user_repo: UserRepository,
        db: AsyncSession,
    ):
        # Each repository uses the same request-scoped database session.
        self.invitation_repo = invitation_repo
        self.workspace_repo = workspace_repo
        self.user_repo = user_repo
        self.db = db

    async def create_invitation(
        self, workspace: Workspace, inviter_id: UUID, data: InvitationCreate
    ) -> WorkspaceInvitation:
        """Create a workspace invitation adhering to duplicate and membership rules."""
        # Rule 1: An existing account must not receive an invitation if it is
        # already a member of this workspace.
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            member = await self.workspace_repo.get_member(workspace.id, existing_user.id)
            if member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this workspace",
                )

        # Rule 2: Prevent multiple active invitations for the same workspace
        # and email address. Non-pending invitations do not block a new one.
        pending_invite = await self.invitation_repo.get_pending_by_workspace_and_email(
            workspace_id=workspace.id, email=data.email
        )
        if pending_invite:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An active invitation already exists for this email",
            )

        # Generate an unpredictable token that the recipient will use to accept.
        token = secrets.token_urlsafe(32)

        # Invitations remain valid for seven days from creation.
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        # Build the pending invitation before saving it through the repository.
        invitation = WorkspaceInvitation(
            workspace_id=workspace.id,
            inviter_id=inviter_id,
            email=data.email,
            role=data.role,
            token=token,
            status=InvitationStatus.PENDING,
            expires_at=expires_at,
        )

        # Persist, commit, and refresh so the returned object contains database values.
        await self.invitation_repo.create(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)
        return invitation

    async def accept_invitation(self, token: str, current_user: User) -> WorkspaceMember:
        """Accept an invitation, validate email/expiry, and add member atomically."""
        # Find the invitation using the secure token from the acceptance request.
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )

        # A token can only be used while its invitation is still pending.
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is no longer valid",
            )

        # Compare timezone-aware UTC datetimes. Some database drivers may return
        # a naive datetime, so treat it as UTC before comparing.
        current_time = datetime.now(timezone.utc)
        invitation_expiry = invitation.expires_at
        if invitation_expiry.tzinfo is None:
            invitation_expiry = invitation_expiry.replace(tzinfo=timezone.utc)

        if invitation_expiry < current_time:
            # Record the expired state before rejecting the acceptance attempt.
            invitation.status = InvitationStatus.EXPIRED
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired",
            )

        # Only the account matching the invited email may accept this invitation.
        if current_user.email.lower() != invitation.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation was sent to a different email address",
            )

        # Create the membership using the role granted by the invitation.
        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=current_user.id,
            role=invitation.role,
        )
        # Add the member and mark the invitation accepted in the same transaction.
        await self.workspace_repo.add_member(member)

        invitation.status = InvitationStatus.ACCEPTED
        await self.db.commit()
        await self.db.refresh(member)
        return member