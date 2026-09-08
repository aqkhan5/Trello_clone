# app/schemas/board.py

# Standard library types used for board ownership and timestamps.
from datetime import datetime
from uuid import UUID

# Pydantic provides validation, defaults, and response serialization.
from pydantic import BaseModel, ConfigDict, Field


# Fields shared by board creation and board responses.
# Title is required and bounded; description is optional with a length limit.
class BoardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


# Request body for creating a board.
# It inherits the shared title and description fields without adding new ones.
class BoardCreate(BoardBase):
    pass


# Partial request body for updating a board.
# Fields default to None so callers can update only the values they provide.
class BoardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_closed: bool | None = None


# Response returned for a board.
# Includes ownership, lifecycle, and audit timestamps in addition to shared fields.
class BoardResponse(BoardBase):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    is_closed: bool
    created_at: datetime
    updated_at: datetime

    # Allow Pydantic to serialize a SQLAlchemy Board instance directly.
    model_config = ConfigDict(from_attributes=True)