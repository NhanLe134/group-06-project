"""API Gọi món (US-01), Hóa đơn tạm tính (US-09) và Thu ngân (US-05).

Thiết kế ADR-N14: mỗi lần gửi bếp = 1 phiếu bàn; hoadon chỉ sinh khi thanh toán.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.menu import broadcast_flipped
from app.schemas.order import (
    OrderCreateIn,
    OrderCurrentOut,
    PayQrOut,
    TableOut,
)
from app.services import orders as service
from app.ws.manager import KDS_CHANNEL, manager

router = APIRouter(tags=["orders"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.post("/orders", response_model=OrderCurrentOut)
async def create_order(data: OrderCreateIn, db: Db) -> OrderCurrentOut:
    """US-01 — Gửi bếp: mỗi lần gọi = 1 phiếu bàn mới (hoadon_id NULL)."""
    order, flipped = await service.create_order(db, data)
    # US-03 AC1: báo màn hình Bếp (KDS) có món mới — KDS tự tải lại GET /kds/items
    await manager.publish(
        KDS_CHANNEL,
        "KDS_ITEMS_CHANGED",
        {
            "item_ids": [i.id for i in order.items if i.trangthai == "cho_nau"],
            "reason": "new_order",
            "ban": order.table_name,
        },
    )
    # Món vừa hết hàng do trừ kho → khóa trên E-Menu/KDS ngay (US-03 AC3)
    await broadcast_flipped(db, flipped)
    return order


@router.get("/orders/current", response_model=OrderCurrentOut)
async def current_order(
    db: Db,
    table_name: Annotated[str, Query(min_length=1, examples=["Bàn 06"])],
) -> OrderCurrentOut:
    """US-09 — Hóa đơn tạm tính: các phiếu CHƯA tính tiền, nhóm theo đợt."""
    return await service.current_order(db, table_name)


@router.get("/cashier/tables", response_model=list[TableOut])
async def cashier_tables(db: Db) -> list[TableOut]:
    """US-05 — Danh sách bàn master + tổng tiền các phiếu chưa tính tiền."""
    rows = await service.list_cashier_tables(db)
    return [TableOut(**r) for r in rows]


@router.post("/tables/{ban_id}/pay-qr", response_model=PayQrOut)
async def create_pay_qr(ban_id: str, db: Db) -> PayQrOut:
    """US-05 — QR thanh toán cho các phiếu CHƯA tính tiền của bàn (không ghi DB)."""
    return await service.build_pay_qr(db, ban_id)


@router.post("/tables/{ban_id}/close", response_model=dict)
async def close_table(ban_id: str, db: Db) -> dict:
    """US-05 — Xác nhận đã nhận tiền: tạo hoadon, gắn các phiếu, bàn về chờ dọn (3)."""
    return await service.close_table(db, ban_id)


@router.post("/tables/{ban_id}/cleaned", response_model=dict)
async def mark_table_cleaned(ban_id: str, db: Db) -> dict:
    """Waiter xác nhận đã dọn xong: bàn chờ dọn (3) → sẵn sàng (1)."""
    return await service.mark_cleaned(db, ban_id)
