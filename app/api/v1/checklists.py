# Purpose: Define API routes for checklists and checklist items attached to cards.
# Working: Access dependencies protect each resource, repositories handle reads, and CardDetailService handles writes.

# Typed route parameters and FastAPI dependency/response helpers.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

# Dependencies enforce board membership or write access through the parent card.
from app.api.deps import (
    require_card_board_member,
    require_card_board_writer,
    require_checklist_board_writer,
    require_checklist_item_board_writer,
)
from app.db.session import get_db

# ORM models returned by authorization dependencies and route handlers.
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem

# Repositories required by the shared card-detail service.
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

# Checklist routes are grouped under the Checklists tag in API documentation.
router = APIRouter(tags=["Checklists"])


# Build one service with a shared session and all repositories it coordinates.
def get_card_detail_service(db: AsyncSession) -> CardDetailService:
    return CardDetailService(
        label_repo=LabelRepository(db),
        card_member_repo=CardMemberRepository(db),
        checklist_repo=ChecklistRepository(db),
        board_repo=BoardRepository(db),
        list_repo=ListRepository(db),
        db=db,
    )


# Checklist endpoints

# Create a checklist after board-level write access is verified.
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
    # CardDetailService calculates a default position and commits the checklist.
    service = get_card_detail_service(db)
    return await service.create_checklist(card_id, payload)


# List checklists with their items; board-member access is sufficient.
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
    # This read-only operation uses the repository directly.
    repo = ChecklistRepository(db)
    return await repo.list_checklists_for_card(card_id)


# Update a checklist after resolving it through its parent card and board.
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
    # The dependency supplies the authorized checklist instance.
    checklist, _ = checklist_and_member
    service = get_card_detail_service(db)
    return await service.update_checklist(checklist, payload)


# Delete a checklist and its dependent items.
@router.delete(
    "/checklists/{checklist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist",
)
async def delete_checklist(
    checklist_and_member: Annotated[tuple[Checklist, BoardMember | None], Depends(require_checklist_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # The service commits before the endpoint returns HTTP 204.
    checklist, _ = checklist_and_member
    service = get_card_detail_service(db)
    await service.delete_checklist(checklist)
    return Response(status_code=status.HTTP_204_NO_CONTENT)



# Checklist-item endpoints

# Add an item after verifying write access to the parent checklist's board.
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
    # CardDetailService calculates a default item position and persists the item.
    service = get_card_detail_service(db)
    return await service.create_checklist_item(checklist_id, payload)


# Update item content, completion state, or position.
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
    # The dependency resolves the item and confirms board-level write access.
    item, _ = item_and_member
    service = get_card_detail_service(db)
    return await service.update_checklist_item(item, payload)


# Permanently delete a checklist item.
@router.delete(
    "/checklists/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist item",
)
async def delete_checklist_item(
    item_and_member: Annotated[tuple[ChecklistItem, BoardMember | None], Depends(require_checklist_item_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # The service commits the deletion before returning HTTP 204.
    item, _ = item_and_member
    service = get_card_detail_service(db)
    await service.delete_checklist_item(item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)