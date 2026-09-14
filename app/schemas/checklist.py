# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

# ---------------------------------------------------------------------------
# Shared Base Schemas
# ---------------------------------------------------------------------------
# Shared properties common to both requests and responses
class ChecklistItemBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=255)
    

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class ChecklistItemCreate(ChecklistItemBase):
    position: Decimal | None = None

class ChecklistItemUpdate(BaseModel):
    content: str = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    position: Decimal | None = None

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
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
    items: list[ChecklistItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
