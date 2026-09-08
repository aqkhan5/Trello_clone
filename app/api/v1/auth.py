# Imports — Standard library, FastAPI framework, and project modules

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


# Router Configuration — All endpoints are grouped under /auth
# ──────────────────────────────────────────────────────────────
router = APIRouter(prefix="/auth", tags=["Authentication"])


# POST /auth/register — Create a new user account
# Enforces unique email constraint via the auth service layer.
# Returns the newly created user profile on success (201).

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

# POST /auth/login — Authenticate an existing user
# Accepts email + password credentials via JSON body.
# Returns a JWT Bearer token on successful authentication (200).

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token"
)
async def login(
    credentials: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> TokenResponse:
    """Authenticate via JSON payload (email and password) and issue a Bearer token."""
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo, db)
    return await auth_service.authenticate_user(credentials)


# GET /auth/me — Retrieve the current authenticated user's profile
# Requires a valid JWT token (injected via the get_current_user dependency).
# Returns the user object associated with the token (200).

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