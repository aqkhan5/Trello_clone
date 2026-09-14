from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.workspace_member import WorkspaceRole
from app.schemas.user import UserResponse

class WorkspaceMemberUpdate(BaseModel):
    role: WorkspaceRole

class WorkspaceMemberResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
