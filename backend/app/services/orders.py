"""Nghiệp vụ Gọi món (US-01), Hóa đơn tạm tính (US-09) và Thu ngân (US-05).

Thiết kế ADR-N14:
- `ban` = master 6 bàn vật lý (trangthai 1/2/3)
- Mỗi lần khách gửi bếp = 1 `phieuban` mới (hoadon_id NULL = của khách đang dùng)
- `hoadon` chỉ tạo khi THANH TOÁN — gắn hoadon_id vào các phiếu, bàn về chờ dọn
- Hóa đơn tạm tính (US-09) = SELECT tổng hợp các phiếu có hoadon_id NULL
"""

import re
from urllib.parse import quote

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.errors import ApiError
from app.models import Ban, ChiTietPhieu, HoaDon, PhieuBan, ThucDon
from app.schemas.order import (
    OrderCreateIn,
    OrderCurrentOut,
    OrderItemOut,
    PayQrOut,
)
from app.services import stock

DA_PHUC_VU = "da_phuc_vu"
DA_XONG = "da_xong"
BAN_SAN_SANG, BAN_DANG_PHUC_VU, BAN_CHO_DON = 1, 2, 3
# Hóa đơn nháp sinh lúc TẠO QR (ADR-N16); chỉ chốt 'da_thanh_toan' khi thu tiền
HOADON_CHUA_TT = "chua_thanh_toan"


async def get_ban(db: AsyncSession, tenban: str) -> Ban:
    """MASTER data — bàn phải được seed sẵn trong bảng `ban`."""
    row = await db.execute(select(Ban).where(Ban.tenban == tenban))
    ban = row.scalars().first()
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", f"Không tồn tại bàn '{tenban}'.")
    return ban


async def get_open_phieuban_list(db: AsyncSession, ban_id: str) -> list[PhieuBan]:
    """Các phiếu bàn CHƯA tính tiền (hoadon_id NULL) của 1 bàn — cũ nhất trước."""
    rows = await db.execute(
        select(PhieuBan)
        .where(PhieuBan.ban_id == ban_id, PhieuBan.hoadon_id.is_(None))
        .order_by(PhieuBan.giogoimon, PhieuBan.phieuban_id)
    )
    return list(rows.scalars().all())


async def _bill_items(db: AsyncSession, phieu_list: list[PhieuBan]) -> list[OrderItemOut]:
    """Món của các phiếu, gán `dot` theo thứ tự phiếu (phiếu cũ = đợt trước)."""
    phieu_ids = [p.phieuban_id for p in phieu_list]
    rows = await db.execute(
        select(ChiTietPhieu, ThucDon.tenmon, ThucDon.giaban, PhieuBan.giogoimon)
        .outerjoin(ThucDon, ChiTietPhieu.mon_id == ThucDon.id)
        .outerjoin(PhieuBan, ChiTietPhieu.phieuban_id == PhieuBan.phieuban_id)
        .where(ChiTietPhieu.phieuban_id.in_(phieu_ids))
        .order_by(PhieuBan.giogoimon, ChiTietPhieu.phieuban_id, ChiTietPhieu.chitietphieu_id)
    )
    phieu_index = {p.phieuban_id: i + 1 for i, p in enumerate(phieu_list)}  # đợt theo phiếu
    out: list[OrderItemOut] = []
    for mon, tenmon, giaban, gio in rows.all():
        if mon.trangthai == "da_huy":
            continue
        so_luong = mon.soluong or 1
        gia = int(giaban or 0)
        out.append(
            OrderItemOut(
                id=mon.chitietphieu_id,
                tenmon=tenmon,
                soluong=so_luong,
                gia=gia,
                thanhtien=gia * so_luong,
                ghichu=mon.ghichu,
                trangthai=mon.trangthai or "cho_nau",
                dot=phieu_index.get(mon.phieuban_id),
                giogoimon=gio,
            )
        )
    return out


async def current_order(db: AsyncSession, table_name: str) -> OrderCurrentOut:
    """US-09 — hóa đơn tạm tính = tổng các phiếu CHƯA tính tiền của bàn."""
    ban = await get_ban(db, table_name)
    phieu_list = await get_open_phieuban_list(db, ban.ban_id)
    if not phieu_list:
        raise ApiError(404, "ORDER_NOT_FOUND", f"Bàn '{table_name}' chưa gọi món nào.")
    items = await _bill_items(db, phieu_list)
    tongtien = sum(i.thanhtien for i in items)
    return OrderCurrentOut(
        phieuban_id=phieu_list[0].phieuban_id if phieu_list else "",
        hoadon_id="",  # hóa đơn chỉ sinh khi thanh toán (ADR-N14)
        table_name=table_name,
        tongtien=tongtien,
        items=items,
        all_served=bool(items) and all(i.trangthai == DA_PHUC_VU for i in items),
    )


async def create_order(
    db: AsyncSession, data: OrderCreateIn
) -> tuple[OrderCurrentOut, list[ThucDon]]:
    """US-01 — gửi bếp: mỗi lần gọi = 1 phiếu bàn mới + các dòng chi tiết phiếu.

    Trả thêm các món vừa đổi còn/hết hàng do trừ kho để router phát realtime.
    """
    ban = await get_ban(db, data.table_name)

    # Kiểm tra món hợp lệ + còn bán (REQ-09/BR-03) ngay tại server
    ids = [it.thucdon_id for it in data.items]
    menu_by_id = {
        mon.id: mon
        for mon in (await db.execute(select(ThucDon).where(ThucDon.id.in_(ids)))).scalars().all()
    }
    for it in data.items:
        mon = menu_by_id.get(it.thucdon_id)
        if mon is None:
            raise ApiError(404, "MENU_ITEM_NOT_FOUND", f"Không tìm thấy món {it.thucdon_id}.")
        if mon.het_hang:
            raise ApiError(409, "ITEM_OUT_OF_STOCK", f"Món '{mon.tenmon}' đã hết hàng.")

    # Trừ kho ngay khi gửi bếp (story-spec-tru-kho-tu-dong.md); thiếu hàng → 409
    watch = await stock.reserve(db, [(it.thucdon_id, it.soluong) for it in data.items])

    # Mỗi lần gửi bếp = 1 phiếu bàn mới, hoadon_id NULL (chưa tính tiền)
    phieu = PhieuBan(ban_id=ban.ban_id, giogoimon=func.now(), hoadon_id=None)
    db.add(phieu)
    await db.flush()

    for it in data.items:
        mon = menu_by_id.get(it.thucdon_id)
        is_drink = bool(mon and mon.phanloai and "uống" in mon.phanloai.lower())
        # Đồ uống không qua hàng đợi KDS (PR #9 — bug-wt-002): đã xong sẵn, chỉ chờ phục vụ
        db.add(
            ChiTietPhieu(
                phieuban_id=phieu.phieuban_id,
                mon_id=it.thucdon_id,
                soluong=it.soluong,
                ghichu=it.ghichu,
                trangthai="da_xong" if is_drink else "cho_nau",
            )
        )

    # Bàn chuyển sang đang phục vụ (từ sẵn sàng hoặc chờ dọn)
    if ban.trangthai != BAN_DANG_PHUC_VU:
        ban.trangthai = BAN_DANG_PHUC_VU
    await db.commit()
    return await current_order(db, data.table_name), stock.flipped(watch)


async def list_cashier_tables(db: AsyncSession) -> list[dict]:
    """US-05 — 6 bàn master + tiến độ món + tổng tiền các phiếu chưa tính tiền."""
    bans = (await db.execute(select(Ban).order_by(Ban.ban_id))).scalars().all()
    out: list[dict] = []
    for ban in bans:
        phieu_list = await get_open_phieuban_list(db, ban.ban_id)
        items = await _bill_items(db, phieu_list) if phieu_list else []
        out.append(
            {
                "id": ban.ban_id,
                "tenban": ban.tenban,
                "trangthai": str(ban.trangthai or BAN_SAN_SANG),
                "gio_vao": (
                    phieu_list[0].giogoimon.isoformat() if phieu_list else None
                ),
                "tongtien": sum(i.thanhtien for i in items),
                "so_phieuban": len(phieu_list),
                "tong_mon": len(items),
                "mon_phuc_vu": sum(1 for i in items if i.trangthai == DA_PHUC_VU),
                "mon_da_xong": sum(1 for i in items if i.trangthai == DA_XONG),
            }
        )
    return out


def build_transfer_content(tenban: str, hoadon_id: str | None = None) -> str:
    """Nội dung chuyển khoản SePay: 'Ban 06 - HD-20261009-0001'.

    Số bàn giúp khách/quầy nhận ra bill; hoadon_id (hóa đơn nháp sinh lúc
    tạo QR — ADR-N16) giúp webhook khớp CHÍNH XÁC từng hóa đơn, không nhầm
    khi 2 bàn trùng tổng tiền. So khớp không phân biệt dấu — xem
    sepay._find_table_by_sepay_content.
    """
    m = re.search(r"\d+", tenban)
    so_ban = m.group() if m else tenban.replace(" ", "")
    return f"Ban {so_ban} - {hoadon_id}" if hoadon_id else f"Ban {so_ban}"


async def get_draft_hoadon(db: AsyncSession, ban_id: str) -> HoaDon | None:
    """Hóa đơn nháp 'chua_thanh_toan' mới nhất của bàn (sinh lúc tạo QR — ADR-N16)."""
    rows = await db.execute(
        select(HoaDon)
        .where(HoaDon.ban_id == ban_id, HoaDon.trangthai == HOADON_CHUA_TT)
        .order_by(HoaDon.hoadon_id.desc())  # id theo sequence tăng dần → mới nhất trước
    )
    return rows.scalars().first()


async def get_or_create_draft_hoadon(
    db: AsyncSession, ban: Ban, so_phieuban: int, tongtien: int
) -> HoaDon:
    """Lấy hóa đơn nháp của bàn, chưa có thì tạo (QR tạo lại không sinh hóa đơn trùng)."""
    hoadon = await get_draft_hoadon(db, ban.ban_id)
    if hoadon is not None:
        # Cập nhật số tiền/phiếu mới nhất để khớp nếu khách gọi thêm món sau khi tạo QR
        hoadon.so_phieuban = so_phieuban
        hoadon.tongtien = tongtien
        db.add(hoadon)
        return hoadon
    hoadon = HoaDon(
        ban_id=ban.ban_id,
        so_phieuban=so_phieuban,
        tongtien=tongtien,
        trangthai=HOADON_CHUA_TT,
        thoigianthanhtoan=None,
    )
    db.add(hoadon)
    await db.flush()
    return hoadon


async def build_pay_qr(db: AsyncSession, ban_id: str) -> PayQrOut:
    """US-05 — QR thanh toán tính từ các phiếu CHƯA tính tiền (SePay VietQR, ADR-N15)."""
    ban = await db.get(Ban, ban_id)
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy bàn.")
    phieu_list = await get_open_phieuban_list(db, ban.ban_id)
    if not phieu_list:
        raise ApiError(409, "NO_OPEN_BILL", f"Bàn '{ban.tenban}' chưa có phiếu nào để thanh toán.")
    items = await _bill_items(db, phieu_list)
    amount = sum(i.thanhtien for i in items)

    # US-05 AC5: chỉ tạo QR khi mọi món đã hoàn thành (Đã phục vụ / Đã hủy) —
    # đồng bộ ràng buộc phía khách (US-09 AC2); trả 409 để FE toast đúng spec
    unfinished = [i for i in items if i.trangthai not in (DA_PHUC_VU, "da_huy")]
    if unfinished:
        raise ApiError(
            409,
            "ORDER_NOT_READY",
            f"Bàn '{ban.tenban}' còn {len(unfinished)} món chưa hoàn thành, không thể tạo QR.",
        )

    # Hóa đơn nháp 'chua_thanh_toan' — khách/quầy nhận diện bill qua hoadon_id trong nội dung CK
    hoadon = await get_or_create_draft_hoadon(db, ban, len(phieu_list), amount)
    await db.commit()

    # Nội dung chuyển khoản SePay: Ban 06 - HD-20261009-0001 (khớp chính xác từng bill)
    des = build_transfer_content(ban.tenban, hoadon.hoadon_id)
    bank = settings.sepay_bank_code or "MBBank"
    acc = settings.sepay_account_no or "0123456789"

    sepay_qr_url = (
        f"https://qr.sepay.vn/img?bank={bank}&acc={acc}&amount={amount}&des={quote(des)}"
    )

    return PayQrOut(
        ban_id=ban.ban_id,
        table_name=ban.tenban,
        amount=amount,
        so_phieuban=len(phieu_list),
        hoadon_id=hoadon.hoadon_id,
        qr_data=des,
        qr_url=sepay_qr_url,
    )


async def close_table(db: AsyncSession, ban_id: str, nhanvien_id: str | None = None) -> dict:
    """US-05 — Thanh toán & đóng bàn:
    INSERT hoadon (tổng các phiếu chưa tính) → gắn hoadon_id vào phiếu → bàn về chờ dọn (3)."""
    ban = await db.get(Ban, ban_id)
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy bàn.")
    phieu_list = await get_open_phieuban_list(db, ban.ban_id)
    if not phieu_list:
        raise ApiError(409, "NO_OPEN_BILL", f"Bàn '{ban.tenban}' chưa có phiếu nào để thanh toán.")

    items = await _bill_items(db, phieu_list)
    tongtien = sum(i.thanhtien for i in items)

    # Chốt hóa đơn nháp sinh lúc tạo QR (ADR-N16); chưa có (thanh toán tiền mặt) thì tạo mới
    hoadon = await get_draft_hoadon(db, ban.ban_id)
    if hoadon is None:
        hoadon = HoaDon(ban_id=ban.ban_id)
        db.add(hoadon)
        await db.flush()
    hoadon.nhanvien_id = nhanvien_id
    hoadon.so_phieuban = len(phieu_list)
    hoadon.tongtien = tongtien
    hoadon.trangthai = "da_thanh_toan"
    hoadon.thoigianthanhtoan = func.now()
    for phieu in phieu_list:
        phieu.hoadon_id = hoadon.hoadon_id

    ban.trangthai = BAN_CHO_DON
    await db.commit()
    return {
        "ban_id": ban.ban_id,
        "table_name": ban.tenban,
        "hoadon_id": hoadon.hoadon_id,
        "tongtien": tongtien,
        "so_phieuban": len(phieu_list),
        "message": (
            f"Đã thanh toán {ban.tenban}: {len(phieu_list)} phiếu, {tongtien}₫. Bàn chờ dọn."
        ),
    }


async def mark_cleaned(db: AsyncSession, ban_id: str) -> dict:
    """Waiter xác nhận đã dọn xong: bàn chờ dọn (3) → sẵn sàng (1)."""
    ban = await db.get(Ban, ban_id)
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy bàn.")
    if ban.trangthai != BAN_CHO_DON:
        raise ApiError(409, "TABLE_NOT_WAITING_CLEAN", "Bàn không ở trạng thái chờ dọn.")
    ban.trangthai = BAN_SAN_SANG
    await db.commit()
    return {"ban_id": ban.ban_id, "table_name": ban.tenban, "trangthai": 1}
