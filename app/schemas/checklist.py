# Standard library types for timestamps, identifiers, and ordered positions.
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Checklist item schemas
# ---------------------------------------------------------------------------

# Shared item fields used by create and response schemas.
class ChecklistItemBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=255)
    

# Request body for adding an item to a checklist.
# Position is optional so the service can calculate one when omitted.
class ChecklistItemCreate(ChecklistItemBase):
    position: Decimal | None = None

# Partial request body for editing an item.
class ChecklistItemUpdate(BaseModel):
    content: str = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    position: Decimal | None = None

# Response model for an item, including completion, ordering, and timestamps.
class ChecklistItemResponse(ChecklistItemBase):
    id: UUID
    checklist_id: UUID
    is_completed: bool | None = None
    position: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    # Allow serialization directly from a SQLAlchemy checklist-item model.
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Checklist schemas
# ---------------------------------------------------------------------------

# Shared checklist fields used by create and response schemas.
class ChecklistBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

# Request body for creating a checklist on a card.
class ChecklistCreate(ChecklistBase):
    position: Decimal | None = None

# Partial request body for editing a checklist.
class ChecklistUpdate(BaseModel):
    title: str = Field(default=None, min_length=1, max_length=100)
    position: Decimal | None = None

# Response model for a checklist and its nested item responses.
class ChecklistResponse(ChecklistBase):
    id: UUID
    card_id: UUID
    position: Decimal | None = None
    item: list[ChecklistItemResponse] = []
    created_at: datetime
    updated_at: datetime

    # Allow serialization directly from a SQLAlchemy checklist model.
    model_config = ConfigDict(from_attributes=True)