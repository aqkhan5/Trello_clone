# Standard library types used by label identifiers and timestamps.
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# Pydantic models and field constraints used for API validation.
from pydantic import BaseModel, Field, ConfigDict


# Fields shared by label creation, updates, and responses.
# Both name and color are required here and have length limits.
class LabelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., min_length=1, max_length=20)

# Request body for creating a label on a board.
class LabelCreate(LabelBase):
    pass

# Partial request body for editing a label.
# Omitted fields remain unchanged in the service layer.
class LabelUpdate(BaseModel):
    name: str = Field(default= None, min_length=1, max_length=50)
    color: str = Field(default= None, min_length=1, max_length=20)

# Response returned for a label, including board ownership and timestamps.
class LabelResponse(LabelBase):
    id: UUID
    board_id: UUID
    created_at: datetime
    updated_at: datetime

    # Allow serialization directly from a SQLAlchemy Label model.
    model_config = ConfigDict(from_attributes=True)