import logging
import uuid
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.config import settings
from app.core.websocket import manager

logger = logging.getLogger("uvicorn")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/boards/{board_id}")
async def websocket_board_endpoint(
    websocket: WebSocket,
    board_id: UUID,
    token: str | None = Query(default=None),
) -> None:
    """Real-time WebSocket endpoint for board updates."""
    # 1. Authenticate JWT token
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = uuid.UUID(user_id_str)
    except Exception as exc:
        logger.warning(f"[WS] Authentication failed: {exc}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Join the board room
    await manager.connect(board_id, websocket)

    try:
        # Send initial handshake message
        await websocket.send_json({
            "type": "CONNECTED",
            "board_id": str(board_id),
            "user_id": str(user_id),
        })

        # Keep connection open and process incoming messages (ping/heartbeats)
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif msg_type == "broadcast":
                # Ephemeral client-to-client broadcast (e.g. typing or cursor sync)
                payload_data = data.get("payload", {})
                await manager.broadcast_to_board(board_id, payload_data, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(board_id, websocket)
    except Exception as exc:
        logger.info(f"[WS] Connection terminated: {exc}")
        manager.disconnect(board_id, websocket)
