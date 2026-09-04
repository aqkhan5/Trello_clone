import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, Boolean, Index, String, Numeric, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class List(Base):
    __tablename__ = "lists"
    __table_args__ = (
        Index("ix_lists_board_id_position", "board_id", "position"),
        )

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
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    position: Mapped[Decimal] = mapped_column(
        Numeric(12, 6),
        nullable = False
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default = False,
        nullable = False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default = func.now(),
        nullable = False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default = func.now(),
        onupdate = func.now(),
        nullable = False
    )