import uuid
from typing import Annotated
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPayload


# Authentication dependencies

# This is the first layer of protection for protected API routes.
# FastAPI will read the bearer token from the Authorization header and pass it
# to the dependency below, which verifies that the token is valid and belongs to
# a real user in the database.

oauth_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    token: Annotated[str, Depends(oauth_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate the bearer token and return the authenticated user."""
    # Standard 401 payload returned when authentication fails.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW.Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT using the app's secret key and algorithm.
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # The token payload should include a user identifier in the `sub` field.
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

    try:
        # `sub` is stored as a string UUID, so convert it back to UUID type.
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    # Query the database to ensure the user still exists.
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user



# Workspace access control

# These dependencies ensure a user is only allowed to access a workspace if:
# 1) the workspace exists,
# 2) the user is a member of that workspace,
# 3) the user has admin-level permissions when required.

from uuid import UUID
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.repositories.workspace_repository import WorkspaceRepository


async def get_workspace_or_404(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """Fetch a workspace by ID, or raise a 404 if it does not exist."""
    repo = WorkspaceRepository(db)
    workspace = await repo.get_by_id(workspace_id)

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    return workspace


async def require_workspace_member(
    workspace_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Workspace, WorkspaceMember]:
    """Ensure the current user belongs to the target workspace."""
    # First validate that the workspace exists.
    workspace = await get_workspace_or_404(workspace_id, db)

    repo = WorkspaceRepository(db)
    member = await repo.get_member(workspace_id, current_user.id)

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )

    return workspace, member


async def require_workspace_admin(
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
) -> tuple[Workspace, WorkspaceMember]:
    """Require the user to be a workspace admin or owner."""
    workspace, member = workspace_and_member

    # Workspace owners can always manage the workspace.
    is_owner = workspace.owner_id == member.user_id
    # Admins also have elevated rights.
    is_admin = member.role == WorkspaceRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required",
        )

    return workspace, member