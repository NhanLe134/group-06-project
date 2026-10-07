"""US-03 — KDS API.

Mỗi test ghi AC/quy tắc được kiểm chứng (story-spec-us03-kds.md, mục Test plan).
"""

from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import ChiTietMon, HoaDon, LogHuyMon, PhienBan, ThucDon
from app.ws.manager import ConnectionManager


async def _seed(db: AsyncSession, *, het_hang: bool = False, soluong: int = 2, **item_kw):
    mon = ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000)
    mon.trangthaiban = not het_hang
    phien = PhienBan(tenban="Bàn 01")
    db.add_all([mon, phien])
    await db.flush()
    hoadon = HoaDon(phienban_id=phien.id, trangthai="da_chot")
    db.add(hoadon)
    await db.flush()
    item = ChiTietMon(
        hoadon_id=hoadon.id, thucdon_id=mon.id, soluong=soluong, ghichu="Không hành", **item_kw
    )
    db.add(item)
    await db.commit()
    return mon, item


async def test_list_items_returns_card_fields_sorted_fifo(
    client: AsyncClient, db_session: AsyncSession
):
    """GIVEN 2 món gọi lúc khác nhau, WHEN GET /kds/items,
    THEN có đủ bàn/tên món/giờ gọi, món gọi trước đứng trước (FIFO)."""
    _, newer = await _seed(db_session, giogoimon=datetime(2026, 10, 6, 5, 0))
    _, older = await _seed(db_session, giogoimon=datetime(2026, 10, 6, 4, 0))

    resp = await client.get("/kds/items")

    assert resp.status_code == 200
    body = resp.json()
    assert [i["id"] for i in body] == [str(older.id), str(newer.id)]
    assert body[0]["ban"] == "Bàn 01"
    assert body[0]["tenmon"] == "Phở bò tái lăn"
    assert body[0]["trangthai"] == "cho_nau"  # mặc định DB
    assert body[0]["giogoimon"].endswith("+00:00")  # trả kèm múi giờ UTC


async def test_list_items_hides_served_and_cancelled(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session, trangthai="da_phuc_vu")
    await _seed(db_session, trangthai="da_huy")
    assert (await client.get("/kds/items")).json() == []


@pytest.mark.parametrize(
    ("start", "target"),
    [
        ("cho_nau", "dang_nau"),
        ("cho_nau", "da_xong"),
        ("dang_nau", "da_xong"),
        ("da_xong", "dang_nau"),
    ],
)
async def test_update_status_valid_transitions(
    client: AsyncClient, db_session: AsyncSession, start: str, target: str
):
    """AC2: đổi trạng thái hợp lệ (kể cả Chờ nấu → Đã nấu bằng nút Xong) được lưu vào DB."""
    _, item = await _seed(db_session, trangthai=start)

    resp = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": target})

    assert resp.status_code == 200
    assert resp.json()["trangthai"] == target
    await db_session.refresh(item)
    assert item.trangthai == target


async def test_update_status_rejects_invalid_transition(
    client: AsyncClient, db_session: AsyncSession
):
    _, item = await _seed(db_session, trangthai="da_xong")
    resp = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "cho_nau"})
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "INVALID_STATUS_TRANSITION"


async def test_update_status_rejects_unknown_value(client: AsyncClient, db_session: AsyncSession):
    _, item = await _seed(db_session)
    resp = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "READY"})
    assert resp.status_code == 422


async def test_update_status_404(client: AsyncClient):
    resp = await client.patch("/kds/items/KHONG-TON-TAI/status", json={"trangthai": "dang_nau"})
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "ORDER_ITEM_NOT_FOUND"


async def test_cannot_cook_pending_item_when_out_of_stock(
    client: AsyncClient, db_session: AsyncSession
):
    """BR-03: món hết hàng khi còn Chờ nấu thì server chặn nấu — client không bypass được."""
    _, item = await _seed(db_session, het_hang=True)
    resp = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "dang_nau"})
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "ITEM_OUT_OF_STOCK"


async def test_split_moves_part_and_keeps_rest(client: AsyncClient, db_session: AsyncSession):
    """Nấu từng phần: 10 suất, nấu trước 4 → 6 Chờ nấu + 4 Đang nấu, giữ giờ gọi gốc."""
    _, item = await _seed(db_session, soluong=10)

    resp = await client.post(
        f"/kds/items/{item.id}/split", json={"soluong": 4, "trangthai": "dang_nau"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert (body["goc"]["soluong"], body["goc"]["trangthai"]) == (6, "cho_nau")
    assert (body["moi"]["soluong"], body["moi"]["trangthai"]) == (4, "dang_nau")
    assert body["moi"]["giogoimon"] == body["goc"]["giogoimon"]
    assert body["moi"]["ghichu"] == "Không hành"


@pytest.mark.parametrize("soluong", [10, 11])
async def test_split_rejects_quantity_not_less_than_current(
    client: AsyncClient, db_session: AsyncSession, soluong: int
):
    _, item = await _seed(db_session, soluong=10)
    resp = await client.post(
        f"/kds/items/{item.id}/split", json={"soluong": soluong, "trangthai": "dang_nau"}
    )
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "INVALID_SPLIT_QUANTITY"


async def test_cancel_out_of_stock_marks_cancelled_and_logs(
    client: AsyncClient, db_session: AsyncSession
):
    """Món chờ nấu đã hết hàng → xóa khỏi hàng đợi (da_huy) và có nhật ký loghuymon."""
    _, item = await _seed(db_session, het_hang=True)

    resp = await client.post(f"/kds/items/{item.id}/cancel-out-of-stock")

    assert resp.status_code == 200
    assert resp.json()["trangthai"] == "da_huy"
    logs = (await db_session.execute(select(LogHuyMon))).scalars().all()
    assert len(logs) == 1 and logs[0].chitietmon_id == item.id


async def test_cancel_out_of_stock_rejected_when_dish_available(
    client: AsyncClient, db_session: AsyncSession
):
    _, item = await _seed(db_session, het_hang=False)
    resp = await client.post(f"/kds/items/{item.id}/cancel-out-of-stock")
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "ITEM_NOT_CANCELLABLE"


async def test_mark_out_of_stock_then_in_stock(client: AsyncClient, db_session: AsyncSession):
    """AC3: Bếp báo Hết hàng → thucdon.trangthaiban = false → E-Menu thấy out_of_stock."""
    mon, _ = await _seed(db_session)

    resp = await client.post(f"/menu/items/{mon.id}/out-of-stock")
    assert resp.status_code == 200
    assert resp.json()["status"] == "out_of_stock"
    assert (await client.get("/kds/items")).json()[0]["het_hang"] is True

    resp = await client.post(f"/menu/items/{mon.id}/in-stock")
    assert resp.json()["status"] == "available"


async def test_mark_out_of_stock_404(client: AsyncClient):
    resp = await client.post("/menu/items/KHONG-TON-TAI/out-of-stock")
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "MENU_ITEM_NOT_FOUND"


async def test_demo_orders_disabled_when_demo_mode_off(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    # đặt rõ giá trị — không phụ thuộc DEMO_MODE trong backend/.env của từng máy
    monkeypatch.setattr(settings, "demo_mode", False)
    resp = await client.post("/kds/demo/orders")
    assert resp.status_code == 404


async def test_demo_orders_create_two_tables(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """AC1 (demo): Bàn 01 gọi 2, Bàn 02 gọi 1 Phở bò → 2 thẻ Chờ nấu cùng món để AI gom mẻ."""
    monkeypatch.setattr(settings, "demo_mode", True)
    db_session.add(ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000))
    await db_session.commit()

    resp = await client.post("/kds/demo/orders")

    assert resp.status_code == 200
    body = resp.json()
    assert [(i["ban"], i["soluong"]) for i in body] == [("Bàn 01 (demo)", 2), ("Bàn 02 (demo)", 1)]
    assert {i["trangthai"] for i in body} == {"cho_nau"}


async def test_publish_sends_envelope_and_drops_broken_clients():
    """WebSocket: envelope chuẩn {event, payload, emitted_at}; client lỗi bị gỡ khỏi kênh."""

    class FakeWs:
        def __init__(self, broken: bool = False):
            self.sent, self.broken = [], broken

        async def send_json(self, message):
            if self.broken:
                raise RuntimeError("closed")
            self.sent.append(message)

    mgr = ConnectionManager()
    ok, broken = FakeWs(), FakeWs(broken=True)
    mgr.channels["kds:tickets"].update({ok, broken})

    await mgr.publish("kds:tickets", "ITEM_READY", {"ban": "Bàn 01"})

    assert ok.sent[0]["event"] == "ITEM_READY"
    assert ok.sent[0]["payload"] == {"ban": "Bàn 01"}
    assert datetime.fromisoformat(ok.sent[0]["emitted_at"]) - datetime.now(
        datetime.fromisoformat(ok.sent[0]["emitted_at"]).tzinfo
    ) < timedelta(seconds=5)
    assert broken not in mgr.channels["kds:tickets"]


async def test_kds_still_cooks_reserved_item_when_drink_stock_is_zero(
    client: AsyncClient, db_session: AsyncSession
):
    """Story Spec trừ kho tự động (AC6): soluongton = 0 nghĩa là đã bán hết cho các đơn đã gửi bếp
    (đã trừ lúc gửi) → món đang chờ nấu vẫn nấu/xong được; chỉ bếp BÁO HẾT mới chặn."""
    mon, item = await _seed(db_session)
    mon.soluongton = 0
    await db_session.commit()

    assert (await client.get("/kds/items")).json()[0]["het_hang"] is False
    resp = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "da_xong"})
    assert resp.status_code == 200


async def test_double_click_done_second_request_is_409(
    client: AsyncClient, db_session: AsyncSession
):
    """TC-OP-KDS-005 (§11.3 double click): bấm "Xong" 2 lần liên tiếp → lần 2 bị 409,
    trạng thái trong DB vẫn đúng 1 lần chuyển."""
    _, item = await _seed(db_session)
    first = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "da_xong"})
    second = await client.patch(f"/kds/items/{item.id}/status", json={"trangthai": "da_xong"})

    assert first.status_code == 200
    assert second.status_code == 409
    assert second.json()["error_code"] == "INVALID_STATUS_TRANSITION"


async def test_vietnamese_and_emoji_note_shown_unchanged_on_kds(
    client: AsyncClient, db_session: AsyncSession
):
    """TC-OP-KDS-012 (§11.3 Unicode/tiếng Việt/emoji): ghi chú khách nhập hiện nguyên vẹn."""
    note = "Không hành, ít cay 🌶️ — thêm chanh"
    mon = ThucDon(tenmon="Bún bò Huế", phanloai="Món chính", giaban=60000)
    db_session.add(mon)
    await db_session.commit()

    resp = await client.post(
        "/orders",
        json={
            "table_name": "Bàn 09",
            "items": [{"thucdon_id": mon.id, "soluong": 1, "ghichu": note}],
        },
    )
    assert resp.status_code == 200
    card = next(i for i in (await client.get("/kds/items")).json() if i["ban"] == "Bàn 09")
    assert (card["tenmon"], card["ghichu"]) == ("Bún bò Huế", note)
