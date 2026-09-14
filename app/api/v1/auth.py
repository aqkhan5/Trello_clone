import json
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

router = APIRouter(prefix="/auth", tags=["Authentication"])

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

    if not email or not password:
        try:
            body = await request.json()
            if isinstance(body, dict):
                email = email or body.get("email") or body.get("username")
                password = password or body.get("password")
        except Exception:
            pass

    if not email or not password:
        try:
            form = await request.form()
            email = email or form.get("email") or form.get("username")
            password = password or form.get("password")
            if not email or not password:
                for k in form.keys():
                    try:
                        data = json.loads(k)
                        if isinstance(data, dict):
                            email = email or data.get("email") or data.get("username")
                            password = password or data.get("password")
                            if email and password:
                                break
                    except Exception:
                        pass
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
