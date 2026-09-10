# API routes for creating, reading, moving, updating, and deleting cards.
# Access checks are handled by dependencies; business rules are delegated to
# CardService and read-only queries use CardRepository directly.

# Standard library and FastAPI imports for typed route definitions.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

# Reader/writer dependencies enforce access through the card's parent board.
from app.api.deps import (
    get_current_user,
    require_card_board_member,
    require_card_board_writer,
    require_list_board_member,
    require_list_board_writer,
)
from app.db.session import get_db

# ORM models used by dependency results and route return types.
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.card_member import CardMember
from app.models.label import Label
from app.models.list import List as ListModel
from app.models.user import User

# Repository and service layers used to execute card operations.
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

# Card routes are grouped under the Cards tag in API documentation.
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


# List-scoped Card Endpoints

# Create a card after the caller passes list-level board writer authorization.
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
    # Creation uses the service because it calculates the card position and commits.
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.create_card(list_id, current_user.id, payload)


# Read cards in a list; readers may optionally include archived cards.
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
    # The dependency checks board access; the repository performs the read query.
    card_repo = CardRepository(db)
    return await card_repo.list_for_list(list_id, include_archived=include_archived)


# Direct Card Endpoints

# Return one card after board-member authorization has succeeded.
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
    # The dependency performs the card lookup and access check before this handler.
    card, _ = card_and_member
    return card


# Update card content or state; writer access is required.
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
    # CardService applies partial-update rules and owns the transaction commit.
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.update_card(card, payload)


# Move a card between lists or assign a new position within its current list.
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
    # CardService validates cross-list moves and persists the new position.
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    return await service.move_card(card, payload)


# Permanently remove a card; writer access is required.
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
    # The service performs deletion and commits before the 204 response.
    card, _ = card_and_member
    card_repo = CardRepository(db)
    list_repo = ListRepository(db)
    service = CardService(card_repo, list_repo, db)
    await service.delete_card(card)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Card Member Endpoints
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Card Label Endpoints
# ---------------------------------------------------------------------------


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