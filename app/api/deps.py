# Standard library and framework imports used by FastAPI dependencies.
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
    # Use one generic 401 response so callers do not learn whether a token,
    # token payload, or user lookup was the part that failed.
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

# Workspace dependencies first verify existence, then verify membership,
# and finally verify admin-level permissions when the route requires them.
from uuid import UUID
from app.models.workspace import Workspace

# To this:
from app.models.workspace_member import WorkspaceMember
from app.schemas.workspace_member import WorkspaceRole
from app.repositories.workspace_repository import WorkspaceRepository


async def get_workspace_or_404(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """Fetch a workspace by ID, or raise a 404 if it does not exist."""
    # Keep workspace lookup in one dependency so other checks can reuse it.
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
    # First validate that the workspace exists, then load the user's membership.
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

    # Workspace owners can manage the workspace even if their membership role
    # is not explicitly ADMIN; regular admins also receive elevated rights.
    is_owner = workspace.owner_id == member.user_id
    is_admin = member.role == WorkspaceRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required",
        )

    return workspace, member

# Board and board-member access control

from app.models.board import Board
from app.models.board_member import BoardMember, BoardRole
from app.repositories.board_repository import BoardRepository


async def get_board_or_404(
    board_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Fetch board by primary key or raise 404."""
    # Centralize board existence checks for all board-protected routes.
    repo = BoardRepository(db)
    board = await repo.get_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found",
        )
    return board


async def require_board_member(
    board_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Board, BoardMember | None]:
    """Verify user is an active board member or the parent workspace owner."""
    # Load the board before checking its membership records.
    board = await get_board_or_404(board_id, db)
    board_repo = BoardRepository(db)
    board_member = await board_repo.get_member(board.id, current_user.id)

    if board_member:
        return board, board_member
    

    # A workspace owner may access a board without a separate board-membership row.
    workspace_repo = WorkspaceRepository(db)
    workspace = await workspace_repo.get_by_id(board.workspace_id)
    if workspace and workspace.owner_id == current_user.id:
        return board, None

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not a member of this board",
    )


async def require_board_admin(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Board, BoardMember | None]:
    """Ensure user is a board ADMIN, board creator, or workspace owner."""
    board, board_member = board_and_member

    # Board creators and board admins can manage board-level settings and members.
    is_creator = board.created_by == current_user.id
    is_board_admin = board_member is not None and board_member.role == BoardRole.ADMIN

    if is_creator or is_board_admin:
        return board, board_member

    # Workspace owners are also allowed to manage boards in their workspace.
    workspace_repo = WorkspaceRepository(db)
    workspace = await workspace_repo.get_by_id(board.workspace_id)
    if workspace and workspace.owner_id == current_user.id:
        return board, board_member

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Board admin permissions required",
    )