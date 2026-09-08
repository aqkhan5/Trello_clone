# app/repositories/board_repository.py

# Typed identifiers and SQLAlchemy query/session helpers.
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Database models accessed by this repository.
from app.models.board import Board
from app.models.board_member import BoardMember


# Data-access layer for boards and board memberships.
# Transaction commits are intentionally handled by the service layer.
class BoardRepository:
    def __init__(self, db: AsyncSession):
        # All operations use the request-scoped async database session.
        self.db = db

    async def create(self, board: Board) -> Board:
        """Add board, flush, and refresh."""
        # Flush persists the pending INSERT without ending the transaction.
        self.db.add(board)
        await self.db.flush()
        # Refresh makes database-generated values available to the caller.
        await self.db.refresh(board)
        return board

    async def get_by_id(self, board_id: UUID) -> Board | None:
        """Fetch a single board by ID."""
        # Return one board when found, otherwise None.
        result = await self.db.execute(select(Board).where(Board.id == board_id))
        return result.scalar_one_or_none()

    async def list_for_workspace(self, workspace_id: UUID, user_id: UUID) -> list[Board]:
        """Fetch boards in the workspace where the user is either the creator or an assigned member."""
        # Join memberships so access can be granted either through board ownership
        # or an explicit board-member record.
        query = (
            select(Board)
            .outerjoin(BoardMember, Board.id == BoardMember.board_id)
            .where(
                Board.workspace_id == workspace_id,
                or_(
                    Board.created_by == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            # A user may match both access paths, so remove duplicate board rows.
            .distinct()
            # Show recently created boards first.
            .order_by(Board.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_member(self, member: BoardMember) -> BoardMember:
        """Add board member, flush, and refresh."""
        # Add membership without committing; the caller controls the transaction.
        self.db.add(member)
        await self.db.flush()
        # Reload generated membership fields such as id and joined_at.
        await self.db.refresh(member)
        return member

    async def get_member(self, board_id: UUID, user_id: UUID) -> BoardMember | None:
        """Query board_members by composite (board_id, user_id)."""
        # The pair of IDs identifies one user's membership on one board.
        query = select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_members(self, board_id: UUID) -> list[BoardMember]:
        """Query all members of a board, eager-loading profile data."""
        # Eager loading avoids one extra query per member when responses include users.
        query = (
            select(BoardMember)
            .where(BoardMember.board_id == board_id)
            .options(selectinload(BoardMember.user))
            # Preserve the order in which members joined the board.
            .order_by(BoardMember.joined_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def remove_member(self, member: BoardMember) -> None:
        """Delete member record from session."""
        # Flush the DELETE so later operations in the same transaction see the change.
        await self.db.delete(member)
        await self.db.flush()

    async def delete(self, board: Board) -> None:
        """Delete board record from session."""
        # Database cascade rules remove dependent board records where configured.
        await self.db.delete(board)
        await self.db.flush()