"""Observability — log backend cho luồng KDS (Story Spec US-03 Mục 9, giáo trình §12 bước 4).

Kiểm tra: mỗi request có 1 dòng log; sự kiện nghiệp vụ (gửi bếp, trừ kho, từ chối, đổi trạng thái,
báo hết) được ghi; lỗi không lường trước trả 500 chung chung cho client nhưng log đủ traceback;
log KHÔNG chứa ghi chú khách nhập.
"""

import logging

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.main import app
from app.models import Ban, ThucDon

pytestmark = pytest.mark.asyncio


async def _seed(db: AsyncSession, **kw) -> ThucDon:
    # Món ăn (không phải "Đồ uống"): từ BUG-WT-002, đồ uống không hiện trên KDS
    mon = ThucDon(tenmon="Bánh mì chảo", phanloai="Món chính", giaban=45000, **kw)
    db.add_all([mon, Ban(tenban="Bàn 01", trangthai=1)])
    await db.commit()
    return mon


def _messages(caplog: pytest.LogCaptureFixture, logger: str) -> list[str]:
    return [r.getMessage() for r in caplog.records if r.name == logger]


async def test_order_and_kitchen_actions_are_logged(
    client: AsyncClient, db_session: AsyncSession, caplog: pytest.LogCaptureFixture
):
    caplog.set_level(logging.INFO, logger="app")
    mon = await _seed(db_session, soluongton=5)
    note = "Không đá — dị ứng lạnh"

    resp = await client.post(
        "/orders",
        json={
            "table_name": "Bàn 01",
            "items": [{"thucdon_id": mon.id, "soluong": 2, "ghichu": note}],
        },
    )
    item_id = resp.json()["items"][0]["id"]
    await client.patch(f"/kds/items/{item_id}/status", json={"trangthai": "da_xong"})
    await client.post(f"/menu/items/{mon.id}/out-of-stock")

    assert any("order_sent_to_kitchen" in m and "items=2" in m for m in _messages(caplog, "app.orders"))
    assert any("stock_reserved" in m and mon.id in m for m in _messages(caplog, "app.stock"))
    assert any(f"item={item_id}" in m and "trangthai=da_xong" in m for m in _messages(caplog, "app.kds"))
    assert any("menu_availability" in m and "status=out_of_stock" in m for m in _messages(caplog, "app.menu"))
    assert any("request" in m and "path=/orders" in m and "status=200" in m for m in _messages(caplog, "app.http"))
    assert note not in caplog.text  # không ghi ghi chú khách (dữ liệu cá nhân)


async def test_rejected_order_is_logged_as_business_error(
    client: AsyncClient, db_session: AsyncSession, caplog: pytest.LogCaptureFixture
):
    caplog.set_level(logging.INFO, logger="app")
    mon = await _seed(db_session, soluongton=1)

    resp = await client.post(
        "/orders",
        json={
            "table_name": "Bàn 01",
            "items": [{"thucdon_id": mon.id, "soluong": 3}],
        },
    )

    assert resp.status_code == 409
    assert any("stock_rejected" in m and mon.id in m for m in _messages(caplog, "app.stock"))
    assert any(
        "api_error" in m and "status=409" in m and "code=ITEM_OUT_OF_STOCK" in m for m in _messages(caplog, "app.http")
    )


async def test_unexpected_error_returns_generic_500_and_logs_traceback(
    db_session: AsyncSession, caplog: pytest.LogCaptureFixture, monkeypatch: pytest.MonkeyPatch
):
    """Viva §16.3: "API trả 500 thì UI và log phản ứng thế nào?" — client nhận thông báo chung,
    log có tên lỗi + traceback để lần ra nguyên nhân."""
    caplog.set_level(logging.INFO, logger="app")
    from app.services import kds as kds_service

    async def boom(_db):
        raise RuntimeError("db connection lost (simulated)")

    monkeypatch.setattr(kds_service, "list_items", boom)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/kds/items")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 500
    assert resp.json() == {
        "error_code": "INTERNAL_ERROR",
        "message": "Lỗi máy chủ, vui lòng thử lại.",
    }
    assert "db connection lost" not in resp.text  # không lộ chi tiết bên trong cho client
    errors = [r for r in caplog.records if r.name == "app.http" and r.levelno == logging.ERROR]
    assert errors and "unhandled_error" in errors[0].getMessage()
    message = errors[0].getMessage()
    assert "path=/kds/items" in message and "error=RuntimeError" in message
    assert errors[0].exc_info is not None  # có traceback
