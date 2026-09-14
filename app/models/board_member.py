# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, String, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

# ---------------------------------------------------------------------------
# Role Enums
# ---------------------------------------------------------------------------
class BoardRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    OBSERVER = "OBSERVER"

# ---------------------------------------------------------------------------
# Database Model: BoardMember
# ---------------------------------------------------------------------------
# Database table for tracking board members and their access permissions.
class BoardMember(Base):
    __tablename__ = "board_members"
    __table_args__ = (UniqueConstraint("board_id", "user_id", name="uq_board_user"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    board_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("boards.id", ondelete="CASCADE"), 
        nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(50),
        default="MEMBER", 
        nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    user: Mapped["User"] = relationship("User", lazy="selectin")
