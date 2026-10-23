import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from app.core.logging import logger


class ConnectionManager:
    """Manages active WebSocket connections with role and user-specific broadcasting."""

    def __init__(self):
        # Map user_id -> List[WebSocket]
        self.active_user_connections: Dict[str, List[WebSocket]] = {}
        # Map role -> List[WebSocket]
        self.active_role_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)

        if role not in self.active_role_connections:
            self.active_role_connections[role] = []
        self.active_role_connections[role].append(websocket)

        logger.info(f"WebSocket client connected: user={user_id}, role={role}")

    def disconnect(self, websocket: WebSocket, user_id: str, role: str):
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]

        if role in self.active_role_connections:
            if websocket in self.active_role_connections[role]:
                self.active_role_connections[role].remove(websocket)
            if not self.active_role_connections[role]:
                del self.active_role_connections[role]

        logger.info(f"WebSocket client disconnected: user={user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        sockets = self.active_user_connections.get(user_id, [])
        dead_sockets = []
        for socket in sockets:
            try:
                await socket.send_text(json.dumps(message))
            except Exception:
                dead_sockets.append(socket)
        for dead in dead_sockets:
            if dead in sockets:
                sockets.remove(dead)

    async def broadcast_to_role(self, message: dict, role: str):
        sockets = self.active_role_connections.get(role, [])
        dead_sockets = []
        for socket in sockets:
            try:
                await socket.send_text(json.dumps(message))
            except Exception:
                dead_sockets.append(socket)
        for dead in dead_sockets:
            if dead in sockets:
                sockets.remove(dead)

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        for user_id, sockets in list(self.active_user_connections.items()):
            for socket in sockets:
                try:
                    await socket.send_text(payload)
                except Exception:
                    pass

    def get_active_connections_count(self) -> int:
        return sum(len(sockets) for sockets in self.active_user_connections.values())


ws_manager = ConnectionManager()
