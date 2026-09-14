# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Shared Base Schemas
# ---------------------------------------------------------------------------
# Shared properties common to both requests and responses
class BoardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    visibility: str = Field(default="WORKSPACE", max_length=50)

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    visibility: str | None = Field(default=None, max_length=50)
    is_archived: bool | None = None

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class BoardResponse(BoardBase):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
