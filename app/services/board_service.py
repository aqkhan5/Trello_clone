# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board
from app.models.board_member import BoardMember, BoardRole

from app.repositories.board_repository import BoardRepository
from app.repositories.workspace_repository import WorkspaceRepository

from app.schemas.board import BoardCreate, BoardUpdate

# ---------------------------------------------------------------------------
# Service: BoardService
# ---------------------------------------------------------------------------
# Handles business logic for boards and board membership.
class BoardService:
    def __init__(
        self,
        board_repo: BoardRepository,
        workspace_repo: WorkspaceRepository,
        db: AsyncSession,
    ):
        self.board_repo = board_repo
        self.workspace_repo = workspace_repo
        self.db = db

    async def create_board(
        self, workspace_id: UUID, user_id: UUID, data: BoardCreate
    ) -> Board:
        """Create board and register creator as ADMIN in a single transaction."""
        board = Board(
            workspace_id=workspace_id,
            created_by=user_id,
            title=data.title,
            visibility=data.visibility or "WORKSPACE",
            is_archived=False,
        )
        await self.board_repo.create(board)

        creator_member = BoardMember(
            board_id=board.id,
            user_id=user_id,
            role=BoardRole.ADMIN,
        )
        await self.board_repo.add_member(creator_member)

        await self.db.commit()
        await self.db.refresh(board)
        return board

    async def update_board(self, board: Board, data: BoardUpdate) -> Board:
        """Apply non-null updates to board entity and commit."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(board, field, value)

        await self.db.commit()
        await self.db.refresh(board)
        return board

    async def delete_board(self, board: Board) -> None:
        """Delete board and cascade dependent lists/cards."""
        await self.board_repo.delete(board)
        await self.db.commit()

    async def add_board_member(
        self, board: Board, target_user_id: UUID, role: BoardRole
    ) -> BoardMember:
        """Add user to board after verifying parent workspace membership."""
        # Rule 1: Board membership is only valid for users already in the workspace.
        ws_member = await self.workspace_repo.get_member(
            board.workspace_id, target_user_id
        )
        if not ws_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to the workspace before joining the board",
            )

        # Rule 2: Prevent duplicate membership on the same board.
        existing_board_member = await self.board_repo.get_member(
            board.id, target_user_id
        )
        if existing_board_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this board",
            )

        # Create the membership using the requested board role.
        new_member = BoardMember(
            board_id=board.id,
            user_id=target_user_id,
            role=role,
        )
        await self.board_repo.add_member(new_member)
        # Commit and refresh so the caller receives the persisted membership.
        await self.db.commit()
        await self.db.refresh(new_member)
        return new_member

    async def update_member_role(
        self, board: Board, target_user_id: UUID, new_role: BoardRole
    ) -> BoardMember:
        """Update role, preventing demotion of the board creator."""
        # The creator must always retain ADMIN privileges.
        if board.created_by == target_user_id and new_role != BoardRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The board creator cannot be demoted from ADMIN",
            )

        # Look up the target membership before applying the role change.
        member = await self.board_repo.get_member(board.id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Board member not found",
            )

        member.role = new_role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(self, board: Board, target_user_id: UUID) -> None:
        """Remove member, preventing removal of the board creator."""
        # The creator cannot be removed; deleting the board removes their access.
        if board.created_by == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The board creator cannot be removed from the board",
            )

        # Resolve the membership so a missing target can return a clear 404.
        member = await self.board_repo.get_member(board.id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Board member not found",
            )

        await self.board_repo.remove_member(member)
        await self.db.commit()
