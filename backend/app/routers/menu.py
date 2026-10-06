import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.menu import ThucDon
from app.schemas.menu import MenuItemOut, StockUpdateIn
from app.services import kds as kds_service
from app.ws.manager import MENU_OOS_CHANNEL, manager

router = APIRouter(prefix="/menu", tags=["menu"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[MenuItemOut])
async def list_menu_items(db: Db) -> list[MenuItemOut]:
    """US-01 (vault/04-User-Stories/user-stories.md): khach xem E-Menu."""
    result = await db.execute(select(ThucDon).order_by(ThucDon.phanloai, ThucDon.tenmon))
    return [MenuItemOut.from_thucdon(mon) for mon in result.scalars().all()]


async def _broadcast_availability(db: AsyncSession, mon: MenuItemOut) -> None:
    # REQ-09 / BR-03: đồng bộ E-Menu, POS, KDS (api-contract.md Mục 5.2)
    await manager.publish(
        MENU_OOS_CHANNEL,
        "ITEM_OOS_BROADCAST",
        {
            "menu_item_id": str(mon.id),
            "menu_item_name": mon.name,
            "status": mon.status,
            "affected_table_sessions": await kds_service.draft_sessions_with_item(db, mon.id),
        },
    )


async def _set_availability(db: AsyncSession, item_id: uuid.UUID, available: bool) -> MenuItemOut:
    mon = MenuItemOut.from_thucdon(await kds_service.set_menu_availability(db, item_id, available))
    await _broadcast_availability(db, mon)
    return mon


@router.post("/items/{item_id}/out-of-stock", response_model=MenuItemOut)
async def mark_out_of_stock(item_id: uuid.UUID, db: Db) -> MenuItemOut:
    """US-03 AC3: Bếp đánh dấu Hết hàng → thucdon.trangthaiban = false."""
    return await _set_availability(db, item_id, False)


@router.post("/items/{item_id}/in-stock", response_model=MenuItemOut)
async def mark_in_stock(item_id: uuid.UUID, db: Db) -> MenuItemOut:
    """Mở bán lại món đã báo hết (409 STOCK_EMPTY nếu món đếm số lượng đang = 0)."""
    return await _set_availability(db, item_id, True)


@router.patch("/items/{item_id}/stock", response_model=MenuItemOut)
async def update_stock(item_id: uuid.UUID, body: StockUpdateIn, db: Db) -> MenuItemOut:
    """Cập nhật số lượng tồn của món bán nguyên đơn vị (đồ uống chai/lon...).

    Về 0 → món tự thành Hết hàng; nhập lại > 0 → bán lại (nếu không bị tắt bán thủ công).
    Chỉ phát sự kiện khi trạng thái còn/hết hàng thay đổi.
    """
    truoc = (await kds_service.get_menu_item(db, item_id)).het_hang
    mon = MenuItemOut.from_thucdon(await kds_service.set_menu_stock(db, item_id, body.stock))
    if (mon.status == "out_of_stock") != truoc:
        await _broadcast_availability(db, mon)
    return mon
