"""US-03 — API cho màn hình Bếp KDS. Spec: vault/06-Engineering/story-spec-us03-kds.md."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.errors import ApiError
from app.models import ChiTietMon, HoaDon, PhienBan, ThucDon
from app.routers.menu import broadcast_flipped
from app.schemas.kds import KdsItemOut, SplitIn, SplitOut, StatusUpdateIn
from app.services import kds as service
from app.ws.manager import KDS_CHANNEL, manager

router = APIRouter(prefix="/kds", tags=["kds"])
Db = Annotated[AsyncSession, Depends(get_db)]


async def _notify(items: list[KdsItemOut], reason: str) -> None:
    """Báo mọi màn hình KDS tải lại; món vừa xong thì báo thêm cho Phục vụ (AC2)."""
    await manager.publish(
        KDS_CHANNEL, "KDS_ITEMS_CHANGED", {"item_ids": [str(i.id) for i in items], "reason": reason}
    )
    for i in items:
        if i.trangthai == service.DA_XONG:
            await manager.publish(
                KDS_CHANNEL,
                "ITEM_READY",
                {
                    "chitietmon_id": str(i.id),
                    "ban": i.ban,
                    "tenmon": i.tenmon,
                    "soluong": i.soluong,
                },
            )


@router.get("/items", response_model=list[KdsItemOut])
async def list_items(db: Db) -> list[KdsItemOut]:
    """Món đang ở cột Chờ nấu / Đang nấu / Đã nấu, xếp theo giờ gọi (FIFO)."""
    return await service.list_items(db)


@router.patch("/items/{item_id}/status", response_model=KdsItemOut)
async def update_status(item_id: str, body: StatusUpdateIn, db: Db) -> KdsItemOut:
    """AC2 — đổi trạng thái 1 thẻ món (kéo thả hoặc bấm nút)."""
    item = await service.update_status(db, item_id, body.trangthai)
    await _notify([item], "status")
    return item


@router.post("/items/{item_id}/split", response_model=SplitOut)
async def split_item(item_id: str, body: SplitIn, db: Db) -> SplitOut:
    """Nấu/Xong từng phần (vd. 5/10 suất): tách dòng mới mang trạng thái mới."""
    goc, moi = await service.split_item(db, item_id, body.soluong, body.trangthai)
    await _notify([goc, moi], "split")
    return SplitOut(goc=goc, moi=moi)


@router.post("/items/{item_id}/cancel-out-of-stock", response_model=KdsItemOut)
async def cancel_out_of_stock(item_id: str, db: Db) -> KdsItemOut:
    """Xóa món chờ nấu đã hết nguyên liệu khỏi hàng đợi (trạng thái da_huy + loghuymon)."""
    item, changed = await service.cancel_out_of_stock(db, item_id)
    await _notify([item], "cancel_out_of_stock")
    await broadcast_flipped(db, changed)  # hoàn kho: món dùng chung nguyên liệu có thể bán lại
    return item


DEMO_DISH = "Phở bò tái lăn"
DEMO_ORDERS = [("Bàn 01 (demo)", 2, "Không hành"), ("Bàn 02 (demo)", 1, None)]


@router.post("/demo/orders", response_model=list[KdsItemOut], include_in_schema=False)
async def create_demo_orders(db: Db) -> list[KdsItemOut]:
    """CHỈ cho demo AC1 (AI gom mẻ) khi chưa có luồng đặt món thật — bật bằng DEMO_MODE=true.

    Tạo đơn đã chốt cho 2 bàn demo cùng gọi Phở bò. Xóa dữ liệu demo:
    `uv run python -m scripts.seed_demo --xoa-demo`.
    """
    if not settings.demo_mode:
        raise ApiError(404, "NOT_FOUND", "Chức năng demo đang tắt.")
    mon = (await db.execute(select(ThucDon).where(ThucDon.tenmon == DEMO_DISH))).scalars().first()
    if mon is None:
        raise ApiError(409, "MENU_ITEM_MISSING", f"Chưa có món '{DEMO_DISH}' trong thực đơn.")
    created: list[ChiTietMon] = []
    for tenban, soluong, ghichu in DEMO_ORDERS:
        phien = (
            (await db.execute(select(PhienBan).where(PhienBan.tenban == tenban))).scalars().first()
        )
        if phien is None:
            phien = PhienBan(tenban=tenban, trangthai="dang_phuc_vu")
            db.add(phien)
            await db.flush()
        hoadon = HoaDon(phienban_id=phien.id, trangthai="da_chot")
        db.add(hoadon)
        await db.flush()
        item = ChiTietMon(hoadon_id=hoadon.id, thucdon_id=mon.id, soluong=soluong, ghichu=ghichu)
        db.add(item)
        created.append(item)
    await db.commit()
    items = [await service.get_item(db, i.id) for i in created]
    await _notify(items, "new_order")
    return items
