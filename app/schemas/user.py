from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID

# Shared user fields used by request and response schemas.
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)

# Registration payload containing the user's password.
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

# Public user representation returned by the API.
class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)