from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class WorkspaceRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class WorkspaceMemberRole(BaseModel):
    role: WorkspaceRole

class WorkspaceMemberResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)