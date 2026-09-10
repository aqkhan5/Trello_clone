from datetime import datetime
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

class LabelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., min_length=1, max_length=20)

class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: str = Field(default= None, min_length=1, max_length=50)
    color: str = Field(default= None, min_length=1, max_length=20)

class LabelResponse(LabelBase):
    id: UUID
    board_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)