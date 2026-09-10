# app/schemas/activity_log.py
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class ActivityLogResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    details: dict[str, Any] | None = None
    user_id: UUID
    created_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)