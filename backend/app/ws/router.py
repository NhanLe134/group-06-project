from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/{channel}")
async def ws_endpoint(websocket: WebSocket, channel: str) -> None:
    # TODO(auth): kiểm tra token qua query string khi có JWT (api-contract.md Mục 5)
    await manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive / ping từ client
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)
