"""TC-OP-005 — tranh chấp suất cuối trên PostgreSQL THẬT (giáo trình §11.3 "Concurrent stock").

SQLite (dùng cho các test khác) bỏ qua `SELECT ... FOR UPDATE`, nên chỉ Postgres mới chứng minh được
khóa dòng trong `services/stock.py` chặn bán vượt tồn khi nhiều bàn gửi bếp cùng lúc.

Chạy (cần Docker), KHÔNG trỏ vào Supabase dùng chung:
    docker run -d --rm --name g06-test-pg -e POSTGRES_PASSWORD=test -p 55432:5432 postgres:18-alpine
    set TEST_POSTGRES_URL=postgresql+asyncpg://postgres:test@localhost:55432/postgres
    uv run pytest tests/pg
Không đặt TEST_POSTGRES_URL thì các test này được bỏ qua (skip) — CI hiện chưa có Postgres.
"""

import asyncio
import os
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import Base
from app.errors import ApiError
from app.models import Ban, CongThuc, ThucDon, TonKho
from app.schemas.order import OrderCreateIn
from app.services import orders as order_service

PG_URL = os.getenv("TEST_POSTGRES_URL")
pytestmark = pytest.mark.skipif(not PG_URL, reason="Cần TEST_POSTGRES_URL (Postgres thật)")

SO_DON = 6  # số bàn cùng gửi bếp một lúc


@pytest.fixture
async def session_factory():
    engine = create_async_engine(PG_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:  # bàn là dữ liệu master (ADR-N14)
        db.add_all(Ban(tenban=f"Bàn {i:02d}", trangthai=1) for i in range(1, SO_DON + 1))
        await db.commit()
    yield factory
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


async def _concurrent_orders(factory, thucdon_id: str) -> list[int]:
    """SO_DON bàn khác nhau cùng gửi 1 phần; mỗi bàn 1 session/kết nối riêng như request thật."""

    async def one(ban: int) -> int:
        async with factory() as db:
            data = OrderCreateIn(
                table_name=f"Bàn {ban:02d}", items=[{"thucdon_id": thucdon_id, "soluong": 1}]
            )
            try:
                await order_service.create_order(db, data)
                return 200
            except ApiError as err:
                await db.rollback()
                return err.status_code

    return await asyncio.gather(*(one(i) for i in range(1, SO_DON + 1)))


async def test_cooked_dish_last_portions_sold_exactly_once(session_factory):
    """Kho bò đủ đúng 2 phần, 6 bàn cùng gửi → đúng 2 đơn thành công, 4 đơn 409, kho = 0."""
    async with session_factory() as db:
        bo = TonKho(tennguyenlieu="Thịt bò", donvitinh="kg", tonhethong=Decimal("0.4"))
        mon = ThucDon(tenmon="Bò xào", phanloai="Món chính", giaban=95000)
        mon.congthuc.append(CongThuc(nguyenlieu=bo, dinhluong=Decimal("0.2")))
        db.add(mon)
        await db.commit()
        mon_id, bo_id = mon.id, bo.id

    results = await _concurrent_orders(session_factory, mon_id)

    assert sorted(results) == [200, 200] + [409] * (SO_DON - 2)
    async with session_factory() as db:
        assert await db.scalar(select(TonKho.tonhethong).where(TonKho.id == bo_id)) == 0


async def test_bought_item_last_units_sold_exactly_once(session_factory):
    """Món mua sẵn còn 3 hũ, 6 bàn cùng gửi → đúng 3 đơn thành công, soluongton = 0."""
    async with session_factory() as db:
        mon = ThucDon(tenmon="Sữa chua hũ", phanloai="Tráng miệng", giaban=20000, soluongton=3)
        db.add(mon)
        await db.commit()
        mon_id = mon.id

    results = await _concurrent_orders(session_factory, mon_id)

    assert sorted(results) == [200] * 3 + [409] * (SO_DON - 3)
    async with session_factory() as db:
        assert await db.scalar(select(ThucDon.soluongton).where(ThucDon.id == mon_id)) == 0


async def test_order_racing_kitchen_out_of_stock_is_rejected(session_factory):
    """TC-OP-005 (đúng kịch bản gốc của Ny): khách gửi bếp ĐÚNG LÚC bếp bấm "Báo hết".

    Bếp khóa dòng món và chuyển hết hàng nhưng chưa commit; đơn của khách đã qua bước kiểm tra
    đầu (lúc đó món còn bán) và phải chờ khóa. Bếp commit trước → đơn đến sau bị 409, không trừ kho.
    Regression BUG-US03-005.
    """

    async with session_factory() as db:
        mon = ThucDon(tenmon="Cá hồi", phanloai="Món chính", giaban=200000, soluongton=5)
        db.add(mon)
        await db.commit()
        mon_id = mon.id

    async with session_factory() as kitchen:
        locked = await kitchen.get(ThucDon, mon_id, with_for_update=True)  # bếp đang bấm "Báo hết"
        locked.trangthaiban = False
        await kitchen.flush()

        order = asyncio.create_task(_concurrent_orders_one(session_factory, mon_id))
        await asyncio.sleep(0.5)  # đơn của khách đã chạy tới chỗ chờ khóa dòng
        assert not order.done()
        await kitchen.commit()  # bếp báo hết xong TRƯỚC

    assert await order == 409
    async with session_factory() as db:
        assert await db.scalar(select(ThucDon.soluongton).where(ThucDon.id == mon_id)) == 5


async def _concurrent_orders_one(factory, thucdon_id: str) -> int:
    async with factory() as db:
        data = OrderCreateIn(
            table_name="Bàn 01", items=[{"thucdon_id": thucdon_id, "soluong": 1}]
        )
        try:
            await order_service.create_order(db, data)
            return 200
        except ApiError as err:
            await db.rollback()
            return err.status_code
