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
class WorkspaceRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

# ---------------------------------------------------------------------------
# Database Model: WorkspaceMember
# ---------------------------------------------------------------------------
# Database table for users who are members of a workspace and their roles.
class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name = "uq_workspace_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete= "CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", lazy="selectin")
