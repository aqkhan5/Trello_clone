# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.workspace_member import WorkspaceRole
from app.schemas.user import UserResponse

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class WorkspaceMemberUpdate(BaseModel):
    role: WorkspaceRole

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class WorkspaceMemberResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
