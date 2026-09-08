# Standard library types used for identifiers and membership timestamps.
from datetime import datetime
from uuid import UUID

# Pydantic provides request validation and response serialization.
from pydantic import BaseModel, ConfigDict

# Reuse the model's role enum so API validation matches database rules.
from app.models.board_member import BoardRole

# Optional nested profile returned with a board membership.
from app.schemas.user import UserResponse


# Request body for adding an existing user to a board.
# New members receive the MEMBER role unless the caller provides another valid role.
class BoardMemberCreate(BaseModel):
    user_id: UUID
    role: BoardRole = BoardRole.MEMBER


# Request body for changing an existing member's board role.
class BoardMemberUpdate(BaseModel):
    role: BoardRole


# Response returned for a board membership.
# It includes membership identity, role, join time, and optional user profile data.
class BoardMemberResponse(BaseModel):
    id: UUID
    board_id: UUID
    user_id: UUID
    role: BoardRole
    joined_at: datetime
    # The profile may be absent when the membership query does not load the relation.
    user: UserResponse | None = None

    # Allow Pydantic to serialize a SQLAlchemy BoardMember instance directly.
    model_config = ConfigDict(from_attributes=True)