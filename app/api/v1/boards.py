# API routes for creating, reading, updating, and deleting boards and board members.
# Authentication and authorization are handled by FastAPI dependencies; business
# rules and database mutations are delegated to BoardService.

# Standard library and FastAPI imports for typed route definitions.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

# Authorization dependencies. They load the relevant resource and enforce
# workspace or board membership/admin permissions before handlers run.
from app.api.deps import (
    get_current_user,
    require_board_admin,
    require_board_member,
    require_workspace_member,
)
from app.db.session import get_db

# ORM models used as dependency results and endpoint return types.
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

# Repositories handle database queries; the service handles business rules.
from app.repositories.board_repository import BoardRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate
from app.schemas.board_member import (
    BoardMemberCreate,
    BoardMemberResponse,
    BoardMemberUpdate,
)
from app.services.board_service import BoardService

# Board routes are grouped under the Boards tag in the OpenAPI documentation.
router = APIRouter(tags=["Boards"])



# Workspace-scoped Board Endpoints

# Create a board inside a workspace where the caller is a member.
@router.post(
    "/workspaces/{workspace_id}/boards",
    response_model=BoardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a board in a workspace",
)
async def create_board(
    workspace_id: UUID,
    payload: BoardCreate,
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Create a new board and assign creator as ADMIN in a single transaction."""
    # The dependency has already verified workspace access and loaded the workspace.
    workspace, _ = workspace_and_member

    # All collaborators use the same request-scoped database session.
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    # Creation and automatic creator membership are coordinated by the service.
    service = BoardService(board_repo, workspace_repo, db)
    return await service.create_board(workspace.id, current_user.id, payload)


# List only boards accessible to the current user in the workspace.
@router.get(
    "/workspaces/{workspace_id}/boards",
    response_model=list[BoardResponse],
    status_code=status.HTTP_200_OK,
    summary="List accessible boards in a workspace",
)
async def list_workspace_boards(
    workspace_id: UUID,
    _: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Board]:
    """List boards where the current user is creator or an assigned member."""
    # The underscore marks the workspace authorization result as intentionally unused.
    board_repo = BoardRepository(db)
    # This is a read-only query, so the repository can serve it directly.
    return await board_repo.list_for_workspace(workspace_id, current_user.id)



# Direct Board Endpoints


# Return board details after member-level access has been verified.
@router.get(
    "/boards/{board_id}",
    response_model=BoardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get board details",
)
async def get_board(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
) -> Board:
    """Fetch board details if user has access."""
    # The dependency performs lookup and authorization before this handler runs.
    board, _ = board_and_member
    return board


# Update board fields; board admins, creators, and eligible workspace owners may do this.
@router.patch(
    "/boards/{board_id}",
    response_model=BoardResponse,
    status_code=status.HTTP_200_OK,
    summary="Update board",
)
async def update_board(
    payload: BoardUpdate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Update title, description, or closed status (Requires Board ADMIN or Creator)."""
    # Admin authorization is handled by require_board_admin; the service applies changes.
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_board(board, payload)


# Delete a board and its dependent records.
@router.delete(
    "/boards/{board_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete board",
)
async def delete_board(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Delete a board and cascade all children (Requires Board ADMIN or Creator)."""
    # The service deletes and commits before this handler returns HTTP 204.
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.delete_board(board)
    return Response(status_code=status.HTTP_204_NO_CONTENT)



# Board Member Endpoints


# List members after verifying the caller can access the board.
@router.get(
    "/boards/{board_id}/members",
    response_model=list[BoardMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List board members",
)
async def list_board_members(
    board_id: UUID,
    _: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[BoardMember]:
    """Retrieve all assigned members on the board with user profile details."""
    # The authorization dependency result is not needed by the listing query.
    board_repo = BoardRepository(db)
    return await board_repo.list_members(board_id)


# Add a workspace member to this board with the requested board role.
@router.post(
    "/boards/{board_id}/members",
    response_model=BoardMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a member to the board",
)
async def add_board_member(
    board_id: UUID,
    payload: BoardMemberCreate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BoardMember:
    """Add an existing workspace member to the board (Requires Board ADMIN)."""
    # The service verifies workspace membership and prevents duplicates.
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.add_board_member(board, payload.user_id, payload.role)


# Change a board member's role; the creator cannot be demoted.
@router.patch(
    "/boards/{board_id}/members/{user_id}",
    response_model=BoardMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Update member role on board",
)
async def update_board_member_role(
    user_id: UUID,
    payload: BoardMemberUpdate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BoardMember:
    """Update role. Board creator cannot be demoted."""
    # Authorization is performed by the dependency; role invariants belong to the service.
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_member_role(board, user_id, payload.role)


# Remove a board member; the creator cannot be removed.
@router.delete(
    "/boards/{board_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from the board",
)
async def remove_board_member(
    user_id: UUID,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Remove member from board. Board creator cannot be removed."""
    # The service validates the target and commits the membership deletion.
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.remove_member(board, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)