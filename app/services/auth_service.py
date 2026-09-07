from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate

class AuthService:
    def __init__ (self, user_repo: UserRepository, db: AsyncSession):
        self.user_repo = user_repo
        self.db = db

    # Register a new user after verifying unique email
    async def register_user(self, user_in: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=  status.HTTP_409_CONFLICT,
                details = "Email already exists",
            )

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email = user_in.email,
            full_name = user_in.full_name,
            hashed_password = hashed_password,
        )

        user = await self.user_repo.create(new_user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    # Authenticate user credentials and issue an access token
    async def authenticate_user(self, credentials: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code= status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers = {"WWW-Authenticate": "Bearer"}
            )
        access_token = create_access_token(subject = str(user.id))
        return TokenResponse(access_token=access_token, token_type = "bearer")