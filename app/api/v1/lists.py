from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    require_board_member,
    require_board_writer,
    require_list_board_member,
    require_list_board_writer,
)
from app.db.session import get_db
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.list import List as ListModel
from app.repositories.list_repository import ListRepository
from app.schemas.list import ListCreate, ListResponse, ListUpdate
from app.services.list_service import ListService

router = APIRouter(tags=["Lists"])

# Board Scoped list endpoints

@router.post(
    "/boards/{board_id}/lists",
    response_model= ListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new list on Board"
)
async def create_list(
    board_id: UUID, 
    payload: ListCreate, 
    _: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_writer)
     ],
     db: Annotated[AsyncSession, Depends(get_db)]
     ) -> ListModel:
    """" Create a list on the board with automatic position assignment """
    list_repo = ListRepository(db)
    service = ListService(list_repo, db)

    return await service.create_list(board_id, payload)

@router.get(
    "/boards/{board_id}/lists",
    response_model= list[ListResponse],
    status_code= status.HTTP_200_OK,
    summary= "List all the columns on the board"
)
async def list_board_lists(
    board_id: UUID, 
    _ : Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    include_archived: bool = Query(
        default=False, description="Include archived columns"
    ),
) -> ListModel :
    """ Retrieve all the columns for a board sorted by position """
    list_repo = ListRepository(db)
    return await list_repo.list_for_board(
        board_id, include_archived = include_archived
        )

# Direct List Endpoints

@router.get(
    "/lists/{list_id}",
    response_model=ListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a list by ID",
)
async def get_list(
    list_and_member: Annotated[
        tuple[ListModel, BoardMember | None], Depends(require_list_board_member)
    ]
) -> ListModel:
    """ Retrieve a single list by ID after verifying board access """
    list_obj, _ = list_and_member
    return list_obj


@router.patch(
    "/lists/{list_id}",
    response_model=ListResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a list title, position, or archived status",
)
async def update_list(
    payload: ListUpdate,
    list_and_member: Annotated[
        tuple[ListModel, BoardMember | None], Depends(require_list_board_writer)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ListModel:
    """" Update a list, (Required a board writer permissions), """
    list_obj, _ = list_and_member
    list_repo = ListRepository(db)
    service = ListService(list_repo, db)
    return await service.update_list(list_obj, payload)

@router.delete(
    "/lists/{list_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a list",
)
async def delete_list(
    list_and_member: Annotated[
        tuple[ListModel, BoardMember|None], Depends(require_list_board_writer)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Delete a list and cascade card ( Requires the board writer permissions.)"""
    list_obj, _ = list_and_member
    list_repo = ListRepository(db)
    service = ListService(list_repo, db)
    await service.delete_list(list_obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)