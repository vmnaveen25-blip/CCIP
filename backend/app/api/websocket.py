from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import Optional

from app.core.security import decode_token
from app.services.websocket_manager import ws_manager
from app.core.logging import logger

router = APIRouter(tags=["Real-time Operations"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Authenticated WebSocket connection for live telemetry, instant alerts, and operational notifications.
    Pass JWT access token via ?token=... query parameter.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_token(token, is_refresh=False)
        user_id = payload.get("sub")
        role = payload.get("role", "CITIZEN")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.warning(f"WebSocket auth handshake failed: {str(e)}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(websocket, user_id=user_id, role=role)
    try:
        while True:
            data = await websocket.receive_text()
            # Respond to heartbeats / ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id=user_id, role=role)
    except Exception as e:
        logger.warning(f"WebSocket unexpected error: {str(e)}")
        ws_manager.disconnect(websocket, user_id=user_id, role=role)
