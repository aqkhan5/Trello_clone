from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.board import Board
from app.models.board_member import BoardMember

class BoardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, board: Board) -> Board:
        """Add board, flush, and refresh."""
        self.db.add(board)
        await self.db.flush()
        await self.db.refresh(board)
        return board

    async def get_by_id(self, board_id: UUID) -> Board | None:
        """Fetch a single board by ID."""
        result = await self.db.execute(select(Board).where(Board.id == board_id))
        return result.scalar_one_or_none()

    async def list_for_workspace(self, workspace_id: UUID, user_id: UUID) -> list[Board]:
        """Fetch boards in the workspace where the user is either the creator or an assigned member."""
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
            .distinct()
            .order_by(Board.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_member(self, member: BoardMember) -> BoardMember:
        """Add board member, flush, and refresh."""
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_member(self, board_id: UUID, user_id: UUID) -> BoardMember | None:
        """Query board_members by composite (board_id, user_id)."""
        query = select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_members(self, board_id: UUID) -> list[BoardMember]:
        """Query all members of a board, eager-loading profile data."""
        query = (
            select(BoardMember)
            .where(BoardMember.board_id == board_id)
            .options(selectinload(BoardMember.user))
            .order_by(BoardMember.joined_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def remove_member(self, member: BoardMember) -> None:
        """Delete member record from session."""
        await self.db.delete(member)
        await self.db.flush()

    async def delete(self, board: Board) -> None:
        """Delete board record from session."""
        await self.db.delete(board)
        await self.db.flush()
