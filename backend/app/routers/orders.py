"""API Gọi món (US-01), Hóa đơn tạm tính (US-09) và Thu ngân (US-05)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.menu import broadcast_flipped
from app.schemas.order import (
    CloseTableOut,
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
    """US-01 — Gửi bếp: đợt 1 tạo phiên + hóa đơn 'da_chot'; đợt 2+ chèn thêm món."""
    order, changed = await service.create_order(db, data)
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
    await broadcast_flipped(db, changed)
    return order


@router.get("/orders/current", response_model=OrderCurrentOut)
async def current_order(
    db: Db,
    table_name: Annotated[str, Query(min_length=1, examples=["Bàn 06"])],
) -> OrderCurrentOut:
    """US-09 — Hóa đơn tạm tính của bàn (món đợt 1/2 + trạng thái bưng món)."""
    return await service.current_order(db, table_name)


@router.post("/orders/{hoadon_id}/pay-qr", response_model=PayQrOut)
async def create_pay_qr(hoadon_id: str, db: Db) -> PayQrOut:
    """US-05 — Tạo mã QR thanh toán cho hóa đơn đang mở."""
    return await service.create_pay_qr(db, hoadon_id)


@router.get("/cashier/tables", response_model=list[TableOut])
async def cashier_tables(db: Db) -> list[TableOut]:
    """US-05 — Danh sách phiên bàn + hóa đơn đang mở cho màn Thu ngân."""
    return await service.list_cashier_tables(db)


@router.post("/tables/{phienban_id}/close", response_model=CloseTableOut)
async def close_table(phienban_id: str, db: Db) -> CloseTableOut:
    """US-05 — Xác nhận đã nhận tiền & Đóng bàn: hoadon 'da_thanh_toan', bàn về 'trong'."""
    result = await service.close_table(db, phienban_id)
    return CloseTableOut(**result)
