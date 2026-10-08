"""Nghiệp vụ KDS (US-03) — mọi quy tắc nằm ở server, client không bypass được.

Story Spec: vault/06-Engineering/story-spec-us03-kds.md
"""

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ApiError
from app.models import Ban, ChiTietPhieu, LogHuyMon, PhieuBan, ThucDon
from app.schemas.kds import KdsItemOut
from app.services import stock

CHO_NAU, DANG_NAU, DA_XONG, DA_HUY = "cho_nau", "dang_nau", "da_xong", "da_huy"
KDS_STATUSES = (CHO_NAU, DANG_NAU, DA_XONG)

# Chuyển trạng thái hợp lệ trên KDS (AC2): tiến tới, hoặc lùi 1 bước để sửa thao tác nhầm
TRANSITIONS: dict[str, set[str]] = {
    CHO_NAU: {DANG_NAU, DA_XONG},
    DANG_NAU: {CHO_NAU, DA_XONG},
    DA_XONG: {DANG_NAU},
}

LY_DO_HET_HANG = "Hết nguyên liệu — bếp xóa khỏi hàng đợi (US-03)"


def _bep_bao_het(trangthaiban: bool | None) -> bool:
    """Chặn nấu chỉ khi bếp/quản lý BÁO HẾT bằng tay. Món đã gửi bếp đã được giữ nguyên liệu
    (trừ kho lúc gửi — story-spec-tru-kho-tu-dong.md Mục 3), nên số phần còn = 0 không chặn."""
    return trangthaiban is False


def _item_query() -> Select:
    return (
        select(
            ChiTietPhieu,
            ThucDon.tenmon,
            ThucDon.trangthaiban,
            Ban.tenban,
            PhieuBan.giogoimon,
        )
        .outerjoin(ThucDon, ChiTietPhieu.mon_id == ThucDon.id)
        .outerjoin(PhieuBan, ChiTietPhieu.phieuban_id == PhieuBan.phieuban_id)
        .outerjoin(Ban, PhieuBan.ban_id == Ban.ban_id)
    )


def _to_out(row) -> KdsItemOut:
    item, tenmon, trangthaiban, tenban, giogoimon = row
    return KdsItemOut(
        id=item.chitietphieu_id,
        phieuban_id=item.phieuban_id,
        ban=tenban,
        mon_id=item.mon_id,
        tenmon=tenmon,
        soluong=item.soluong or 1,
        ghichu=item.ghichu,
        trangthai=item.trangthai or CHO_NAU,
        giogoimon=giogoimon,
        het_hang=_bep_bao_het(trangthaiban),
    )


async def list_items(db: AsyncSession) -> list[KdsItemOut]:
    """Món đang ở 3 cột KDS, cũ nhất trước (FIFO)."""
    rows = await db.execute(
        _item_query()
        .where(ChiTietPhieu.trangthai.in_(KDS_STATUSES))
        .order_by(PhieuBan.giogoimon, ChiTietPhieu.chitietphieu_id)
    )
    return [_to_out(r) for r in rows.all()]


async def get_item(db: AsyncSession, item_id: str) -> KdsItemOut:
    row = (await db.execute(_item_query().where(ChiTietPhieu.chitietphieu_id == item_id))).first()
    if row is None:
        raise ApiError(404, "ORDER_ITEM_NOT_FOUND", "Không tìm thấy món này.")
    return _to_out(row)


async def _load_for_update(db: AsyncSession, item_id: str) -> tuple[ChiTietPhieu, bool]:
    row = (
        await db.execute(
            select(ChiTietPhieu, ThucDon.trangthaiban)
            .outerjoin(ThucDon, ChiTietPhieu.mon_id == ThucDon.id)
            .where(ChiTietPhieu.chitietphieu_id == item_id)
            .with_for_update(of=ChiTietPhieu)
        )
    ).first()
    if row is None:
        raise ApiError(404, "ORDER_ITEM_NOT_FOUND", "Không tìm thấy món này.")
    item, trangthaiban = row
    return item, _bep_bao_het(trangthaiban)


def _check_transition(item: ChiTietPhieu, het_hang: bool, target: str) -> None:
    current = item.trangthai or CHO_NAU
    if target not in TRANSITIONS.get(current, set()):
        raise ApiError(
            409,
            "INVALID_STATUS_TRANSITION",
            f"Không thể chuyển món từ '{current}' sang '{target}'.",
        )
    # BR-03: món hết nguyên liệu khi chưa nấu thì không được nấu tiếp, chỉ được xóa khỏi hàng đợi
    if current == CHO_NAU and het_hang:
        raise ApiError(409, "ITEM_OUT_OF_STOCK", "Món đã hết hàng — chỉ có thể xóa khỏi hàng đợi.")


async def update_status(db: AsyncSession, item_id: str, target: str) -> KdsItemOut:
    item, het_hang = await _load_for_update(db, item_id)
    _check_transition(item, het_hang, target)
    item.trangthai = target
    await db.commit()
    return await get_item(db, item_id)


async def split_item(
    db: AsyncSession, item_id: str, soluong: int, target: str
) -> tuple[KdsItemOut, KdsItemOut]:
    """Nấu/Xong từng phần: tách `soluong` suất sang dòng mới với trạng thái `target`."""
    item, het_hang = await _load_for_update(db, item_id)
    current_qty = item.soluong or 1
    if soluong >= current_qty:
        raise ApiError(
            422,
            "INVALID_SPLIT_QUANTITY",
            f"Số suất tách phải nhỏ hơn {current_qty}; muốn chuyển cả món thì đổi trạng thái.",
        )
    _check_transition(item, het_hang, target)
    part = ChiTietPhieu(
        phieuban_id=item.phieuban_id,
        mon_id=item.mon_id,
        soluong=soluong,
        trangthai=target,
        ghichu=item.ghichu,  # cùng phiếu → cùng giờ gọi, FIFO giữ nguyên
    )
    item.soluong = current_qty - soluong
    db.add(part)
    await db.commit()
    return await get_item(db, item.chitietphieu_id), await get_item(db, part.chitietphieu_id)


async def cancel_out_of_stock(
    db: AsyncSession, item_id: str
) -> tuple[KdsItemOut, list[ThucDon]]:
    """Xóa khỏi hàng đợi món CHỜ NẤU mà nguyên liệu đã hết (A-26) — ghi loghuymon.

    Món chưa nấu nên cộng trả kho (story-spec-tru-kho-tu-dong.md Q2); trả thêm các món
    đổi còn/hết hàng để router phát realtime.
    """
    item, het_hang = await _load_for_update(db, item_id)
    if (item.trangthai or CHO_NAU) != CHO_NAU or not het_hang:
        raise ApiError(
            409,
            "ITEM_NOT_CANCELLABLE",
            "Chỉ xóa được món đang chờ nấu và đã bị đánh dấu hết hàng.",
        )
    item.trangthai = DA_HUY
    db.add(LogHuyMon(chitietphieu_id=item.chitietphieu_id, lydohuy=LY_DO_HET_HANG))
    watch = await stock.release(db, [(item.mon_id, item.soluong or 1)])
    await db.commit()
    return await get_item(db, item_id), stock.flipped(watch)


async def _get_menu_item(db: AsyncSession, mon_id: str) -> ThucDon:
    mon = await db.get(ThucDon, mon_id, with_for_update=True)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    return mon


async def get_menu_item(db: AsyncSession, mon_id: str) -> ThucDon:
    mon = await db.get(ThucDon, mon_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    return mon


async def set_menu_availability(db: AsyncSession, mon_id: str, available: bool) -> ThucDon:
    mon = await _get_menu_item(db, mon_id)
    if available and mon.so_phan_con == 0:
        # Hết số lượng tồn / nguyên liệu: mở bán lại mà không nhập thêm thì E-Menu vẫn báo hết
        raise ApiError(
            409,
            "STOCK_EMPTY",
            "Món đã hết số lượng tồn hoặc nguyên liệu — hãy nhập thêm hàng trước.",
        )
    mon.trangthaiban = available
    await db.commit()
    await db.refresh(mon)
    return mon


async def set_menu_stock(db: AsyncSession, mon_id: str, stock: int | None) -> ThucDon:
    """Đặt số lượng tồn (đồ uống chai/lon...). NULL = món không đếm số lượng."""
    mon = await _get_menu_item(db, mon_id)
    mon.soluongton = stock
    await db.commit()
    await db.refresh(mon)
    return mon


async def draft_sessions_with_item(db: AsyncSession, mon_id: str) -> list[str]:
    """Phiên bàn đang có món này trong hóa đơn nháp (để client làm mờ — ADR-001)."""
    rows = await db.execute(
        select(PhieuBan.phieuban_id)
        .join(ChiTietPhieu, ChiTietPhieu.phieuban_id == PhieuBan.phieuban_id)
        .where(ChiTietPhieu.mon_id == mon_id, PhieuBan.hoadon_id.is_(None))
        .distinct()
    )
    return [str(pid) for pid in rows.scalars().all() if pid is not None]
