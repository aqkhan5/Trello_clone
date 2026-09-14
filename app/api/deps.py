import uuid
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.attachment import Attachment
from app.models.board import Board
from app.models.board_member import BoardMember, BoardRole
from app.models.card import Card
from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem
from app.models.comment import Comment
from app.models.label import Label
from app.models.list import List as ListModel
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.board_repository import BoardRepository
from app.repositories.card_repository import CardRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.auth import TokenPayload
from app.schemas.workspace_member import WorkspaceRole
from app.services.invitation_service import InvitationService

oauth_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    token: Annotated[str, Depends(oauth_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate the login token and return the authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW.Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user

async def get_workspace_or_404(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Workspace:
    """Find workspace by ID or return 404 if not found."""
    repo = WorkspaceRepository(db)
    workspace = await repo.get_by_id(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return workspace

async def require_workspace_member(
    workspace_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Workspace, WorkspaceMember]:
    """Verify that the current user is a member of the workspace."""
    workspace = await get_workspace_or_404(workspace_id, db)
    repo = WorkspaceRepository(db)
    member = await repo.get_member(workspace_id, current_user.id)

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )
    return workspace, member

async def require_workspace_admin(
    workspace_and_member: Annotated[
        tuple[Workspace, WorkspaceMember], Depends(require_workspace_member)
    ],
) -> tuple[Workspace, WorkspaceMember]:
    """Verify that the user is an admin or the owner of the workspace."""
    workspace, member = workspace_and_member
    is_owner = workspace.owner_id == member.user_id
    is_admin = member.role == WorkspaceRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required",
        )
    return workspace, member

async def get_board_or_404(
    board_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Board:
    """Find board by ID or return 404 if not found."""
    repo = BoardRepository(db)
    board = await repo.get_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found",
        )
    return board

async def require_board_member(
    board_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Board, BoardMember | None]:
    """Verify that user is a member of the board or owner of the workspace."""
    board = await get_board_or_404(board_id, db)
    board_repo = BoardRepository(db)
    board_member = await board_repo.get_member(board.id, current_user.id)

    if board_member:
        return board, board_member

    workspace_repo = WorkspaceRepository(db)
    workspace = await workspace_repo.get_by_id(board.workspace_id)
    if workspace and workspace.owner_id == current_user.id:
        return board, None

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not a member of this board",
    )

async def require_board_admin(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Board, BoardMember | None]:
    """Verify that user has admin permissions on the board."""
    board, board_member = board_and_member
    is_creator = board.created_by == current_user.id
    is_board_admin = board_member is not None and board_member.role == BoardRole.ADMIN

    if is_creator or is_board_admin:
        return board, board_member

    workspace_repo = WorkspaceRepository(db)
    workspace = await workspace_repo.get_by_id(board.workspace_id)
    if workspace and workspace.owner_id == current_user.id:
        return board, board_member

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Board admin permissions required",
    )

async def require_board_writer(
    board_and_member: Annotated[
        tuple[Board, BoardMember | None], Depends(require_board_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Board, BoardMember | None]:
    """Verify that user has write (edit) permissions on the board."""
    board, member = board_and_member
    if board.created_by == current_user.id:
        return board, member

    workspace_repo = WorkspaceRepository(db)
    workspace = await workspace_repo.get_by_id(board.workspace_id)
    if workspace and workspace.owner_id == current_user.id:
        return board, member

    if member is not None:
        observer_role = getattr(BoardRole, "OBSERVER", getattr(BoardRole, "VIEWER", None))
        if member.role == observer_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write permission required for this board",
            )
        return board, member

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Write permission required for this board",
    )

async def get_list_or_404(
    list_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ListModel:
    """Find list by ID or return 404 if not found."""
    repo = ListRepository(db)
    list_obj = await repo.get_by_id(list_id)
    if not list_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found",
        )
    return list_obj

async def require_list_board_member(
    list_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[ListModel, BoardMember | None]:
    """Verify that user is a member of the board containing this list."""
    list_obj = await get_list_or_404(list_id, db)
    board, member = await require_board_member(list_obj.board_id, current_user, db)
    return list_obj, member

async def require_list_board_writer(
    list_and_member: Annotated[
        tuple[ListModel, BoardMember | None],
        Depends(require_list_board_member),
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[ListModel, BoardMember | None]:
    """Verify that user has write permissions on the board for this list."""
    list_obj, member = list_and_member
    workspace_repo = WorkspaceRepository(db)
    board_repo = BoardRepository(db)
    board = await board_repo.get_by_id(list_obj.board_id)

    if board and board.created_by == current_user.id:
        return list_obj, member

    if board:
        workspace = await workspace_repo.get_by_id(board.workspace_id)
        if workspace and workspace.owner_id == current_user.id:
            return list_obj, member

    if member is not None:
        observer_role = getattr(BoardRole, "OBSERVER", getattr(BoardRole, "VIEWER", None))
        if member.role == observer_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write permission required for this board",
            )
        return list_obj, member

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Writer permission required for this board",
    )

async def get_card_or_404(
    card_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Card:
    """Find card by ID or return 404 if not found."""
    repo = CardRepository(db)
    card = await repo.get_by_id(card_id)
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )
    return card

async def require_card_board_member(
    card_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Card, BoardMember | None]:
    """Verify user can view this card by checking board membership."""
    card = await get_card_or_404(card_id, db)
    _, member = await require_list_board_member(card.list_id, current_user, db)
    return card, member

async def require_card_board_writer(
    card_and_member: Annotated[
        tuple[Card, BoardMember | None], Depends(require_card_board_member)
    ],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Card, BoardMember | None]:
    """Verify user has write permission to edit this card."""
    card, member = card_and_member
    list_repo = ListRepository(db)
    list_obj = await list_repo.get_by_id(card.list_id)
    if not list_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent list not found",
        )

    await require_list_board_writer((list_obj, member), current_user, db)
    return card, member

async def get_label_or_404(
    label_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Label:
    """Find label by ID or return 404 if not found."""
    repo = LabelRepository(db)
    label = await repo.get_by_id(label_id)
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found",
        )
    return label

async def require_label_board_writer(
    label_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Label, BoardMember | None]:
    """Verify write permission on the board owning this label."""
    label = await get_label_or_404(label_id, db)
    board_and_member = await require_board_member(label.board_id, current_user, db)
    await require_board_writer(board_and_member, current_user, db)
    return label, board_and_member[1]

async def get_checklist_or_404(
    checklist_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Checklist:
    """Find checklist by ID or return 404 if not found."""
    repo = ChecklistRepository(db)
    checklist = await repo.get_checklist_by_id(checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    return checklist

async def require_checklist_board_writer(
    checklist_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[Checklist, BoardMember | None]:
    """Verify write permission on the card owning this checklist."""
    checklist = await get_checklist_or_404(checklist_id, db)
    card_and_member = await require_card_board_member(checklist.card_id, current_user, db)
    await require_card_board_writer(card_and_member, current_user, db)
    return checklist, card_and_member[1]

async def get_checklist_item_or_404(
    item_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChecklistItem:
    """Find checklist item by ID or return 404 if not found."""
    repo = ChecklistRepository(db)
    item = await repo.get_item_by_id(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )
    return item

async def require_checklist_item_board_writer(
    item_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[ChecklistItem, BoardMember | None]:
    """Verify write permission on the checklist owning this item."""
    item = await get_checklist_item_or_404(item_id, db)
    checklist_and_member = await require_checklist_board_writer(item.checklist_id, current_user, db)
    return item, checklist_and_member[1]

async def get_comment_or_404(
    comment_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Comment:
    """Find comment by ID or return 404 if not found."""
    repo = CommentRepository(db)
    comment = await repo.get_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return comment

async def get_attachment_or_404(
    attachment_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Attachment:
    """Find attachment by ID or return 404 if not found."""
    repo = AttachmentRepository(db)
    attachment = await repo.get_by_id(attachment_id)
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    return attachment

async def get_invitation_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationRepository:
    """Create and return an InvitationRepository instance."""
    return InvitationRepository(db)

async def get_invitation_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    invitation_repo: Annotated[InvitationRepository, Depends(get_invitation_repository)],
) -> InvitationService:
    """Create and return an InvitationService instance with required repositories."""
    workspace_repo = WorkspaceRepository(db)
    user_repo = UserRepository(db)
    return InvitationService(
        invitation_repo=invitation_repo,
        workspace_repo=workspace_repo,
        user_repo=user_repo,
        db=db,
    )
