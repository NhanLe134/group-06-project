from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.waiter import ManagerAuthIn, WaiterTableOut
from app.services import waiter as service

router = APIRouter(prefix="/waiter", tags=["waiter"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("/tables", response_model=list[WaiterTableOut])
async def get_tables(db: Db):
    """Lấy danh sách sơ đồ bàn và các món ăn hiện tại (cho Table Map và Batching)"""
    return await service.get_all_tables(db)


@router.patch("/items/{item_id}/serve")
async def mark_item_served(item_id: str, db: Db):
    """Xác nhận đã mang món ra cho khách"""
    await service.mark_item_served(db, item_id)
    return {"message": "Đã phục vụ thành công"}


@router.patch("/tables/{ban_id}/clean")
async def clean_table(ban_id: str, db: Db):
    """Xác nhận đã dọn dẹp bàn xong, sẵn sàng đón khách mới"""
    await service.clean_table(db, ban_id)
    return {"message": "Đã dọn dẹp bàn thành công"}


@router.post("/items/{item_id}/void")
async def void_item(item_id: str, body: ManagerAuthIn, db: Db):
    """Điều chỉnh số lượng hoặc Hủy món ăn"""
    await service.void_item(db, item_id, body.new_quantity)
    return {"message": "Đã điều chỉnh/hủy món thành công"}
