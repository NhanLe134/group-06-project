"""WebSocket Pub/Sub in-process (architecture.md Mục 4, ADR-ARCH-001).

Kênh dùng cho KDS: `kds:tickets` (vòng đời món trong bếp) và `menu:oos` (Hết hàng).
Giới hạn: state nằm trong 1 tiến trình — client chỉ nhận sự kiện của backend mà nó kết nối.
"""

import logging
from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from fastapi import WebSocket

log = logging.getLogger("app.ws")
KDS_CHANNEL = "kds:tickets"
MENU_OOS_CHANNEL = "menu:oos"
CASHIER_CHANNEL = "cashier:tables"


class ConnectionManager:
    def __init__(self) -> None:
        self.channels: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, channel: str, ws: WebSocket) -> None:
        await ws.accept()
        self.channels[channel].add(ws)

    def disconnect(self, channel: str, ws: WebSocket) -> None:
        self.channels[channel].discard(ws)

    async def publish(self, channel: str, event: str, payload: dict[str, Any]) -> None:
        """Gửi envelope chuẩn {event, payload, emitted_at} (api-contract.md Mục 5)."""
        message = {"event": event, "payload": payload, "emitted_at": datetime.now(UTC).isoformat()}
        for ws in list(self.channels[channel]):
            try:
                await ws.send_json(message)
            except Exception:  # client đã ngắt giữa chừng — bỏ khỏi kênh, không làm hỏng request
                log.warning("ws_client_dropped channel=%s event=%s", channel, event)
                self.disconnect(channel, ws)


manager = ConnectionManager()
