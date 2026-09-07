from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

#Register a new User account with unique email enforcement
@router.post(
    "/register",
    response_model=UserResponse,
    status_code= status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(
    payload: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo, db)
    return await auth_service.register_user(payload)

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token"
)
async def login(
    credentials: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """Authenticate via JSON payload (email and password) and issue a Bearer token."""
    user_repo = user_repo(db)
    auth_service = AuthService(user_repo, db)
    return await auth_service.authenticate_user(credentials)

@router.get(
    "/me",
    response_model= UserResponse,
    status_code=status.HTTP_200_OK,
    summary= "Retrieve current authenticated User"
)
async def get_me(
    current_user : Annotated[User, Depends(get_current_user)]
) -> User:
    """Return the profile information of the currently authenticated user."""
    return current_user
    