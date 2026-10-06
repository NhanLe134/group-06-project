"""Dữ liệu demo cho KDS (US-03) trên DATABASE_URL.

- Thực đơn: chỉ thêm khi bảng `thucdon` đang TRỐNG — 6 món catalog chuẩn của prototype
  (docs/05-Design/prototype-brief.md §4, frontend/fe_ofc/assets/js/mock-data.js).
- Đơn demo: các bàn có hậu tố "(demo)" để dễ nhận biết và xóa, không đụng dữ liệu thật.
  Chạy lại không tạo trùng: đã có bàn "(demo)" thì bỏ qua phần đơn.
- Tài khoản "Quản lý Demo (demo)" vai trò QUAN_LY, PIN 1234 — để thử chốt ca US-08 (AC5).

Chạy trong thư mục backend:
    uv run python -m scripts.seed_demo            # thêm dữ liệu demo
    uv run python -m scripts.seed_demo --xoa-demo  # xóa toàn bộ bàn "(demo)" (kèm hóa đơn, món)
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select

from app.db import async_session_factory, engine
from app.models import ChiTietMon, HoaDon, NguoiDung, PhienBan, ThucDon

# (tên, phân loại, giá, đang bán, số lượng tồn — None = món nấu, không đếm số lượng)
CATALOG = [
    ("Phở bò tái lăn", "Món chính", 65000, True, None),
    ("Bún chả Hà Nội", "Món chính", 55000, True, None),
    ("Bò xào cần", "Món chính", 85000, True, None),
    ("Bò sốt tiêu đen", "Món chính", 120000, False, None),  # hết hàng sẵn — FLOW C / ADR-001
    ("Trà đá", "Đồ uống", 5000, True, 50),
    ("Set lẩu 4 người", "Món chính", 350000, True, None),
]

# (bàn, món, số suất, ghi chú, trạng thái, gọi cách đây bao nhiêu phút)
DEMO_ORDERS = [
    ("Bàn 04 (demo)", "Bún chả Hà Nội", 1, None, "cho_nau", 6),
    ("Bàn 05 (demo)", "Set lẩu 4 người", 1, "Ít cay", "dang_nau", 12),
    ("Bàn 06 (demo)", "Trà đá", 2, None, "da_xong", 15),
    ("Bàn 07 (demo)", "Bò xào cần", 10, None, "cho_nau", 4),
]
DEMO_SUFFIX = "(demo)"
DEMO_MANAGER = ("Quản lý Demo (demo)", "QUAN_LY", "1234")


async def seed() -> None:
    async with async_session_factory() as db:
        if (await db.scalar(select(func.count()).select_from(ThucDon))) == 0:
            for ten, loai, gia, dangban, ton in CATALOG:
                db.add(
                    ThucDon(
                        tenmon=ten, phanloai=loai, giaban=gia, trangthaiban=dangban, soluongton=ton
                    )
                )
            await db.flush()
            print(f"Đã thêm {len(CATALOG)} món vào thucdon.")
        else:
            print("thucdon đã có dữ liệu — giữ nguyên, không thêm món.")

        hoten, vaitro, pin = DEMO_MANAGER
        if await db.scalar(select(NguoiDung.id).where(NguoiDung.hoten == hoten)) is None:
            db.add(NguoiDung(hoten=hoten, vaitro=vaitro, mapin=pin))
            print(f"Đã thêm tài khoản {hoten} (PIN {pin}).")

        if await db.scalar(select(PhienBan.id).where(PhienBan.tenban.like(f"%{DEMO_SUFFIX}"))):
            await db.commit()
            print("Đã có đơn demo — bỏ qua (chạy --xoa-demo trước nếu muốn tạo lại).")
            return

        mon_theo_ten = {m.tenmon: m for m in (await db.execute(select(ThucDon))).scalars()}
        now = datetime.now(UTC).replace(tzinfo=None)  # cột TIMESTAMP lưu giờ UTC
        for tenban, tenmon, soluong, ghichu, trangthai, phut in DEMO_ORDERS:
            mon = mon_theo_ten.get(tenmon)
            if mon is None:
                print(f"Bỏ qua {tenban}: thực đơn không có món '{tenmon}'.")
                continue
            phien = PhienBan(tenban=tenban, trangthai="dang_phuc_vu", giobatdau=now)
            db.add(phien)
            await db.flush()
            hoadon = HoaDon(phienban_id=phien.id, trangthai="da_chot")
            db.add(hoadon)
            await db.flush()
            db.add(
                ChiTietMon(
                    hoadon_id=hoadon.id,
                    thucdon_id=mon.id,
                    soluong=soluong,
                    ghichu=ghichu,
                    trangthai=trangthai,
                    giogoimon=now - timedelta(minutes=phut),
                )
            )
        await db.commit()
        print(f"Đã thêm {len(DEMO_ORDERS)} đơn demo.")


async def clear_demo() -> None:
    async with async_session_factory() as db:
        # ON DELETE CASCADE: phienban → hoadon → chitietmon → loghuymon
        result = await db.execute(delete(PhienBan).where(PhienBan.tenban.like(f"%{DEMO_SUFFIX}")))
        # phieukiemke.nguoichot_id là ON DELETE SET NULL nên xóa tài khoản demo không mất phiếu
        users = await db.execute(delete(NguoiDung).where(NguoiDung.hoten.like(f"%{DEMO_SUFFIX}")))
        await db.commit()
        print(f"Đã xóa {result.rowcount} bàn demo, {users.rowcount} tài khoản demo.")


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # terminal Windows mặc định cp1252
    await (clear_demo() if "--xoa-demo" in sys.argv else seed())
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
