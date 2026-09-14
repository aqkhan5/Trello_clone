# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from datetime import datetime
from decimal import Decimal 
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

# ---------------------------------------------------------------------------
# Shared Base Schemas
# ---------------------------------------------------------------------------
# Shared properties common to both requests and responses
class ListBase(BaseModel):
    title: str = Field(..., min_length= 1, max_length = 100)

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class ListCreate(ListBase):
    position: Decimal | None = None

class ListUpdate(BaseModel):
    title: str | None = Field(default = None, min_length = 1, max_length = 100)
    position: Decimal | None = None
    is_archived: bool | None = None

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class ListResponse(ListBase):
    id: UUID
    board_id: UUID 
    position: Decimal 
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes = True)
