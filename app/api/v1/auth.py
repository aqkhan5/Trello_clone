import json
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.notifications import send_login_alert_email, send_welcome_email, send_password_reset_email
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, MessageResponse, ResetPasswordRequest
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: UserCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo, db)
    user = await auth_service.register_user(payload)

    # Dispatch welcome email asynchronously
    background_tasks.add_task(
        send_welcome_email,
        recipient_email=user.email,
        full_name=user.full_name,
    )

    return user


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
    summary="Authenticate user and return JWT access token",
)
async def login(
    request: Request,
    form_data: Annotated[OAuth2LoginForm, Depends()],
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
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
    token_response = await auth_service.authenticate_user(credentials)

    # Fetch user to extract full_name and send login alert
    user = await user_repo.get_by_email(credentials.email.lower())
    if user:
        client_ip = (
            request.headers.get("x-forwarded-for")
            or (request.client.host if request.client else "Unknown")
        )
        background_tasks.add_task(
            send_login_alert_email,
            recipient_email=user.email,
            full_name=user.full_name,
            ip_address=client_ip,
        )

    return token_response


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve current authenticated User",
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Return the profile information of the currently authenticated user."""
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current authenticated User profile",
)
async def update_me(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Update profile information of the currently authenticated user."""
    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()
    await db.commit()
    await db.refresh(current_user)
    return current_user



@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo, db)

    user, raw_token = await auth_service.request_password_reset(payload.email)

    if user and raw_token:
        background_tasks.add_task(
            send_password_reset_email,
            recipient_email=user.email,
            full_name=user.full_name,
            token=raw_token,
        )

    return MessageResponse(
        message="If an account exists with this email, a password reset link has been dispatched."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password using token",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo, db)

    await auth_service.reset_password(
        raw_token=payload.token,
        new_password=payload.new_password,
    )

    return MessageResponse(
        message="Password has been successfully updated. You may now log in."
    )