# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class CardMemberCreate(BaseModel):
    user_id: UUID

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class CardMemberResponse(BaseModel):
    id: UUID
    card_id: UUID
    user_id: UUID
    assigned_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
