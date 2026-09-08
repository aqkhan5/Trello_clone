# app/schemas/workspace_member.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

# Import your existing enum from the model or enum module to keep single-source-of-truth:
# e.g., from app.models.workspace_member import WorkspaceRole
from app.models.workspace_member import WorkspaceRole
from app.schemas.user import UserResponse


# Payload for changing a member's workspace role.
class WorkspaceMemberUpdate(BaseModel):
    role: WorkspaceRole


# Workspace member representation returned by the API.
class WorkspaceMemberResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)