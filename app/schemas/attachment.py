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
class AttachmentBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=2048)
    file_size: int = Field(..., ge=0)
    content_type: str | None = Field(default=None, max_length=100)

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class AttachmentCreate(AttachmentBase):
    pass

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class AttachmentResponse(AttachmentBase):
    id: UUID
    card_id: UUID
    uploaded_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
