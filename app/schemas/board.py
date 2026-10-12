from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

class BoardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    visibility: str = Field(default="WORKSPACE", max_length=50)
    description: str | None = None
    background: str | None = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    visibility: str | None = Field(default=None, max_length=50)
    is_archived: bool | None = None
    description: str | None = None
    background: str | None = None

class BoardResponse(BoardBase):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from app.schemas.card import CardResponse
from app.schemas.label import LabelResponse
from app.schemas.card_member import CardMemberResponse
from app.schemas.attachment import AttachmentResponse
from app.schemas.list import ListResponse

class CardWithMetaResponse(CardResponse):
    labels: list[LabelResponse] = []
    members: list[CardMemberResponse] = []
    attachments: list[AttachmentResponse] = []

class ListWithCardsResponse(ListResponse):
    cards: list[CardWithMetaResponse] = []

class BoardDetailResponse(BoardResponse):
    lists: list[ListWithCardsResponse] = []

