"""US-08 — Đối soát tồn kho & đóng ca. Spec: vault/06-Engineering/story-spec-us08-inventory.md."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.menu import broadcast_availability
from app.schemas.inventory import (
    ShiftCloseIn,
    ShiftDetailOut,
    ShiftLinesIn,
    ShiftSummaryOut,
)
from app.schemas.menu import MenuItemOut
from app.services import inventory as service

router = APIRouter(prefix="/inventory/shifts", tags=["inventory"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ShiftSummaryOut])
async def list_shifts(db: Db) -> list[ShiftSummaryOut]:
    """Danh sách phiếu kiểm kê, mới nhất trước."""
    return await service.list_shifts(db)


@router.post("", response_model=ShiftDetailOut, status_code=201)
async def create_shift(db: Db) -> ShiftDetailOut:
    """Tạo phiếu nháp cho ca hiện tại — chụp tồn đầu ca các món đếm số lượng."""
    return await service.create_shift(db)


@router.get("/{shift_id}", response_model=ShiftDetailOut)
async def get_shift(shift_id: str, db: Db) -> ShiftDetailOut:
    """AC1 — bảng đối soát: tồn đầu ca (A), đã bán (B), tồn lý thuyết (C = A - B)."""
    return await service.get_shift(db, shift_id)


@router.put("/{shift_id}/lines", response_model=ShiftDetailOut)
async def save_lines(shift_id: str, body: ShiftLinesIn, db: Db) -> ShiftDetailOut:
    """Lưu nháp tồn thực tế + lý do (AC2)."""
    return await service.save_lines(db, shift_id, body.lines)


@router.post("/{shift_id}/close", response_model=ShiftDetailOut)
async def close_shift(shift_id: str, body: ShiftCloseIn, db: Db) -> ShiftDetailOut:
    """AC3–AC5 — chốt ca: kiểm tra lý do hao hụt + PIN Quản lý, khóa phiếu, cập nhật tồn."""
    detail, flipped = await service.close_shift(db, shift_id, body.lines, body.manager_pin)
    for mon in flipped:  # món về 0 / có hàng lại sau kiểm kê → đồng bộ E-Menu, KDS
        await broadcast_availability(db, MenuItemOut.from_thucdon(mon))
    return detail


@router.delete("/{shift_id}", status_code=204)
async def delete_shift(shift_id: str, db: Db) -> Response:
    """Xóa phiếu nháp. Phiếu đã chốt không xóa được (BR-07)."""
    await service.delete_shift(db, shift_id)
    return Response(status_code=204)
