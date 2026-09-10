# Purpose: Define API routes for managing labels that belong to a board.
# Working: Authorization dependencies protect each route, while CardDetailService handles label business logic.

# Typed route parameters and FastAPI dependency/response helpers.
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

# Authorization dependencies for board-level read and write access.
from app.api.deps import (
    require_board_member,
    require_board_writer,
    require_label_board_writer,
)
from app.db.session import get_db

# ORM models returned by authorization dependencies and route handlers.
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.label import Label

# Repositories required by the shared card-detail service.
from app.repositories.board_repository import BoardRepository
from app.repositories.card_member_repository import CardMemberRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.schemas.label import LabelCreate, LabelResponse, LabelUpdate
from app.services.card_detail_service import CardDetailService

# Label routes are grouped under the Labels tag in API documentation.
router = APIRouter(tags=["Labels"])


# Build the service with one shared database session and all repositories it needs.
def get_card_detail_service(db: AsyncSession) -> CardDetailService:
    return CardDetailService(
        label_repo=LabelRepository(db),
        card_member_repo=CardMemberRepository(db),
        checklist_repo=ChecklistRepository(db),
        board_repo=BoardRepository(db),
        list_repo=ListRepository(db),
        db=db,
    )


# Board label taxonomy endpoints


# Create a label definition for a board; writer access is required.
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
    # The authorization dependency has already verified access to this board.
    service = get_card_detail_service(db)
    return await service.create_board_label(board_id, payload)


# List all label definitions on a board; member access is sufficient.
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
    # This read-only operation uses the repository directly.
    repo = LabelRepository(db)
    return await repo.list_for_board(board_id)


# Update a label after verifying write access to its owning board.
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
    # The dependency resolves the label and its board membership before this runs.
    label, _ = label_and_member
    service = get_card_detail_service(db)
    return await service.update_label(label, payload)


# Delete a label definition; existing card links are handled by model relationships.
@router.delete(
    "/labels/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete board label",
)
async def delete_label(
    label_and_member: Annotated[tuple[Label, BoardMember | None], Depends(require_label_board_writer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    # The service commits the deletion before the endpoint returns HTTP 204.
    label, _ = label_and_member
    service = get_card_detail_service(db)
    await service.delete_label(label)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
    