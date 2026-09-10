# app/schemas/card_member.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


# Request body for assigning a member to a card.
class CardMemberCreate(BaseModel):
    user_id: UUID


# Response returned for a card member assignment.
class CardMemberResponse(BaseModel):
    id: UUID
    card_id: UUID
    user_id: UUID
    assigned_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
