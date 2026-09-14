from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_board_admin,
    require_board_member,
    require_workspace_member,
)
from app.db.session import get_db

from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

from app.repositories.board_repository import BoardRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate
from app.schemas.board_member import (
    BoardMemberCreate,
    BoardMemberResponse,
    BoardMemberUpdate,
)
from app.services.board_service import BoardService

router = APIRouter(tags=["Boards"])

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
    workspace, _ = workspace_and_member

    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.create_board(workspace.id, current_user.id, payload)

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
    board_repo = BoardRepository(db)
    return await board_repo.list_for_workspace(workspace_id, current_user.id)

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
    board, _ = board_and_member
    return board

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
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_board(board, payload)

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
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.delete_board(board)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

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
    board_repo = BoardRepository(db)
    return await board_repo.list_members(board_id)

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
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.add_board_member(board, payload.user_id, payload.role)

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
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_member_role(board, user_id, payload.role)

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
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.remove_member(board, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
