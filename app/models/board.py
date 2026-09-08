import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, Index, Boolean, String, func, ForeignKey, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

# Board model and workspace-level configuration.
class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True,
        default= uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable= False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable= False
    )
    title: Mapped[str] = mapped_column(
        String(100),
        nullable = False
    )
    visibility: Mapped[str] = mapped_column(
        String(50),
        default = "WORKSPACE",
        nullable = False    
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default = False,
        nullable = False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        server_default = func.now(),
        nullable = False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        server_default = func.now(),
        onupdate = func.now(),
        nullable = False
    )
