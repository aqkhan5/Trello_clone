from datetime import datetime
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

class ChecklistItemBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=255)
    

class ChecklistItemCreate(ChecklistItemBase):
    position: Decimal | None = None

class ChecklistItemUpdate(BaseModel):
    content: str = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    position: Decimal | None = None

class ChecklistItemResponse(ChecklistItemBase):
    id: UUID
    checklist_id: UUID
    is_completed: bool | None = None
    position: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChecklistBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

class ChecklistCreate(ChecklistBase):
    position: Decimal | None = None

class ChecklistUpdate(BaseModel):
    title: str = Field(default=None, min_length=1, max_length=100)
    position: Decimal | None = None

class ChecklistResponse(ChecklistBase):
    id: UUID
    card_id: UUID
    position: Decimal | None = None
    item: list[ChecklistItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)   