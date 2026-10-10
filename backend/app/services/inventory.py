"""Nghiệp vụ US-08 — đối soát tồn kho & đóng ca. Spec: story-spec-us08-inventory.md.

A = tồn đầu ca, B = đã bán trong kỳ (từ `chitietphieu`),
C = A - B (tồn lý thuyết), chênh lệch = tồn thực tế - C (âm = hao hụt).
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ApiError
from app.models import ChiTietPhieu, NguoiDung, PhieuBan, ThucDon
from app.models.inventory import DA_CHOT, NHAP, ChiTietKiemKe, PhieuKiemKe
from app.schemas.inventory import ShiftDetailOut, ShiftLineIn, ShiftLineOut, ShiftSummaryOut

VN_OFFSET = timedelta(hours=7)
QUAN_LY = "QUAN_LY"


def _now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)  # cột TIMESTAMP lưu giờ UTC


def _start_of_today_vn(now: datetime) -> datetime:
    """00:00 hôm nay theo giờ Việt Nam, đổi về UTC (kỳ của phiếu đầu tiên)."""
    vn = now + VN_OFFSET
    return vn.replace(hour=0, minute=0, second=0, microsecond=0) - VN_OFFSET


async def _period_start(db: AsyncSession, now: datetime) -> datetime:
    last_close = await db.scalar(select(func.max(PhieuKiemKe.giochot)).where(PhieuKiemKe.trangthai == DA_CHOT))
    return last_close or _start_of_today_vn(now)


async def _sold(db: AsyncSession, start: datetime, end: datetime | None, dish_ids: list[str]) -> dict[str, int]:
    """B — số đã bán trong kỳ: bỏ món đã hủy và hóa đơn đã hủy."""
    if not dish_ids:
        return {}
    query = (
        select(ChiTietPhieu.mon_id, func.sum(func.coalesce(ChiTietPhieu.soluong, 1)))
        .outerjoin(PhieuBan, ChiTietPhieu.phieuban_id == PhieuBan.phieuban_id)
        .where(
            ChiTietPhieu.mon_id.in_(dish_ids),
            PhieuBan.giogoimon >= start,
            or_(ChiTietPhieu.trangthai.is_(None), ChiTietPhieu.trangthai != "da_huy"),
        )
        .group_by(ChiTietPhieu.mon_id)
    )
    if end is not None:
        query = query.where(PhieuBan.giogoimon < end)
    return {dish: int(total) for dish, total in (await db.execute(query)).all()}


async def _get_phieu(db: AsyncSession, shift_id: str, lock: bool = False) -> PhieuKiemKe:
    phieu = await db.get(PhieuKiemKe, shift_id, with_for_update=lock)
    if phieu is None:
        raise ApiError(404, "SHIFT_NOT_FOUND", "Không tìm thấy phiếu kiểm kê.")
    return phieu


def _ensure_draft(phieu: PhieuKiemKe) -> None:
    if phieu.trangthai == DA_CHOT:
        raise ApiError(409, "SHIFT_CLOSED", "Phiếu đã chốt ca — dữ liệu chỉ được xem (BR-07).")


async def _lines(db: AsyncSession, phieu: PhieuKiemKe) -> list[tuple[ChiTietKiemKe, ThucDon]]:
    rows = await db.execute(
        select(ChiTietKiemKe, ThucDon)
        .join(ThucDon, ChiTietKiemKe.thucdon_id == ThucDon.id)
        .where(ChiTietKiemKe.phieukiemke_id == phieu.id)
        .order_by(ThucDon.tenmon)
    )
    return [(line, mon) for line, mon in rows.all()]


async def _line_views(db: AsyncSession, phieu: PhieuKiemKe) -> list[ShiftLineOut]:
    """Phiếu nháp: tính B, C trực tiếp đến hiện tại. Phiếu đã chốt: dùng số đã lưu."""
    lines = await _lines(db, phieu)
    sold = {}
    if phieu.trangthai == NHAP:
        sold = await _sold(db, phieu.tuluc, None, [line.thucdon_id for line, _ in lines])
    views = []
    for line, mon in lines:
        if phieu.trangthai == DA_CHOT:
            daban, tonlythuyet, chenhlech = line.daban, line.tonlythuyet, line.chenhlech
        else:
            daban = sold.get(line.thucdon_id, 0)
            tonlythuyet = line.tondauca - daban
            chenhlech = None if line.tonthucte is None else line.tonthucte - tonlythuyet
        views.append(
            ShiftLineOut(
                thucdon_id=line.thucdon_id,
                tenmon=mon.tenmon,
                tondauca=line.tondauca,
                daban=daban or 0,
                tonlythuyet=tonlythuyet if tonlythuyet is not None else line.tondauca,
                tonthucte=line.tonthucte,
                chenhlech=chenhlech,
                lydo=line.lydo,
            )
        )
    return views


async def _detail(db: AsyncSession, phieu: PhieuKiemKe) -> ShiftDetailOut:
    views = await _line_views(db, phieu)
    nguoichot = await db.scalar(select(NguoiDung.hoten).where(NguoiDung.id == phieu.nguoichot_id))
    losses = [v.chenhlech for v in views if v.chenhlech is not None and v.chenhlech < 0]
    return ShiftDetailOut(
        id=phieu.id,
        maphieu=phieu.id,  # id chính là mã phiếu (migration 007)
        trangthai=phieu.trangthai,
        tuluc=phieu.tuluc,
        giotao=phieu.giotao,
        giochot=phieu.giochot,
        nguoichot=nguoichot,
        so_mon=len(views),
        so_mon_hao_hut=len(losses),
        tong_hao_hut=-sum(losses),
        lines=views,
    )


async def list_shifts(db: AsyncSession) -> list[ShiftSummaryOut]:
    phieus = (await db.execute(select(PhieuKiemKe).order_by(PhieuKiemKe.giotao.desc()))).scalars()
    return [ShiftSummaryOut(**(await _detail(db, p)).model_dump(exclude={"lines"})) for p in phieus]


async def get_shift(db: AsyncSession, shift_id: str) -> ShiftDetailOut:
    return await _detail(db, await _get_phieu(db, shift_id))


async def create_shift(db: AsyncSession) -> ShiftDetailOut:
    if await db.scalar(select(PhieuKiemKe.id).where(PhieuKiemKe.trangthai == NHAP)):
        raise ApiError(409, "SHIFT_DRAFT_EXISTS", "Đang có phiếu kiểm kê chưa chốt — hãy mở phiếu đó.")
    # Món mua sẵn (có soluongton); món chế biến trừ nguyên liệu — story-spec-tru-kho-tu-dong.md
    tracked = (await db.execute(select(ThucDon).where(ThucDon.soluongton.is_not(None)))).scalars().all()
    if not tracked:
        raise ApiError(
            409,
            "NO_TRACKED_ITEMS",
            "Chưa có món nào đếm số lượng tồn (vd. nước uống) — hãy nhập số lượng tồn trước.",
        )
    now = _now()
    tuluc = await _period_start(db, now)
    # `soluongton` đã bị trừ dần theo đơn từ đầu kỳ (story-spec-tru-kho-tu-dong.md) → cộng lại
    # số đã bán trong kỳ để ra tồn ĐẦU kỳ, tránh trừ hai lần khi tính C = A - B.
    da_ban = await _sold(db, tuluc, now, [mon.id for mon in tracked])
    # id (mã phiếu PKK-YYYYMMDD-NNNN) do database tự sinh — migration 007
    phieu = PhieuKiemKe(trangthai=NHAP, tuluc=tuluc)
    try:
        db.add(phieu)
        await db.flush()
        db.add_all(
            ChiTietKiemKe(
                phieukiemke_id=phieu.id,
                thucdon_id=mon.id,
                tondauca=mon.soluongton + da_ban.get(mon.id, 0),
            )
            for mon in tracked
        )
        await db.commit()
    except IntegrityError as exc:  # 2 người cùng tạo phiếu — unique index chỉ cho 1 phiếu nháp
        await db.rollback()
        raise ApiError(409, "SHIFT_DRAFT_EXISTS", "Đang có phiếu kiểm kê chưa chốt.") from exc
    return await _detail(db, phieu)


def _apply_lines(lines: list[tuple[ChiTietKiemKe, ThucDon]], updates: list[ShiftLineIn]) -> None:
    by_dish = {line.thucdon_id: line for line, _ in lines}
    unknown = [str(u.thucdon_id) for u in updates if u.thucdon_id not in by_dish]
    if unknown:
        raise ApiError(422, "UNKNOWN_ITEM", "Món không thuộc phiếu kiểm kê này.", unknown)
    for u in updates:
        line = by_dish[u.thucdon_id]
        line.tonthucte = u.tonthucte
        line.lydo = (u.lydo or "").strip() or None


async def save_lines(db: AsyncSession, shift_id: str, updates: list[ShiftLineIn]) -> ShiftDetailOut:
    phieu = await _get_phieu(db, shift_id, lock=True)
    _ensure_draft(phieu)
    _apply_lines(await _lines(db, phieu), updates)
    await db.commit()
    return await _detail(db, phieu)


async def close_shift(
    db: AsyncSession, shift_id: str, updates: list[ShiftLineIn], manager_pin: str
) -> tuple[ShiftDetailOut, list[ThucDon]]:
    """AC3: chốt ca. Trả thêm các món đổi trạng thái còn/hết hàng để phát realtime."""
    phieu = await _get_phieu(db, shift_id, lock=True)
    _ensure_draft(phieu)
    lines = await _lines(db, phieu)
    _apply_lines(lines, updates)
    views = {v.thucdon_id: v for v in await _line_views(db, phieu)}

    missing = [mon.tenmon for line, mon in lines if line.tonthucte is None]
    if missing:
        raise ApiError(422, "ACTUAL_STOCK_MISSING", "Chưa nhập tồn thực tế cho tất cả các món.", missing)
    # AC4: hao hụt (chênh lệch âm) bắt buộc có lý do — server kiểm tra lại dù giao diện đã chặn
    no_reason = [
        {"thucdon_id": str(line.thucdon_id), "tenmon": mon.tenmon}
        for line, mon in lines
        if views[line.thucdon_id].chenhlech < 0 and not line.lydo
    ]
    if no_reason:
        raise ApiError(
            422,
            "LOSS_REASON_REQUIRED",
            "Vui lòng nhập lý do hao hụt trước khi chốt ca.",
            no_reason,
        )
    # AC5: Manager Override — PIN của một tài khoản Quản lý
    manager = await db.scalar(select(NguoiDung).where(NguoiDung.vaitro == QUAN_LY, NguoiDung.mapin == manager_pin))
    if manager is None:
        raise ApiError(403, "INVALID_MANAGER_PIN", "Mã PIN không đúng hoặc không phải tài khoản Quản lý.")

    flipped: list[ThucDon] = []
    for line, mon in lines:
        v = views[line.thucdon_id]
        line.daban, line.tonlythuyet, line.chenhlech = v.daban, v.tonlythuyet, v.chenhlech
        truoc = mon.het_hang
        mon.soluongton = line.tonthucte  # AC3: tồn thực tế thành tồn đầu ca sau
        if mon.het_hang != truoc:
            flipped.append(mon)
    phieu.trangthai = DA_CHOT
    phieu.giochot = _now()
    phieu.nguoichot_id = manager.id
    await db.commit()
    return await _detail(db, phieu), flipped


async def delete_shift(db: AsyncSession, shift_id: str) -> None:
    phieu = await _get_phieu(db, shift_id, lock=True)
    _ensure_draft(phieu)  # BR-07: phiếu đã chốt không được xóa
    await db.delete(phieu)
    await db.commit()
