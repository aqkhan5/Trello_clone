from datetime import datetime
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    due_date: datetime | None = None
    is_completed: bool = False

class CardCreate(CardBase):
    position: Decimal | None = None

class CardUpdate(BaseModel):
    title: str | None = Field(default= None, min_length=1, max_length=255)
    description: str|None = None
    due_date: datetime | None = None
    is_completed: bool | None = None
    is_archived: bool | None = None

class CardMove(BaseModel):
    target_list_id : UUID
    position: Decimal | None = None

class CardResponse(CardBase):
    id: UUID
    list_id: UUID
    created_by: UUID
    position: Decimal
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)