import logging
from typing import Any
from uuid import UUID
from fastapi import WebSocket

logger = logging.getLogger("uvicorn")

class BoardConnectionManager:
    """Manages active WebSocket connections grouped by board ID for real-time collaboration."""

    def __init__(self) -> None:
        # Maps board_id (string) to set of connected WebSockets
        self._active_connections: dict[str, set[WebSocket]] = {}

    async def connect(self, board_id: str | UUID, websocket: WebSocket) -> None:
        b_id = str(board_id)
        await websocket.accept()
        if b_id not in self._active_connections:
            self._active_connections[b_id] = set()
        self._active_connections[b_id].add(websocket)
        logger.info(f"[WS] Client connected to board {b_id}. Total active: {len(self._active_connections[b_id])}")

    def disconnect(self, board_id: str | UUID, websocket: WebSocket) -> None:
        b_id = str(board_id)
        if b_id in self._active_connections:
            self._active_connections[b_id].discard(websocket)
            if not self._active_connections[b_id]:
                del self._active_connections[b_id]
        logger.info(f"[WS] Client disconnected from board {b_id}.")

    async def broadcast_to_board(
        self,
        board_id: str | UUID,
        event: dict[str, Any],
        exclude: WebSocket | None = None,
    ) -> None:
        b_id = str(board_id)
        if b_id not in self._active_connections:
            return

        dead_connections: list[WebSocket] = []
        for ws in list(self._active_connections[b_id]):
            if exclude and ws == exclude:
                continue
            try:
                await ws.send_json(event)
            except Exception as exc:
                logger.warning(f"[WS] Failed to send event to client on board {b_id}: {exc}")
                dead_connections.append(ws)

        for ws in dead_connections:
            self.disconnect(b_id, ws)

# Global singleton connection manager
manager = BoardConnectionManager()
