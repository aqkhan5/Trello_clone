from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    require_card_board_member,
    require_card_board_writer,
    require_checklist_board_writer,
    require_checklist_item_board_writer,
)
from app.db.session import get_db

from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem

from app.repositories.board_repository import BoardRepository
from app.repositories.card_member_repository import CardMemberRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
    ChecklistResponse,
    ChecklistUpdate,
)
from app.services.card_detail_service import CardDetailService

router = APIRouter(tags=["Checklists"])

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
    "/cards/{card_id}/checklists",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a checklist on a card",
)
async def create_checklist(
    card_id: UUID,
    payload: ChecklistCreate,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Checklist:
    service = get_card_detail_service(db)
    return await service.create_checklist(card_id, payload)

@router.get(
    "/cards/{card_id}/checklists",
    response_model=list[ChecklistResponse],
    status_code=status.HTTP_200_OK,
    summary="List checklists on a card",
)
async def list_card_checklists(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Checklist]:
    repo = ChecklistRepository(db)
    return await repo.list_checklists_for_card(card_id)

@router.patch(
    "/checklists/{checklist_id}",
    response_model=ChecklistResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a checklist",
)
async def update_checklist(
    payload: ChecklistUpdate,
    checklist_and_member: Annotated[tuple[Checklist, BoardMember | None], Depends(require_checklist_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Checklist:
    checklist, _ = checklist_and_member
    service = get_card_detail_service(db)
    return await service.update_checklist(checklist, payload)

@router.delete(
    "/checklists/{checklist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist",
)
async def delete_checklist(
    checklist_and_member: Annotated[tuple[Checklist, BoardMember | None], Depends(require_checklist_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    checklist, _ = checklist_and_member
    service = get_card_detail_service(db)
    await service.delete_checklist(checklist)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post(
    "/checklists/{checklist_id}/items",
    response_model=ChecklistItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an item to a checklist",
)
async def create_checklist_item(
    checklist_id: UUID,
    payload: ChecklistItemCreate,
    _: Annotated[tuple[Checklist, BoardMember | None], Depends(require_checklist_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChecklistItem:
    service = get_card_detail_service(db)
    return await service.create_checklist_item(checklist_id, payload)

@router.patch(
    "/checklists/items/{item_id}",
    response_model=ChecklistItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update checklist item content, status, or position",
)
async def update_checklist_item(
    payload: ChecklistItemUpdate,
    item_and_member: Annotated[tuple[ChecklistItem, BoardMember | None], Depends(require_checklist_item_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChecklistItem:
    item, _ = item_and_member
    service = get_card_detail_service(db)
    return await service.update_checklist_item(item, payload)

@router.delete(
    "/checklists/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist item",
)
async def delete_checklist_item(
    item_and_member: Annotated[tuple[ChecklistItem, BoardMember | None], Depends(require_checklist_item_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    item, _ = item_and_member
    service = get_card_detail_service(db)
    await service.delete_checklist_item(item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
