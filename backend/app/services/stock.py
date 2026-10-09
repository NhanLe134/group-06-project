"""Trừ / hoàn kho tự động theo công thức. Spec: vault/06-Engineering/story-spec-tru-kho-tu-dong.md.

- Gửi bếp (Q1): món mua sẵn trừ `thucdon.soluongton`; món chế biến trừ `tonkho.tonhethong`
  (dinhluong × số phần) theo công thức — mỗi món chỉ dùng MỘT cách (xem `ThucDon.mua_san`).
- Hủy món chờ nấu: cộng trả lại (Q2). Không đủ thì từ chối cả đơn, không cho tồn âm (Q6).
Các hàm trả về "watch" = trạng thái hết hàng trước khi đổi của các món liên quan, để router
phát `ITEM_OOS_BROADCAST` cho món đổi còn ↔ hết sau khi commit (`flipped`).
"""

import logging
from collections import defaultdict
from collections.abc import Iterable
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ApiError
from app.logging_setup import kv
from app.models.menu import CongThuc, ThucDon, TonKho
from app.schemas.stock import (
    IngredientIn,
    IngredientOut,
    IngredientUpdateIn,
    RecipeIn,
    RecipeLineOut,
    RecipeOut,
)

log = logging.getLogger("app.stock")
Watch = dict[str, tuple[ThucDon, bool]]


def _dec(value: float) -> Decimal:
    return Decimal(str(value))


def flipped(watch: Watch) -> list[ThucDon]:
    """Các món đã đổi trạng thái còn/hết hàng so với lúc bắt đầu theo dõi."""
    return [mon for mon, truoc in watch.values() if mon.het_hang != truoc]


async def _lock_dishes(db: AsyncSession, ids: Iterable[str]) -> dict[str, ThucDon]:
    ids = list(ids)
    if not ids:
        return {}
    rows = await db.execute(
        select(ThucDon)
        .where(ThucDon.id.in_(ids))
        .with_for_update(of=ThucDon)
        .execution_options(populate_existing=True)
    )
    return {mon.id: mon for mon in rows.scalars().all()}


async def _lock_ingredients(db: AsyncSession, ids: Iterable[str]) -> dict[str, TonKho]:
    ids = list(ids)
    if not ids:
        return {}
    rows = await db.execute(
        select(TonKho)
        .where(TonKho.id.in_(ids))
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return {nl.id: nl for nl in rows.scalars().all()}


async def _watch(db: AsyncSession, dishes: Iterable[ThucDon], tonkho_ids: set[str]) -> Watch:
    """Theo dõi các món trong đơn + mọi món khác dùng chung nguyên liệu (AC3)."""
    watch: Watch = {mon.id: (mon, mon.het_hang) for mon in dishes}
    if tonkho_ids:
        rows = await db.execute(
            select(ThucDon).where(
                ThucDon.id.in_(
                    select(CongThuc.thucdon_id).where(CongThuc.tonkho_id.in_(tonkho_ids))
                )
            )
        )
        for mon in rows.scalars().all():
            watch.setdefault(mon.id, (mon, mon.het_hang))
    return watch


def _cong_thuc(mon: ThucDon) -> list[CongThuc]:
    """Công thức dùng để trừ kho: món mua sẵn không trừ nguyên liệu (chỉ trừ `soluongton`)."""
    return [] if mon.mua_san else list(mon.congthuc)


async def _prepare(
    db: AsyncSession, lines: Iterable[tuple[str, int]]
) -> tuple[dict[str, int], dict[str, ThucDon], Watch]:
    qty: dict[str, int] = defaultdict(int)
    for thucdon_id, soluong in lines:
        if thucdon_id:
            qty[thucdon_id] += soluong or 1
    dishes = await _lock_dishes(db, qty)
    tonkho_ids = {ct.tonkho_id for mon in dishes.values() for ct in _cong_thuc(mon) if ct.tonkho_id}
    await _lock_ingredients(db, tonkho_ids)  # đọc lại tồn mới nhất dưới khóa
    return qty, dishes, await _watch(db, dishes.values(), tonkho_ids)


async def reserve(db: AsyncSession, lines: Iterable[tuple[str, int]]) -> Watch:
    """Q1 — trừ kho khi gửi bếp. Thiếu hàng/nguyên liệu thì 409 và không trừ gì (Q6)."""
    qty, dishes, watch = await _prepare(db, lines)
    need: dict[str, Decimal] = defaultdict(Decimal)
    nguyenlieu: dict[str, TonKho] = {}
    for thucdon_id, soluong in qty.items():
        for ct in _cong_thuc(dishes[thucdon_id]) if thucdon_id in dishes else []:
            need[ct.tonkho_id] += ct.dinhluong * soluong
            nguyenlieu[ct.tonkho_id] = ct.nguyenlieu
    thieu_nl = {tid for tid, n in need.items() if (nguyenlieu[tid].tonhethong or 0) < n}

    thieu = [
        mon
        for thucdon_id, soluong in qty.items()
        if (mon := dishes.get(thucdon_id)) is not None
        and (
            # Kiểm tra lại DƯỚI KHÓA DÒNG: bếp có thể vừa "Báo hết" trong lúc đơn chờ khóa
            # (BUG-US03-005 — TC-OP-005)
            mon.trangthaiban is False
            or (mon.mua_san and mon.soluongton < soluong)
            or any(ct.tonkho_id in thieu_nl for ct in _cong_thuc(mon))
        )
    ]
    if thieu:
        details = [
            {
                "thucdon_id": mon.id,
                "tenmon": mon.tenmon,
                "con_lai": 0 if mon.trangthaiban is False else (mon.so_phan_con or 0),
            }
            for mon in thieu
        ]
        ten = ", ".join(f"'{d['tenmon']}' (còn {d['con_lai']} phần)" for d in details)
        log.info("stock_rejected %s", kv(dishes=",".join(d["thucdon_id"] for d in details)))
        raise ApiError(409, "ITEM_OUT_OF_STOCK", f"Không đủ hàng cho món {ten}.", details)

    for thucdon_id, soluong in qty.items():
        mon = dishes.get(thucdon_id)
        if mon is not None and mon.mua_san:
            mon.soluongton -= soluong
    for tid, n in need.items():
        nguyenlieu[tid].tonhethong = (nguyenlieu[tid].tonhethong or 0) - n
    log.info("stock_reserved %s", kv(
        dishes=",".join(qty), ingredients=",".join(f"{t}:-{n}" for t, n in need.items()) or "-",
    ))
    return watch


async def release(db: AsyncSession, lines: Iterable[tuple[str, int]]) -> Watch:
    """Q2 — cộng trả kho cho món hủy khi còn chờ nấu."""
    qty, dishes, watch = await _prepare(db, lines)
    for thucdon_id, soluong in qty.items():
        mon = dishes.get(thucdon_id)
        if mon is None:
            continue
        if mon.mua_san:
            mon.soluongton += soluong
        for ct in _cong_thuc(mon):
            ct.nguyenlieu.tonhethong = (ct.nguyenlieu.tonhethong or 0) + ct.dinhluong * soluong
    log.info("stock_released %s", kv(dishes=",".join(qty)))
    return watch


# ---------- Nguyên liệu (tab "Thực phẩm" — Q4) ----------


async def _used_in(db: AsyncSession) -> dict[str, list[str]]:
    rows = await db.execute(
        select(CongThuc.tonkho_id, ThucDon.tenmon)
        .join(ThucDon, CongThuc.thucdon_id == ThucDon.id)
        .order_by(ThucDon.tenmon)
    )
    used: dict[str, list[str]] = defaultdict(list)
    for tonkho_id, tenmon in rows.all():
        used[tonkho_id].append(tenmon)
    return used


def _ingredient_out(nl: TonKho, used_in: list[str]) -> IngredientOut:
    return IngredientOut(
        id=nl.id,
        name=nl.tennguyenlieu,
        unit=nl.donvitinh,
        stock=float(nl.tonhethong or 0),
        used_in=used_in,
    )


async def _get_ingredient(db: AsyncSession, ingredient_id: str) -> TonKho:
    nl = await db.get(TonKho, ingredient_id, with_for_update=True)
    if nl is None:
        raise ApiError(404, "INGREDIENT_NOT_FOUND", "Không tìm thấy nguyên liệu.")
    return nl


async def list_ingredients(db: AsyncSession) -> list[IngredientOut]:
    used = await _used_in(db)
    rows = await db.execute(select(TonKho).order_by(TonKho.tennguyenlieu))
    return [_ingredient_out(nl, used.get(nl.id, [])) for nl in rows.scalars().all()]


async def create_ingredient(db: AsyncSession, body: IngredientIn) -> IngredientOut:
    nl = TonKho(
        tennguyenlieu=body.name.strip(), donvitinh=body.unit.strip(), tonhethong=_dec(body.stock)
    )
    db.add(nl)
    await db.commit()
    return _ingredient_out(nl, [])


async def update_ingredient(
    db: AsyncSession, ingredient_id: str, body: IngredientUpdateIn
) -> tuple[IngredientOut, list[ThucDon]]:
    nl = await _get_ingredient(db, ingredient_id)
    watch = await _watch(db, [], {nl.id})
    if body.name is not None:
        nl.tennguyenlieu = body.name.strip()
    if body.unit is not None:
        nl.donvitinh = body.unit.strip()
    if body.stock is not None:
        nl.tonhethong = _dec(body.stock)
    await db.commit()
    used = await _used_in(db)
    return _ingredient_out(nl, used.get(nl.id, [])), flipped(watch)


async def delete_ingredient(db: AsyncSession, ingredient_id: str) -> None:
    nl = await _get_ingredient(db, ingredient_id)
    used = (await _used_in(db)).get(nl.id, [])
    if used:
        raise ApiError(
            409,
            "INGREDIENT_IN_USE",
            f"Nguyên liệu đang có trong công thức của: {', '.join(used)}. "
            "Hãy gỡ khỏi công thức trước.",
            used,
        )
    await db.delete(nl)
    await db.commit()


# ---------- Công thức của món (form Sửa món — Q4) ----------


def _recipe_out(mon: ThucDon) -> RecipeOut:
    return RecipeOut(
        thucdon_id=mon.id,
        tenmon=mon.tenmon,
        portions=mon.so_phan_con,
        lines=[
            RecipeLineOut(
                ingredient_id=ct.tonkho_id,
                ingredient_name=ct.nguyenlieu.tennguyenlieu,
                unit=ct.nguyenlieu.donvitinh,
                quantity=float(ct.dinhluong),
                stock=float(ct.nguyenlieu.tonhethong or 0),
            )
            for ct in sorted(mon.congthuc, key=lambda c: c.nguyenlieu.tennguyenlieu)
        ],
    )


async def _get_dish(db: AsyncSession, thucdon_id: str) -> ThucDon:
    mon = await db.get(ThucDon, thucdon_id)
    if mon is None:
        raise ApiError(404, "MENU_ITEM_NOT_FOUND", "Không tìm thấy món trong thực đơn.")
    return mon


async def get_recipe(db: AsyncSession, thucdon_id: str) -> RecipeOut:
    return _recipe_out(await _get_dish(db, thucdon_id))


async def set_recipe(
    db: AsyncSession, thucdon_id: str, body: RecipeIn
) -> tuple[RecipeOut, list[ThucDon]]:
    """Thay toàn bộ công thức của món."""
    ids = [line.ingredient_id for line in body.lines]
    if len(ids) != len(set(ids)):
        raise ApiError(
            422, "DUPLICATE_INGREDIENT", "Mỗi nguyên liệu chỉ nhập 1 lần trong công thức."
        )
    mon = await _get_dish(db, thucdon_id)
    nguyenlieu = await _lock_ingredients(db, ids)
    missing = [i for i in ids if i not in nguyenlieu]
    if missing:
        raise ApiError(404, "INGREDIENT_NOT_FOUND", "Không tìm thấy nguyên liệu.", missing)
    watch: Watch = {mon.id: (mon, mon.het_hang)}
    mon.congthuc.clear()
    await db.flush()  # xóa dòng cũ trước khi thêm, tránh trùng UNIQUE(thucdon_id, tonkho_id)
    for line in body.lines:
        mon.congthuc.append(
            CongThuc(nguyenlieu=nguyenlieu[line.ingredient_id], dinhluong=_dec(line.quantity))
        )
    await db.commit()
    return _recipe_out(mon), flipped(watch)
