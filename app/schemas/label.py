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
class LabelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., min_length=1, max_length=20)

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
# Schemas for validating incoming request data
class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: str = Field(default= None, min_length=1, max_length=50)
    color: str = Field(default= None, min_length=1, max_length=20)

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
# Schemas for formatting outgoing API responses
class LabelResponse(LabelBase):
    id: UUID
    board_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
