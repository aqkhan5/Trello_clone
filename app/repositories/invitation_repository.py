# Standard library and SQLAlchemy imports used for typed database queries.
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Invitation entity and the enum used to identify active invitations.
from app.models.workspace_invitation import WorkspaceInvitation
from app.schemas.workspace_invitation import InvitationStatus


# Data-access layer for creating and querying workspace invitations.
class InvitationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        """Add invitation to the session, flush, and refresh."""
        self.db.add(invitation)
        await self.db.flush()
        await self.db.refresh(invitation)
        return invitation

    async def get_by_token(self, token: str) -> WorkspaceInvitation | None:
        """Fetch invitation by unique secure token with workspace eagerly loaded."""
        query = (
            select(WorkspaceInvitation)
            .options(selectinload(WorkspaceInvitation.workspace))
            .where(WorkspaceInvitation.token == token)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_pending_by_workspace_and_email(
        self, workspace_id: UUID, email: str
    ) -> WorkspaceInvitation | None:
        """Fetch active, unexpired pending invitation for a specific email within a workspace."""
        current_utc = datetime.now(timezone.utc)
        query = select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.email == email.lower(),
            WorkspaceInvitation.status == InvitationStatus.PENDING,
            WorkspaceInvitation.expires_at > current_utc,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_for_workspace(self, workspace_id: UUID) -> list[WorkspaceInvitation]:
        """List all invitations for a workspace ordered by creation date descending."""
        query = (
            select(WorkspaceInvitation)
            .where(WorkspaceInvitation.workspace_id == workspace_id)
            .order_by(WorkspaceInvitation.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_pending_for_email(self, email: str) -> list[WorkspaceInvitation]:
        """Fetch all valid, active invitations addressed to a user's email."""
        current_utc = datetime.now(timezone.utc)
        query = (
            select(WorkspaceInvitation)
            .options(selectinload(WorkspaceInvitation.workspace))
            .where(
                WorkspaceInvitation.email == email.lower(),
                WorkspaceInvitation.status == InvitationStatus.PENDING,
                WorkspaceInvitation.expires_at > current_utc,
            )
            .order_by(WorkspaceInvitation.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        """Flush changes to an existing invitation and refresh its state."""
        await self.db.flush()
        await self.db.refresh(invitation)
        return invitation