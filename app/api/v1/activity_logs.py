# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_card_board_member
from app.db.session import get_db
from app.models.board_member import BoardMember
from app.models.card import Card
from app.repositories.activity_log_repository import ActivityLogRepository
from app.schemas.activity_log import ActivityLogResponse

# ---------------------------------------------------------------------------
# Router Configuration
# ---------------------------------------------------------------------------
router = APIRouter(tags=["Activity Logs"])

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/cards/{card_id}/activity",
    response_model=list[ActivityLogResponse],
    status_code=status.HTTP_200_OK,
    summary="Get activity logs for a card",
)
async def get_card_activity(
    card_id: UUID,
    _: Annotated[tuple[Card, BoardMember | None], Depends(require_card_board_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list:
    repo = ActivityLogRepository(db)
    return await repo.list_for_entity("CARD", card_id)
