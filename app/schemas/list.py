from datetime import datetime
from decimal import Decimal 
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

class ListBase(BaseModel):
    title: str = Field(..., min_length= 1, max_length = 100)

class ListCreate(ListBase):
    position: Decimal | None = None

class ListUpdate(BaseModel):
    title: str | None = Field(default = None, min_length = 1, max_length = 100)
    position: Decimal | None = None
    is_archived: bool | None = None

class ListResponse(ListBase):
    id: UUID
    board_id: UUID 
    position: Decimal 
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes = True)