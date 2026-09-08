import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, String, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

# Label model used to categorize cards.
class Label(Base):
    __tablename__ = "labels"

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
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    color: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        server_default= func.now(),
        nullable = False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        server_default= func.now(),
        onupdate= func.now(),
        nullable = False
    )