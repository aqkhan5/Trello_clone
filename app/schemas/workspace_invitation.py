
# Standard library types used by the invitation schemas.
import enum
from datetime import datetime
from uuid import UUID

# Pydantic provides validation and serialization for API payloads.
from pydantic import BaseModel, ConfigDict, EmailStr

# Reuse the workspace role enum so invitation roles match membership roles.
from app.models.workspace_member import WorkspaceRole


# Lifecycle states for a workspace invitation.
# An invitation normally moves from PENDING to ACCEPTED, DECLINED, or EXPIRED.
class InvitationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


# Request body used when an administrator invites someone to a workspace.
# The invited user receives the MEMBER role unless another valid role is supplied.
class InvitationCreate(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.MEMBER


# Response model returned when an invitation is created or retrieved.
# It includes identity, ownership, recipient, security, status, and timing data.
class InvitationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    inviter_id: UUID
    email: EmailStr
    role: WorkspaceRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime

    # Allow Pydantic to build this schema from a SQLAlchemy model instance.
    model_config = ConfigDict(from_attributes=True)