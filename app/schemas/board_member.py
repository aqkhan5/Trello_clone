# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.board_member import BoardRole

from app.schemas.user import UserResponse

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class BoardMemberCreate(BaseModel):
    user_id: UUID
    role: BoardRole = BoardRole.MEMBER

class BoardMemberUpdate(BaseModel):
    role: BoardRole

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class BoardMemberResponse(BaseModel):
    id: UUID
    board_id: UUID
    user_id: UUID
    role: BoardRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
