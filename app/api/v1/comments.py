from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_comment_or_404,
    get_current_user,
    require_card_board_member,
    require_card_board_writer,
)
from app.db.session import get_db
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.comment import Comment
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.board_repository import BoardRepository
from app.repositories.card_repository import CardRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.list_repository import ListRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services.collaboration_service import CollaborationService

router = APIRouter(tags=["Comments"])


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
    "/cards/{card_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a card",
)
async def create_comment(
    card_id: UUID,
    payload: CommentCreate,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Comment:
    service = get_collaboration_service(db)
    return await service.add_comment(card_id, current_user.id, payload)


@router.get(
    "/cards/{card_id}/comments",
    response_model=list[CommentResponse],
    status_code=status.HTTP_200_OK,
    summary="List comments for a card",
)
async def list_card_comments(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Comment]:
    repo = CommentRepository(db)
    return await repo.list_for_card(card_id)


@router.patch(
    "/comments/{comment_id}",
    response_model=CommentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a comment",
)
async def update_comment(
    payload: CommentUpdate,
    comment: Annotated[Comment, Depends(get_comment_or_404)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Comment:
    service = get_collaboration_service(db)
    return await service.update_comment(comment, current_user.id, payload)


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a comment",
)
async def delete_comment(
    comment: Annotated[Comment, Depends(get_comment_or_404)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    service = get_collaboration_service(db)
    await service.delete_comment(comment, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)