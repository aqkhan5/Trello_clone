from pydantic import BaseModel, EmailStr

# Login credentials submitted during authentication.
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Access token returned after successful authentication.
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Claims extracted from a validated access token.
class TokenPayload(BaseModel):
    sub: str | None = None  # Subject (user ID)
    exp: int | None = None  # Expiration time (timestamp)