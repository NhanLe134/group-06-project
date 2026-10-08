from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.errors import ApiError
from app.models.menu import ThucDon
from app.schemas.menu import (
    MenuCreate,
    MenuItemCreateIn,
    MenuItemOut,
    MenuItemUpdateIn,
    MenuRead,
    MenuUpdate,
    StockUpdateIn,
)
from app.services import kds as kds_service
from app.ws.manager import MENU_OOS_CHANNEL, manager

router = APIRouter(prefix="/menu", tags=["menu"])
api_router = APIRouter(prefix="/api/menu", tags=["menu"])
Db = Annotated[AsyncSession, Depends(get_db)]


@api_router.get(
    "",
    response_model=list[MenuRead],
    summary="Xem danh sách món ăn",
    description="Trả về các món trong thực đơn; có thể lọc theo danh mục và trạng thái còn hàng.",
)
async def api_list_menu(
    db: Db,
    category: Annotated[str | None, Query(description="Lọc chính xác theo danh mục")] = None,
    is_available: Annotated[bool | None, Query(description="Lọc món còn hàng/hết hàng")] = None,
) -> list[MenuRead]:
    statement = select(ThucDon)
    if category is not None:
        statement = statement.where(ThucDon.phanloai == category)
    result = await db.execute(statement.order_by(ThucDon.phanloai, ThucDon.tenmon))
    items = [MenuRead.from_thucdon(mon) for mon in result.scalars().all()]
    if is_available is not None:
        items = [item for item in items if item.is_available is is_available]
    return items


@api_router.get(
    "/{item_id}", response_model=MenuRead, summary="Xem chi tiết món ăn",
    description="Tìm một món theo mã ID. Trả về 404 nếu không tìm thấy.",
)
async def api_get_menu_item(item_id: str, db: Db) -> MenuRead:
    mon = await db.get(ThucDon, item_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    return MenuRead.from_thucdon(mon)


@api_router.post(
    "", response_model=MenuRead, status_code=201, summary="Thêm món ăn",
    description="Tạo món mới sau khi kiểm tra dữ liệu bằng Pydantic.",
)
async def api_create_menu_item(body: MenuCreate, db: Db) -> MenuRead:
    mon = ThucDon(
        tenmon=body.name,
        mota=body.description,
        giaban=body.price,
        phanloai=body.category,
        anhminhhoa=body.image_url,
        trangthaiban=body.is_available,
        soluongton=body.stock,
        thanhphan=body.ingredients,
        docay=body.spicy,
        loaimon=body.diet,
        thongtindiung=body.allergens,
    )
    db.add(mon)
    await db.commit()
    await db.refresh(mon)
    return MenuRead.from_thucdon(mon)


@api_router.put(
    "/{item_id}", response_model=MenuRead, summary="Cập nhật món ăn",
    description="Cập nhật các trường được gửi lên; trường bị bỏ qua được giữ nguyên.",
)
async def api_update_menu_item(item_id: str, body: MenuUpdate, db: Db) -> MenuRead:
    mon = await db.get(ThucDon, item_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    was_out_of_stock = mon.het_hang
    field_map = {
        "name": "tenmon",
        "description": "mota",
        "price": "giaban",
        "category": "phanloai",
        "image_url": "anhminhhoa",
        "is_available": "trangthaiban",
        "stock": "soluongton",
        "ingredients": "thanhphan",
        "spicy": "docay",
        "diet": "loaimon",
        "allergens": "thongtindiung",
    }
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(mon, field_map[field], value)
    await db.commit()
    await db.refresh(mon)
    menu_item = MenuItemOut.from_thucdon(mon)
    if (menu_item.status == "out_of_stock") != was_out_of_stock:
        await broadcast_availability(db, menu_item)
    return MenuRead.from_thucdon(mon)


@api_router.patch(
    "/items/{item_id}/stock",
    response_model=MenuRead,
    summary="Cập nhật số lượng tồn",
    description="Cập nhật tồn kho; số lượng bằng 0 sẽ đánh dấu món hết hàng.",
)
async def api_update_stock(item_id: str, body: StockUpdateIn, db: Db) -> MenuRead:
    was_out_of_stock = (await kds_service.get_menu_item(db, item_id)).het_hang
    mon = await kds_service.set_menu_stock(db, item_id, body.stock)
    menu_item = MenuItemOut.from_thucdon(mon)
    if (menu_item.status == "out_of_stock") != was_out_of_stock:
        await broadcast_availability(db, menu_item)
    return MenuRead.from_thucdon(mon)


@api_router.delete(
    "/{item_id}", status_code=204, summary="Xóa món ăn",
    description="Xóa món theo ID; trả về 404 nếu món không tồn tại.",
)
async def api_delete_menu_item(item_id: str, db: Db) -> None:
    mon = await db.get(ThucDon, item_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    await db.delete(mon)
    await db.commit()


@router.get("", response_model=list[MenuItemOut])
async def list_menu_items(db: Db) -> list[MenuItemOut]:
    """US-01: khách xem E-Menu."""
    result = await db.execute(select(ThucDon).order_by(ThucDon.phanloai, ThucDon.tenmon))
    return [MenuItemOut.from_thucdon(mon) for mon in result.scalars().all()]


@router.post("/items", response_model=MenuItemOut, status_code=201)
async def create_menu_item(body: MenuItemCreateIn, db: Db) -> MenuItemOut:
    """CMS: Thêm món mới vào thực đơn."""
    mon = ThucDon(
        tenmon=body.name,
        phanloai=body.category,
        giaban=body.price,
        mota=body.description,
        anhminhhoa=body.image_url,
        soluongton=body.stock,
        trangthaiban=body.listed,
    )
    db.add(mon)
    await db.commit()
    await db.refresh(mon)
    return MenuItemOut.from_thucdon(mon)


@router.patch("/items/{item_id}", response_model=MenuItemOut)
async def update_menu_item(item_id: str, body: MenuItemUpdateIn, db: Db) -> MenuItemOut:
    """CMS: Sửa thông tin món (các trường không gửi sẽ giữ nguyên)."""
    mon = await db.get(ThucDon, item_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    if body.name is not None:
        mon.tenmon = body.name
    if body.category is not None:
        mon.phanloai = body.category
    if body.price is not None:
        mon.giaban = body.price
    if body.description is not None:
        mon.mota = body.description
    if body.image_url is not None:
        mon.anhminhhoa = body.image_url
    if body.stock is not None:
        mon.soluongton = body.stock
    if body.listed is not None:
        mon.trangthaiban = body.listed
    await db.commit()
    await db.refresh(mon)
    return MenuItemOut.from_thucdon(mon)


@router.delete("/items/{item_id}", status_code=204)
async def delete_menu_item(item_id: str, db: Db) -> None:
    """CMS: Xóa món khỏi thực đơn."""
    mon = await db.get(ThucDon, item_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    await db.delete(mon)
    await db.commit()


async def broadcast_availability(db: AsyncSession, mon: MenuItemOut) -> None:
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


async def broadcast_flipped(db: AsyncSession, dishes: list[ThucDon]) -> None:
    """Phát realtime cho các món vừa đổi còn ↔ hết do trừ/hoàn kho (story-spec-tru-kho-tu-dong)."""
    for mon in dishes:
        await broadcast_availability(db, MenuItemOut.from_thucdon(mon))


async def _set_availability(db: AsyncSession, item_id: str, available: bool) -> MenuItemOut:
    mon = MenuItemOut.from_thucdon(await kds_service.set_menu_availability(db, item_id, available))
    await broadcast_availability(db, mon)
    return mon


@router.post("/items/{item_id}/out-of-stock", response_model=MenuItemOut)
async def mark_out_of_stock(item_id: str, db: Db) -> MenuItemOut:
    """US-03 AC3: Bếp đánh dấu Hết hàng → thucdon.trangthaiban = false."""
    return await _set_availability(db, item_id, False)


@router.post("/items/{item_id}/in-stock", response_model=MenuItemOut)
async def mark_in_stock(item_id: str, db: Db) -> MenuItemOut:
    """Mở bán lại món đã báo hết."""
    return await _set_availability(db, item_id, True)


@router.patch("/items/{item_id}/stock", response_model=MenuItemOut)
async def update_stock(item_id: str, body: StockUpdateIn, db: Db) -> MenuItemOut:
    """Cập nhật số lượng tồn của món bán nguyên đơn vị."""
    truoc = (await kds_service.get_menu_item(db, item_id)).het_hang
    mon = MenuItemOut.from_thucdon(await kds_service.set_menu_stock(db, item_id, body.stock))
    if (mon.status == "out_of_stock") != truoc:
        await broadcast_availability(db, mon)
    return mon
