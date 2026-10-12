from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_board_admin,
    require_board_member,
    require_workspace_member,
)
from app.db.session import get_db

from app.models.attachment import Attachment
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.card_label import CardLabel
from app.models.card_member import CardMember
from app.models.label import Label
from app.models.list import List as ListModel
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

from app.repositories.board_repository import BoardRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate, BoardDetailResponse
from app.schemas.board_member import (
    BoardMemberCreate,
    BoardMemberResponse,
    BoardMemberUpdate,
)
from app.services.board_service import BoardService

router = APIRouter(tags=["Boards"])

@router.post(
    "/workspaces/{workspace_id}/boards",
    response_model=BoardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a board in a workspace",
)
async def create_board(
    workspace_id: UUID,
    payload: BoardCreate,
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Create a new board and assign creator as ADMIN in a single transaction."""
    workspace, _ = workspace_and_member

    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.create_board(workspace.id, current_user.id, payload)

@router.get(
    "/workspaces/{workspace_id}/boards",
    response_model=list[BoardResponse],
    status_code=status.HTTP_200_OK,
    summary="List accessible boards in a workspace",
)
async def list_workspace_boards(
    workspace_id: UUID,
    _: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Board]:
    """List boards where the current user is creator or an assigned member."""
    board_repo = BoardRepository(db)
    return await board_repo.list_for_workspace(workspace_id, current_user.id)

@router.get(
    "/boards/{board_id}",
    response_model=BoardDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get board details with pre-loaded lists and cards",
)
async def get_board(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BoardDetailResponse:
    """Fetch board details including lists and cards in an optimized multi-query join."""
    board, _ = board_and_member

    list_stmt = (
        select(ListModel)
        .where(ListModel.board_id == board.id, ListModel.is_archived.is_(False))
        .order_by(ListModel.position.asc())
    )
    list_res = await db.execute(list_stmt)
    lists = list(list_res.scalars().all())

    list_ids = [l.id for l in lists]
    cards_by_list: dict[UUID, list[dict]] = {l.id: [] for l in lists}

    if list_ids:
        card_stmt = (
            select(Card)
            .where(Card.list_id.in_(list_ids), Card.is_archived.is_(False))
            .order_by(Card.position.asc())
        )
        card_res = await db.execute(card_stmt)
        all_cards = list(card_res.scalars().all())
        card_ids = [c.id for c in all_cards]

        labels_by_card: dict[UUID, list[Label]] = {c.id: [] for c in all_cards}
        members_by_card: dict[UUID, list[CardMember]] = {c.id: [] for c in all_cards}
        attachments_by_card: dict[UUID, list[Attachment]] = {c.id: [] for c in all_cards}

        if card_ids:
            label_stmt = (
                select(CardLabel.card_id, Label)
                .join(Label, CardLabel.label_id == Label.id)
                .where(CardLabel.card_id.in_(card_ids))
                .order_by(Label.name.asc())
            )
            for cid, lbl in (await db.execute(label_stmt)).all():
                labels_by_card[cid].append(lbl)

            member_stmt = (
                select(CardMember)
                .where(CardMember.card_id.in_(card_ids))
                .options(selectinload(CardMember.user))
                .order_by(CardMember.assigned_at.asc())
            )
            for cm in (await db.execute(member_stmt)).scalars().all():
                members_by_card[cm.card_id].append(cm)

            att_stmt = (
                select(Attachment)
                .where(Attachment.card_id.in_(card_ids))
                .order_by(Attachment.created_at.desc())
            )
            for att in (await db.execute(att_stmt)).scalars().all():
                attachments_by_card[att.card_id].append(att)

        for card in all_cards:
            card_dict = {
                "id": card.id,
                "list_id": card.list_id,
                "created_by": card.created_by,
                "title": card.title,
                "description": card.description,
                "position": card.position,
                "due_date": card.due_date,
                "is_completed": card.is_completed,
                "is_archived": card.is_archived,
                "cover_color": card.cover_color,
                "cover_image": card.cover_image,
                "created_at": card.created_at,
                "updated_at": card.updated_at,
                "labels": labels_by_card.get(card.id, []),
                "members": members_by_card.get(card.id, []),
                "attachments": attachments_by_card.get(card.id, []),
            }
            cards_by_list[card.list_id].append(card_dict)

    lists_with_cards = []
    for l in lists:
        list_dict = {
            "id": l.id,
            "board_id": l.board_id,
            "title": l.title,
            "color": l.color,
            "position": l.position,
            "is_archived": l.is_archived,
            "created_at": l.created_at,
            "updated_at": l.updated_at,
            "cards": cards_by_list.get(l.id, []),
        }
        lists_with_cards.append(list_dict)

    return BoardDetailResponse(
        id=board.id,
        workspace_id=board.workspace_id,
        created_by=board.created_by,
        title=board.title,
        description=board.description,
        background=board.background,
        visibility=board.visibility,
        is_archived=board.is_archived,
        created_at=board.created_at,
        updated_at=board.updated_at,
        lists=lists_with_cards,
    )

@router.patch(
    "/boards/{board_id}",
    response_model=BoardResponse,
    status_code=status.HTTP_200_OK,
    summary="Update board",
)
async def update_board(
    payload: BoardUpdate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Update title, description, or closed status (Requires Board ADMIN or Creator)."""
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_board(board, payload)

@router.delete(
    "/boards/{board_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete board",
)
async def delete_board(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Delete a board and cascade all children (Requires Board ADMIN or Creator)."""
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.delete_board(board)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get(
    "/boards/{board_id}/members",
    response_model=list[BoardMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List board members",
)
async def list_board_members(
    board_id: UUID,
    _: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[BoardMember]:
    """Retrieve all assigned members on the board with user profile details."""
    board_repo = BoardRepository(db)
    return await board_repo.list_members(board_id)

@router.post(
    "/boards/{board_id}/members",
    response_model=BoardMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a member to the board",
)
async def add_board_member(
    board_id: UUID,
    payload: BoardMemberCreate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BoardMember:
    """Add an existing workspace member to the board (Requires Board ADMIN)."""
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.add_board_member(board, payload.user_id, payload.role)

@router.patch(
    "/boards/{board_id}/members/{user_id}",
    response_model=BoardMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Update member role on board",
)
async def update_board_member_role(
    user_id: UUID,
    payload: BoardMemberUpdate,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BoardMember:
    """Update role. Board creator cannot be demoted."""
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    return await service.update_member_role(board, user_id, payload.role)

@router.delete(
    "/boards/{board_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from the board",
)
async def remove_board_member(
    user_id: UUID,
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_admin)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Remove member from board. Board creator cannot be removed."""
    board, _ = board_and_member
    board_repo = BoardRepository(db)
    workspace_repo = WorkspaceRepository(db)
    service = BoardService(board_repo, workspace_repo, db)
    await service.remove_member(board, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
