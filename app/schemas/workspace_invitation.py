from datetime import datetime
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr

class InvitationStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"

class WorkspaceRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class WorkspaceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None

class InvitationCreate(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.MEMBER

class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    invited_by: UUID
    email: EmailStr
    role: WorkspaceRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime

class TrelloNotificationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    role: WorkspaceRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime
    workspace: WorkspaceSummary
