import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid = True), primary_key= True, default= uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique = True, index=True, nullable = False)
    hashed_password : Mapped[str] = mapped_column(String(255), nullable= False)
    full_name: Mapped[str] = mapped_column(String(100), nullable= False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())