# app/schemas/workspace.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Shared workspace fields used by create and response schemas.
class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


# Workspace creation payload.
class WorkspaceCreate(WorkspaceBase):
    pass


# Partial workspace update payload.
class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


# Workspace representation returned by the API.
class WorkspaceResponse(WorkspaceBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)