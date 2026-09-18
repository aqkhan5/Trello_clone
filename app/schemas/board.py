from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

class BoardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    visibility: str = Field(default="WORKSPACE", max_length=50)
    description: str | None = None
    background: str | None = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    visibility: str | None = Field(default=None, max_length=50)
    is_archived: bool | None = None
    description: str | None = None
    background: str | None = None

class BoardResponse(BoardBase):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
