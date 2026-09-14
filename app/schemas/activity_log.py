# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class ActivityLogResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action_type: str  
    metadata: dict | None = Field(
        default=None, validation_alias="metadata_", serialization_alias="metadata"
    )  
    user_id: UUID
    created_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
