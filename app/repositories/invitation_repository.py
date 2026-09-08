
# Standard library and SQLAlchemy imports used for typed database queries.
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Invitation entity and the enum used to identify active invitations.
from app.models.workspace_invitation import WorkspaceInvitation
from app.schemas.workspace_invitation import InvitationStatus


# Data-access layer for creating and querying workspace invitations.
# Business rules belong in the service layer; this class focuses on database access.
class InvitationRepository:
    def __init__(self, db: AsyncSession):
        # Reuse the request-scoped session supplied by FastAPI.
        self.db = db

    async def create(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        """Add invitation to the session, flush, and refresh."""
        # Add the object without committing; the service controls the transaction.
        self.db.add(invitation)
        # Flush sends the INSERT so generated values and constraints are available.
        await self.db.flush()
        # Refresh reloads database-generated fields such as id and created_at.
        await self.db.refresh(invitation)
        return invitation

    async def get_by_token(self, token: str) -> WorkspaceInvitation | None:
        """Fetch invitation by unique secure token."""
        # Tokens are unique, so this query returns one invitation or None.
        result = await self.db.execute(
            select(WorkspaceInvitation).where(WorkspaceInvitation.token == token)
        )
        return result.scalar_one_or_none()

    async def get_pending_by_workspace_and_email(
        self, workspace_id: UUID, email: str
    ) -> WorkspaceInvitation | None:
        """Fetch active pending invitation for a specific email within a workspace."""
        # Only PENDING invitations count as active; accepted, declined, and expired
        # invitations should not prevent a new invitation from being created.
        query = select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.email == email,
            WorkspaceInvitation.status == InvitationStatus.PENDING,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_for_workspace(self, workspace_id: UUID) -> list[WorkspaceInvitation]:
        """List all invitations for a workspace ordered by creation date descending."""
        # Return the newest invitations first, which is useful for admin screens.
        query = (
            select(WorkspaceInvitation)
            .where(WorkspaceInvitation.workspace_id == workspace_id)
            .order_by(WorkspaceInvitation.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())