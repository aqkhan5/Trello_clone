from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.board_member import BoardRole

from app.schemas.user import UserResponse

class BoardMemberCreate(BaseModel):
    user_id: UUID
    role: BoardRole = BoardRole.MEMBER

class BoardMemberUpdate(BaseModel):
    role: BoardRole

class BoardMemberResponse(BaseModel):
    id: UUID
    board_id: UUID
    user_id: UUID
    role: BoardRole
    joined_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
