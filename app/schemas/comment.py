# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse

# ---------------------------------------------------------------------------
# Shared Base Schemas
# ---------------------------------------------------------------------------
# Shared properties common to both requests and responses
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class CommentResponse(CommentBase):
    id: UUID
    card_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
