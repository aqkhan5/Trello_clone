# Purpose: Manage labels, card members, checklists, and checklist items attached to cards.
# Working: Validates cross-resource rules, delegates persistence to repositories, and commits each workflow.

# Position values let new checklists/items be inserted without renumbering siblings.
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.card import Card
from app.models.card_member import CardMember
from app.models.checklist import Checklist
from app.models.checklist_item import ChecklistItem
from app.models.label import Label
from app.repositories.board_repository import BoardRepository
from app.repositories.card_member_repository import CardMemberRepository
from app.repositories.checklist_repository import ChecklistRepository
from app.repositories.label_repository import LabelRepository
from app.repositories.list_repository import ListRepository
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistUpdate,
)
from app.schemas.label import LabelCreate, LabelUpdate

# Default spacing used when a checklist or item position is not supplied.
DEFAULT_POSITION_STEP = Decimal("65536.0")


# Business logic for the detailed resources that belong to a card.
# All repositories share the same session, while this service controls commits.
class CardDetailService:
    def __init__(
        self,
        label_repo: LabelRepository,
        card_member_repo: CardMemberRepository,
        checklist_repo: ChecklistRepository,
        board_repo: BoardRepository,
        list_repo: ListRepository,
        db: AsyncSession,
    ):
        # Keep all related repositories available for cross-resource validation.
        self.label_repo = label_repo
        self.card_member_repo = card_member_repo
        self.checklist_repo = checklist_repo
        self.board_repo = board_repo
        self.list_repo = list_repo
        self.db = db

    
    # Labels

    # Board labels must be created and managed independently from card links.
    async def create_board_label(self, board_id: UUID, data: LabelCreate) -> Label:
        label = Label(board_id=board_id, name=data.name, color=data.color)
        await self.label_repo.create(label)
        await self.db.commit()
        await self.db.refresh(label)
        return label

    async def update_label(self, label: Label, data: LabelUpdate) -> Label:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(label, key, value)
        await self.db.commit()
        await self.db.refresh(label)
        return label

    async def delete_label(self, label: Label) -> None:
        await self.label_repo.delete(label)
        await self.db.commit()

    async def attach_label_to_card(self, card: Card, label_id: UUID) -> None:
        # A label can only be attached when it belongs to the card's board and
        # is not already linked to the card.
        label = await self.label_repo.get_by_id(label_id)
        if not label:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Label not found",
            )

        card_list = await self.list_repo.get_by_id(card.list_id)
        if not card_list or label.board_id != card_list.board_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Label does not belong to the same board as the card",
            )

        existing = await self.label_repo.get_card_label(card.id, label_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Label is already attached to this card",
            )

        await self.label_repo.attach_to_card(card.id, label_id)
        await self.db.commit()

    async def detach_label_from_card(self, card_id: UUID, label_id: UUID) -> None:
        # Removing a link does not delete the label itself.
        card_label = await self.label_repo.get_card_label(card_id, label_id)
        if not card_label:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Label not attached to this card",
            )
        await self.label_repo.detach_from_card(card_label)
        await self.db.commit()

    # Card Members

    # Card assignment requires board membership and prevents duplicate assignments.
    async def assign_card_member(self, card: Card, target_user_id: UUID) -> CardMember:
        card_list = await self.list_repo.get_by_id(card.list_id)
        if not card_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="List not found",
            )

        board_member = await self.board_repo.get_member(
            card_list.board_id, target_user_id
        )
        if not board_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to the board before assignment to a card",
            )

        existing = await self.card_member_repo.get_member(card.id, target_user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already assigned to this card",
            )

        assignment = await self.card_member_repo.assign_member(
            card.id, target_user_id
        )
        await self.db.commit()
        await self.db.refresh(assignment)
        return assignment

    async def remove_card_member(self, card_id: UUID, target_user_id: UUID) -> None:
        # Remove only the card assignment; the user remains on the board.
        assignment = await self.card_member_repo.get_member(card_id, target_user_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not assigned to this card",
            )
        await self.card_member_repo.remove_member(assignment)
        await self.db.commit()

    # Checklists & Items


    # Checklists and items use the same position strategy as cards: use an
    # explicit position when provided, otherwise append after the current maximum.
    async def create_checklist(
        self, card_id: UUID, data: ChecklistCreate
    ) -> Checklist:
        if data.position is not None:
            pos = data.position
        else:
            max_pos = await self.checklist_repo.get_max_checklist_position(card_id)
            pos = (max_pos + DEFAULT_POSITION_STEP) if max_pos else DEFAULT_POSITION_STEP

        checklist = Checklist(card_id=card_id, title=data.title, position=pos)
        await self.checklist_repo.create_checklist(checklist)
        await self.db.commit()
        await self.db.refresh(checklist)
        return checklist

    async def update_checklist(
        self, checklist: Checklist, data: ChecklistUpdate
    ) -> Checklist:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(checklist, key, value)
        await self.db.commit()
        await self.db.refresh(checklist)
        return checklist

    async def delete_checklist(self, checklist: Checklist) -> None:
        await self.checklist_repo.delete_checklist(checklist)
        await self.db.commit()

    async def create_checklist_item(
        self, checklist_id: UUID, data: ChecklistItemCreate
    ) -> ChecklistItem:
        if data.position is not None:
            pos = data.position
        else:
            max_pos = await self.checklist_repo.get_max_item_position(checklist_id)
            pos = (max_pos + DEFAULT_POSITION_STEP) if max_pos else DEFAULT_POSITION_STEP

        item = ChecklistItem(
            checklist_id=checklist_id,
            content=data.content,
            position=pos,
            is_completed=False,
        )
        await self.checklist_repo.create_item(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_checklist_item(
        self, item: ChecklistItem, data: ChecklistItemUpdate
    ) -> ChecklistItem:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_checklist_item(self, item: ChecklistItem) -> None:
        await self.checklist_repo.delete_item(item)
        await self.db.commit()