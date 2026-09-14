from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    require_board_member,
    require_board_writer,
    require_label_board_writer,
)
from app.db.session import get_db

from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.label import Label

from app.repositories.board_repository import BoardRepository
from app.repositories.card_member_repository import CardMemberRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.schemas.label import LabelCreate, LabelResponse, LabelUpdate
from app.services.card_detail_service import CardDetailService

router = APIRouter(tags=["Labels"])

def get_card_detail_service(db: AsyncSession) -> CardDetailService:
    return CardDetailService(
        label_repo=LabelRepository(db),
        card_member_repo=CardMemberRepository(db),
        checklist_repo=ChecklistRepository(db),
        board_repo=BoardRepository(db),
        list_repo=ListRepository(db),
        db=db,
    )

@router.post(
    "/boards/{board_id}/labels",
    response_model=LabelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create board label taxonomy",
)
async def create_board_label(
    board_id: UUID,
    payload: LabelCreate,
    _: Annotated[tuple[Board, BoardMember | None], Depends(require_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Label:
    service = get_card_detail_service(db)
    return await service.create_board_label(board_id, payload)

@router.get(
    "/boards/{board_id}/labels",
    response_model=list[LabelResponse],
    status_code=status.HTTP_200_OK,
    summary="List labels defined on board",
)
async def list_board_labels(
    board_id: UUID,
    _: Annotated[tuple[Board, BoardMember | None], Depends(require_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Label]:
    repo = LabelRepository(db)
    return await repo.list_for_board(board_id)

@router.patch(
    "/labels/{label_id}",
    response_model=LabelResponse,
    status_code=status.HTTP_200_OK,
    summary="Update board label",
)
async def update_label(
    payload: LabelUpdate,
    label_and_member: Annotated[tuple[Label, BoardMember | None], Depends(require_label_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Label:
    label, _ = label_and_member
    service = get_card_detail_service(db)
    return await service.update_label(label, payload)

@router.delete(
    "/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete board label",
)
async def delete_label(
    label_and_member: Annotated[tuple[Label, BoardMember | None], Depends(require_label_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    label, _ = label_and_member
    service = get_card_detail_service(db)
    await service.delete_label(label)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
