# app/schemas/activity_log.py
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


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