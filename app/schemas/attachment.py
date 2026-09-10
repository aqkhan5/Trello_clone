# app/schemas/attachment.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AttachmentBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=2048)
    file_size: int = Field(..., ge=0)
    content_type: str | None = Field(default=None, max_length=100)


class AttachmentCreate(AttachmentBase):
    pass


class AttachmentResponse(AttachmentBase):
    id: UUID
    card_id: UUID
    uploaded_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)