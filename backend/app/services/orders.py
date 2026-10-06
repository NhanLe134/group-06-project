"""Nghiệp vụ Gọi món (US-01), Hóa đơn tạm tính (US-09) và Thu ngân (US-05).

Quy tắc đa đợt: 1 phiên bàn có duy nhất 1 hóa đơn 'da_chot' đang mở;
gọi đợt 2+ chỉ chèn thêm chitietmon vào hóa đơn đó và tính lại tongtien.
"""

import uuid
from datetime import UTC, datetime
from urllib.parse import quote

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ApiError
from app.models import ChiTietMon, HoaDon, PhienBan, ThucDon
from app.models.menu import la_het_hang
from app.schemas.order import (
    OrderCreateIn,
    OrderCurrentOut,
    OrderItemOut,
    PayQrOut,
    TableOut,
)

DA_CHOT = "da_chot"
DA_THANH_TOAN = "da_thanh_toan"
DANG_PHUC_VU = "dang_phuc_vu"
TRONG = "trong"
DA_PHUC_VU = "da_phuc_vu"


async def get_active_session(db: AsyncSession, table_name: str) -> PhienBan | None:
    """Phiên bàn đang phục vụ (mới nhất) theo tên bàn."""
    row = await db.execute(
        select(PhienBan)
        .where(PhienBan.tenban == table_name, PhienBan.trangthai == DANG_PHUC_VU)
        .order_by(PhienBan.giobatdau.desc().nullslast(), PhienBan.id.desc())
        .limit(1)
    )
    return row.scalars().first()


async def get_open_bill(db: AsyncSession, phienban_id: uuid.UUID) -> HoaDon | None:
    """Hóa đơn 'da_chot' đang mở của phiên bàn (gọi đợt 1/2/... cùng chung 1 hóa đơn)."""
    row = await db.execute(
        select(HoaDon)
        .where(HoaDon.phienban_id == phienban_id, HoaDon.trangthai == DA_CHOT)
        .order_by(HoaDon.thoigian.desc(), HoaDon.id.desc())
        .limit(1)
    )
    return row.scalars().first()


async def _bill_items(db: AsyncSession, hoadon_id: uuid.UUID) -> list[OrderItemOut]:
    rows = await db.execute(
        select(ChiTietMon, ThucDon.tenmon, ThucDon.giaban)
        .outerjoin(ThucDon, ChiTietMon.thucdon_id == ThucDon.id)
        .where(ChiTietMon.hoadon_id == hoadon_id)
        .order_by(ChiTietMon.giogoimon, ChiTietMon.id)
    )
    out: list[OrderItemOut] = []
    for mon, tenmon, giaban in rows.all():
        so_luong = mon.soluong or 1
        gia = int(giaban or 0)
        out.append(
            OrderItemOut(
                id=mon.id,
                tenmon=tenmon,
                soluong=so_luong,
                gia=gia,
                thanhtien=gia * so_luong,
                ghichu=mon.ghichu,
                trangthai=mon.trangthai or "cho_nau",
            )
        )
    return out


async def current_order(db: AsyncSession, table_name: str) -> OrderCurrentOut:
    """US-09 — hóa đơn tạm tính của bàn: món đợt 1/2 + trạng thái bưng món."""
    phien = await get_active_session(db, table_name)
    if phien is None:
        raise ApiError(404, "TABLE_NOT_FOUND", f"Bàn '{table_name}' chưa có phiên phục vụ nào.")
    hoadon = await get_open_bill(db, phien.id)
    if hoadon is None:
        raise ApiError(404, "ORDER_NOT_FOUND", f"Bàn '{table_name}' chưa gọi món nào.")
    items = await _bill_items(db, hoadon.id)
    return OrderCurrentOut(
        phienban_id=phien.id,
        hoadon_id=hoadon.id,
        table_name=table_name,
        tongtien=int(hoadon.tongtien or 0),
        items=items,
        all_served=bool(items) and all(i.trangthai == DA_PHUC_VU for i in items),
    )


async def create_order(db: AsyncSession, data: OrderCreateIn) -> OrderCurrentOut:
    """US-01 — gửi bếp: đợt 1 tạo phiên + hóa đơn; đợt 2+ chèn thêm vào hóa đơn cũ."""
    # Kiểm tra món hợp lệ + còn bán (REQ-09/BR-03) ngay tại server, client không bypass được
    ids = [it.thucdon_id for it in data.items]
    menu_rows = (
        await db.execute(select(ThucDon).where(ThucDon.id.in_(ids)))
    ).scalars().all()
    menu_by_id = {mon.id: mon for mon in menu_rows}
    for it in data.items:
        mon = menu_by_id.get(it.thucdon_id)
        if mon is None:
            raise ApiError(404, "MENU_ITEM_NOT_FOUND", f"Không tìm thấy món {it.thucdon_id}.")
        if mon.het_hang:
            raise ApiError(409, "ITEM_OUT_OF_STOCK", f"Món '{mon.tenmon}' đã hết hàng.")

    # Phiên bàn: đợt 1 → tạo mới; đợt 2+ → dùng phiên đang phục vụ
    phien = await get_active_session(db, data.table_name)
    if phien is None:
        phien = PhienBan(tenban=data.table_name, trangthai=DANG_PHUC_VU, giobatdau=func.now())
        db.add(phien)
        await db.flush()

    # Hóa đơn: đợt 1 → tạo 'da_chot'; đợt 2+ → giữ nguyên hóa đơn cũ
    hoadon = await get_open_bill(db, phien.id)
    if hoadon is None:
        hoadon = HoaDon(phienban_id=phien.id, trangthai=DA_CHOT, thoigian=func.now())
        db.add(hoadon)
        await db.flush()

    for it in data.items:
        db.add(
            ChiTietMon(
                hoadon_id=hoadon.id,
                thucdon_id=it.thucdon_id,
                soluong=it.soluong,
                ghichu=it.ghichu,
                giogoimon=func.now(),
            )
        )
    await db.flush()

    # Tính lại tổng tiền trên TOÀN BỘ món của hóa đơn (đợt 1 + đợt 2 + ...)
    tongtien = (
        await db.execute(
            select(func.coalesce(func.sum(ThucDon.giaban * ChiTietMon.soluong), 0))
            .select_from(ChiTietMon)
            .join(ThucDon, ChiTietMon.thucdon_id == ThucDon.id)
            .where(ChiTietMon.hoadon_id == hoadon.id)
        )
    ).scalar_one()
    hoadon.tongtien = int(tongtien)
    await db.commit()
    return await current_order(db, data.table_name)


async def list_cashier_tables(db: AsyncSession) -> list[TableOut]:
    """US-05 — danh sách phiên bàn kèm hóa đơn đang mở cho màn Thu ngân."""
    phien_list = (
        await db.execute(
            select(PhienBan).order_by(PhienBan.trangthai.desc(), PhienBan.giobatdau.desc())
        )
    ).scalars().all()
    out: list[TableOut] = []
    for phien in phien_list:
        hoadon = await get_open_bill(db, phien.id)
        out.append(
            TableOut(
                id=phien.id,
                tenban=phien.tenban,
                trangthai=phien.trangthai,
                giobatdau=phien.giobatdau.isoformat() if phien.giobatdau else None,
                hoadon_id=hoadon.id if hoadon else None,
                hoadon_trangthai=hoadon.trangthai if hoadon else None,
                tongtien=int(hoadon.tongtien or 0) if hoadon else 0,
            )
        )
    return out


async def _load_bill_for_pay(db: AsyncSession, hoadon_id: uuid.UUID) -> tuple[HoaDon, PhienBan]:
    row = (
        await db.execute(
            select(HoaDon, PhienBan)
            .outerjoin(PhienBan, HoaDon.phienban_id == PhienBan.id)
            .where(HoaDon.id == hoadon_id)
        )
    ).first()
    if row is None:
        raise ApiError(404, "ORDER_NOT_FOUND", "Không tìm thấy hóa đơn.")
    hoadon, phien = row
    if hoadon.trangthai != DA_CHOT:
        raise ApiError(409, "ORDER_NOT_OPEN", "Hóa đơn không còn ở trạng thái chờ thanh toán.")
    return hoadon, phien


async def create_pay_qr(db: AsyncSession, hoadon_id: uuid.UUID) -> PayQrOut:
    """US-05 — sinh QR thanh toán cho hóa đơn (mock: qrserver.com; sau này thay
    bằng QR động MoMo/VNPAY Sandbox theo REQ-04)."""
    hoadon, phien = await _load_bill_for_pay(db, hoadon_id)
    amount = int(hoadon.tongtien or 0)
    qr_data = f"SMARTORDER|PAY|{phien.tenban}|{amount}"
    return PayQrOut(
        hoadon_id=hoadon.id,
        table_name=phien.tenban,
        amount=amount,
        qr_data=qr_data,
        qr_url=(
            "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="
            + quote(qr_data)
        ),
    )


async def close_table(db: AsyncSession, phienban_id: uuid.UUID) -> dict:
    """US-05 — Xác nhận đã nhận tiền & Đóng bàn: chốt hóa đơn, trả bàn về 'trong'."""
    phien = (
        await db.execute(select(PhienBan).where(PhienBan.id == phienban_id))
    ).scalars().first()
    if phien is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy phiên bàn.")
    if phien.trangthai != DANG_PHUC_VU:
        raise ApiError(409, "TABLE_NOT_ACTIVE", f"Bàn '{phien.tenban}' không đang phục vụ.")
    hoadon = await get_open_bill(db, phien.id)
    if hoadon is None:
        raise ApiError(409, "NO_OPEN_BILL", f"Bàn '{phien.tenban}' chưa có hóa đơn để thanh toán.")

    hoadon.trangthai = DA_THANH_TOAN
    hoadon.thoigian_thanhtoan = func.now()
    phien.trangthai = TRONG
    phien.gioketthuc = func.now()
    await db.commit()
    return {
        "phienban_id": str(phien.id),
        "table_name": phien.tenban,
        "hoadon_id": str(hoadon.id),
        "tongtien": int(hoadon.tongtien or 0),
        "message": f"Đã thanh toán {phien.tenban} và đóng bàn.",
        "closed_at": datetime.now(UTC).isoformat(),
    }
