from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_attachment_or_404,
    get_current_user,
    require_card_board_member,
    require_card_board_writer,
)
from app.db.session import get_db
from app.models.attachment import Attachment
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.board_repository import BoardRepository
from app.repositories.card_repository import CardRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.list_repository import ListRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.attachment import AttachmentCreate, AttachmentResponse
from app.services.collaboration_service import CollaborationService

router = APIRouter(tags=["Attachments"])


def get_collaboration_service(db: AsyncSession) -> CollaborationService:
    return CollaborationService(
        comment_repo=CommentRepository(db),
        attachment_repo=AttachmentRepository(db),
        activity_repo=ActivityLogRepository(db),
        card_repo=CardRepository(db),
        list_repo=ListRepository(db),
        board_repo=BoardRepository(db),
        workspace_repo=WorkspaceRepository(db),
        db=db,
    )


@router.post(
    "/cards/{card_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an attachment to a card",
)
async def create_attachment(
    card_id: UUID,
    payload: AttachmentCreate,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Attachment:
    service = get_collaboration_service(db)
    return await service.add_attachment(card_id, current_user.id, payload)


@router.get(
    "/cards/{card_id}/attachments",
    response_model=list[AttachmentResponse],
    status_code=status.HTTP_200_OK,
    summary="List attachments for a card",
)
async def list_card_attachments(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Attachment]:
    repo = AttachmentRepository(db)
    return await repo.list_for_card(card_id)


@router.delete(
    "/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an attachment",
)
async def delete_attachment(
    attachment: Annotated[Attachment, Depends(get_attachment_or_404)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # Verify write access on parent card
    await require_card_board_writer((await CardRepository(db).get_by_id(attachment.card_id), None), current_user, db)
    service = get_collaboration_service(db)
    await service.delete_attachment(attachment)
    return Response(status_code=status.HTTP_204_NO_CONTENT)