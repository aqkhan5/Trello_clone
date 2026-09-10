from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.models.attachment import Attachment
from app.models.board_member import BoardRole
from app.models.comment import Comment
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.board_repository import BoardRepository
from app.repositories.card_repository import CardRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.list_repository import ListRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.attachment import AttachmentCreate
from app.schemas.comment import CommentCreate, CommentUpdate


class CollaborationService:
    def __init__(
        self,
        comment_repo: CommentRepository,
        attachment_repo: AttachmentRepository,
        activity_repo: ActivityLogRepository,
        card_repo: CardRepository,
        list_repo: ListRepository,
        board_repo: BoardRepository,
        workspace_repo: WorkspaceRepository,
        db: AsyncSession,
    ):
        self.comment_repo = comment_repo
        self.attachment_repo = attachment_repo
        self.activity_repo = activity_repo
        self.card_repo = card_repo
        self.list_repo = list_repo
        self.board_repo = board_repo
        self.workspace_repo = workspace_repo
        self.db = db

    async def _is_user_board_admin_or_owner(
        self, card_id: UUID, user_id: UUID
    ) -> bool:
        """Check if user has admin privileges on the board hosting the card."""
        card = await self.card_repo.get_by_id(card_id)
        if not card:
            return False
        list_obj = await self.list_repo.get_by_id(card.list_id)
        if not list_obj:
            return False
        board = await self.board_repo.get_by_id(list_obj.board_id)
        if not board:
            return False

        if board.created_by == user_id:
            return True

        workspace = await self.workspace_repo.get_by_id(board.workspace_id)
        if workspace and workspace.owner_id == user_id:
            return True

        member = await self.board_repo.get_member(board.id, user_id)
        return member is not None and member.role == BoardRole.ADMIN

    async def add_comment(
        self, card_id: UUID, user_id: UUID, data: CommentCreate
    ) -> Comment:
        """Create comment and emit activity log in an atomic transaction."""
        comment = Comment(
            card_id=card_id,
            user_id=user_id,
            content=data.content,
        )
        await self.comment_repo.create(comment)

        log = ActivityLog(
            entity_type="CARD",
            entity_id=card_id,
            action="COMMENT_ADDED",
            user_id=user_id,
            details={"comment_length": len(data.content)},
        )
        await self.activity_repo.create(log)

        await self.db.commit()
        refreshed_comment = await self.comment_repo.get_by_id(comment.id)
        return refreshed_comment or comment

    async def update_comment(
        self, comment: Comment, current_user_id: UUID, data: CommentUpdate
    ) -> Comment:
        """Update comment if user is author or board admin."""
        is_admin = await self._is_user_board_admin_or_owner(
            comment.card_id, current_user_id
        )
        if comment.user_id != current_user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this comment",
            )

        comment.content = data.content
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def delete_comment(
        self, comment: Comment, current_user_id: UUID
    ) -> None:
        """Delete comment if user is author or board admin."""
        is_admin = await self._is_user_board_admin_or_owner(
            comment.card_id, current_user_id
        )
        if comment.user_id != current_user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this comment",
            )

        await self.comment_repo.delete(comment)
        await self.db.commit()

    async def add_attachment(
        self, card_id: UUID, user_id: UUID, data: AttachmentCreate
    ) -> Attachment:
        """Add attachment and emit ATTACHMENT_ADDED activity log."""
        attachment = Attachment(
            card_id=card_id,
            uploaded_by=user_id,
            file_name=data.file_name,
            file_url=data.file_url,
            file_size=data.file_size,
            content_type=data.content_type,
        )
        await self.attachment_repo.create(attachment)

        log = ActivityLog(
            entity_type="CARD",
            entity_id=card_id,
            action="ATTACHMENT_ADDED",
            user_id=user_id,
            details={
                "file_name": data.file_name,
                "file_size": data.file_size,
            },
        )
        await self.activity_repo.create(log)

        await self.db.commit()
        await self.db.refresh(attachment)
        return attachment

    async def delete_attachment(self, attachment: Attachment) -> None:
        """Delete attachment from session and commit."""
        await self.attachment_repo.delete(attachment)
        await self.db.commit()