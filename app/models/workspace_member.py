import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, String, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name = "uq_workspace_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id:Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete= "CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(UUID(as_uuid=True), DateTime(timezone=True), server_default=func.now())
    