# Imports — Standard library, FastAPI framework, and project modules

from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from pydantic import ValidationError
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


class OAuth2LoginForm:
    """OAuth2 login form containing only username (email) and password."""

    def __init__(
        self,
        username: Annotated[
            str | None,
            Form(description="Your registered email address"),
        ] = None,
        password: Annotated[
            str | None,
            Form(json_schema_extra={"format": "password"}),
        ] = None,
    ):
        self.username = username
        self.password = password


# POST /auth/login — Authenticate an existing user
# Accepts OAuth2 form data (email in username field) or JSON body (email & password).
# Returns a JWT Bearer token on successful authentication (200).

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token"
)
async def login(
    request: Request,
    form_data: Annotated[OAuth2LoginForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> TokenResponse:
    """Authenticate via OAuth2 form data (for Swagger UI Authorize) or JSON body, and issue a Bearer token."""
    email = form_data.username
    password = form_data.password

    # Fall back to JSON body if form fields were not supplied
    if not email or not password:
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            try:
                body = await request.json()
                if isinstance(body, dict):
                    email = body.get("email") or body.get("username")
                    password = body.get("password")
            except Exception:
                pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email (username) and password are required",
        )

    try:
        credentials = LoginRequest(email=email, password=password)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )

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