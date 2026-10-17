"""Router Dashboard (US-06) — Thống kê doanh thu, tỷ lệ bàn và top món bán chạy thực tế."""

import logging
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.menu import ThucDon
from app.models.order import Ban, ChiTietPhieu, HoaDon
from app.schemas.dashboard import (
    DashboardStatsOut,
    HourlyStatOut,
    OccupancyOut,
    TopDishOut,
)

log = logging.getLogger("app.dashboard")
router = APIRouter(prefix="/dashboard", tags=["dashboard"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("/stats", response_model=DashboardStatsOut)
async def get_dashboard_stats(db: Db) -> DashboardStatsOut:
    """Thống kê tổng quan dữ liệu thực tế từ DB cho màn hình Quản lý (Dashboard)."""

    # 1. Thống kê hóa đơn (chuẩn ORM tương thích mọi DB: SQLite, Postgres)
    stmt_bills = select(HoaDon.thoigianthanhtoan, HoaDon.tongtien).where(
        HoaDon.trangthai == "da_thanh_toan"
    )
    res_bills = await db.execute(stmt_bills)
    bills = res_bills.all()

    today = date.today()
    today_rev = sum(
        b.tongtien or 0
        for b in bills
        if b.thoigianthanhtoan and b.thoigianthanhtoan.date() == today
    )
    today_orders = sum(
        1 for b in bills if b.thoigianthanhtoan and b.thoigianthanhtoan.date() == today
    )
    total_rev = sum(b.tongtien or 0 for b in bills)
    total_orders = len(bills)

    # 2. Thống kê bàn & tỷ lệ lấp đầy
    res_ban = await db.execute(select(Ban.trangthai))
    ban_statuses = [r[0] for r in res_ban.all()]
    total_tables = len(ban_statuses)
    occupied = ban_statuses.count(2)  # Đang phục vụ
    ready = ban_statuses.count(1)     # Sẵn sàng
    cleaning = ban_statuses.count(3)  # Chờ dọn
    rate = round((occupied / total_tables * 100), 1) if total_tables > 0 else 0.0

    if rate >= 80:
        occ_desc = f"{occupied}/{total_tables} bàn đang dùng (Gần kín chỗ)"
    elif rate >= 40:
        occ_desc = f"{occupied}/{total_tables} bàn đang phục vụ khách"
    else:
        occ_desc = f"{occupied}/{total_tables} bàn có khách (Nhiều bàn trống)"

    occupancy = OccupancyOut(
        occupied_tables=occupied,
        ready_tables=ready,
        cleaning_tables=cleaning,
        total_tables=total_tables,
        rate=rate,
        description=occ_desc,
    )

    # 3. Top món bán chạy nhất từ chi tiết phiếu đã gọi
    stmt_top = (
        select(
            ThucDon.tenmon,
            func.coalesce(func.sum(ChiTietPhieu.soluong), 0).label("qty"),
            func.coalesce(func.sum(ChiTietPhieu.soluong * ThucDon.giaban), 0).label("rev"),
        )
        .join(ThucDon, ChiTietPhieu.mon_id == ThucDon.id)
        .where(ChiTietPhieu.trangthai != "da_huy")
        .group_by(ThucDon.id, ThucDon.tenmon)
        .order_by(func.sum(ChiTietPhieu.soluong).desc())
        .limit(5)
    )
    res_top = await db.execute(stmt_top)
    top_dishes = [
        TopDishOut(name=r.tenmon, quantity=int(r.qty), revenue=int(r.rev))
        for r in res_top.fetchall()
    ]

    # 4. Doanh thu theo khung giờ
    hourly_dict: dict[str, int] = {}
    for b in bills:
        if b.thoigianthanhtoan and b.tongtien:
            hour_str = b.thoigianthanhtoan.strftime("%H:00")
            hourly_dict[hour_str] = hourly_dict.get(hour_str, 0) + int(b.tongtien)

    if hourly_dict:
        sorted_hours = sorted(hourly_dict.keys())
        max_rev = max(hourly_dict.values()) or 1
        hourly_stats = [
            HourlyStatOut(
                hour=h,
                revenue=hourly_dict[h],
                height_percent=max(15, min(100, int(hourly_dict[h] / max_rev * 100))),
            )
            for h in sorted_hours
        ]
    else:
        default_hours = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
        hourly_stats = [HourlyStatOut(hour=h, revenue=0, height_percent=5) for h in default_hours]

    return DashboardStatsOut(
        today_revenue=today_rev,
        today_orders=today_orders,
        total_revenue=total_rev,
        total_orders=total_orders,
        occupancy=occupancy,
        top_dishes=top_dishes,
        hourly_stats=hourly_stats,
    )
