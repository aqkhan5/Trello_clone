from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_card_board_member,
    require_card_board_writer,
    require_list_board_member,
    require_list_board_writer,
)
from app.db.session import get_db

from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.card_member import CardMember
from app.models.label import Label
from app.models.list import List as ListModel
from app.models.user import User

from app.repositories.board_repository import BoardRepository
from app.repositories.card_member_repository import CardMemberRepository
from app.repositories.card_repository import CardRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.schemas.card import CardCreate, CardMove, CardResponse, CardUpdate
from app.schemas.card_member import CardMemberCreate, CardMemberResponse
from app.schemas.label import LabelResponse
from app.services.card_detail_service import CardDetailService
from app.services.card_service import CardService

router = APIRouter(tags=["Cards"])

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
    "/lists/{list_id}/cards",
    response_model=CardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a card in a list",
)
async def create_card(
    list_id: UUID,
    payload: CardCreate,
    _: Annotated[
        tuple[ListModel, BoardMember | None], Depends(require_list_board_writer)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Card:
    """Create a new card assigned to the specified list."""
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.create_card(list_id, current_user.id, payload)

@router.get(
    "/lists/{list_id}/cards",
    response_model=list[CardResponse],
    status_code=status.HTTP_200_OK,
    summary="List all cards in a list",
)
async def list_cards_in_list(
    list_id: UUID,
    _: Annotated[
        tuple[ListModel, BoardMember | None], Depends(require_list_board_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    include_archived: bool = Query(
        default=False, description="Include archived cards"
    ),
) -> list[Card]:
    """Retrieve all cards belonging to a list, ordered by position."""
    card_repo = CardRepository(db)
    return await card_repo.list_for_list(list_id, include_archived=include_archived)

@router.get(
    "/cards/{card_id}",
    response_model=CardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get card details",
)
async def get_card(
    card_and_member: Annotated[
        tuple[Card, BoardMember | None], Depends(require_card_board_member)
    ],
) -> Card:
    """Retrieve details of a single card."""
    card, _ = card_and_member
    return card

@router.patch(
    "/cards/{card_id}",
    response_model=CardResponse,
    status_code=status.HTTP_200_OK,
    summary="Update card details",
)
async def update_card(
    payload: CardUpdate,
    card_and_member: Annotated[
        tuple[Card, BoardMember | None], Depends(require_card_board_writer)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Card:
    """Update title, description, due date, completion status, or archive state."""
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.update_card(card, payload)

@router.post(
    "/cards/{card_id}/move",
    response_model=CardResponse,
    status_code=status.HTTP_200_OK,
    summary="Move or reorder a card",
)
async def move_card(
    payload: CardMove,
    card_and_member: Annotated[
        tuple[Card, BoardMember | None], Depends(require_card_board_writer)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Card:
    """Move card to a new target list and/or assign a new fractional position."""
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.move_card(card, payload)

@router.delete(
    "/cards/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a card",
)
async def delete_card(
    card_and_member: Annotated[
        tuple[Card, BoardMember | None], Depends(require_card_board_writer)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Permanently delete a card."""
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    await service.delete_card(card)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get(
    "/cards/{card_id}/members",
    response_model=list[CardMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List members assigned to card",
)
async def list_card_members(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CardMember]:
    repo = CardMemberRepository(db)
    return await repo.list_card_members(card_id)

@router.post(
    "/cards/{card_id}/members",
    response_model=CardMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign user to card",
)
async def assign_card_member(
    card_id: UUID,
    payload: CardMemberCreate,
    card_and_member: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CardMember:
    card, _ = card_and_member
    service = get_card_detail_service(db)
    return await service.assign_card_member(card, payload.user_id)

@router.delete(
    "/cards/{card_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove user from card",
)
async def remove_card_member(
    card_id: UUID,
    user_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    service = get_card_detail_service(db)
    await service.remove_card_member(card_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get(
    "/cards/{card_id}/labels",
    response_model=list[LabelResponse],
    status_code=status.HTTP_200_OK,
    summary="List labels attached to card",
)
async def list_card_labels(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Label]:
    repo = LabelRepository(db)
    return await repo.list_for_card(card_id)

@router.post(
    "/cards/{card_id}/labels/{label_id}",
    status_code=status.HTTP_201_CREATED,
    summary="Attach label to card",
)
async def attach_card_label(
    card_id: UUID,
    label_id: UUID,
    card_and_member: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    card, _ = card_and_member
    service = get_card_detail_service(db)
    await service.attach_label_to_card(card, label_id)
    return Response(status_code=status.HTTP_201_CREATED)

@router.delete(
    "/cards/{card_id}/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Detach label from card",
)
async def detach_card_label(
    card_id: UUID,
    label_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    service = get_card_detail_service(db)
    await service.detach_label_from_card(card_id, label_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
