"""US-05 — Test SePay Webhook và Gạch nợ tự động qua Ngân hàng (ADR-N15)."""

import pytest

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _clear_sepay_webhook_key(monkeypatch):
    """Tách test khỏi backend/.env của máy chạy (SEPAY_WEBHOOK_API_KEY thật).

    Không clear thì webhook test bị chặn 401 khi máy đã cấu hình key thật.
    """
    from app.config import settings

    monkeypatch.setattr(settings, "sepay_webhook_api_key", "")


@pytest.fixture
async def setup_order(db_session, client):
    """Tạo bàn 06 + 1 đơn chưa thanh toán."""
    from app.models.menu import ThucDon
    from app.models.order import Ban

    ban = Ban(tenban="Bàn 06", trangthai=1)
    db_session.add(ban)
    await db_session.flush()

    mon = ThucDon(tenmon="Lẩu thái hải sản", phanloai="Món chính", giaban=250000)
    db_session.add(mon)
    await db_session.commit()

    res = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(mon.id), "soluong": 1}]},
    )
    assert res.status_code == 200
    return ban.ban_id


async def test_sepay_webhook_gach_no_tu_dong(client, setup_order):
    """Bơm payload Webhook từ SePay → Tự động gạch nợ hóa đơn Bàn 06."""
    ban_id = setup_order

    # Gửi Webhook SePay mô phỏng tiền vào 250,000đ nội dung format mới 'Ban 06'
    payload = {
        "id": 99999,
        "gateway": "MBBank",
        "transactionDate": "2026-10-08 21:40:00",
        "accountNumber": "0123456789",
        "content": "Ban 06 NGUYEN VAN A",
        "transferAmount": 250000,
        "referenceCode": "FT2610089999",
    }
    res = await client.post("/sepay/webhook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Bàn 06" in data["message"]

    # Kiểm tra lại bàn đã được đóng (trạng thái = 3 'chờ dọn')
    tables = (await client.get("/cashier/tables")).json()
    ban06 = next(r for r in tables if r["id"] == ban_id)
    assert ban06["trangthai"] == "3"
    assert ban06["tongtien"] == 0


async def _phuc_vu_het(client, table_name="Bàn 06"):
    """Giả lập Waiter phục vụ mọi món của bàn (US-05 AC5: phục vụ xong mới tạo QR).

    Chuỗi trạng thái thật: KDS bấm Xong (cho_nau → da_xong) → Waiter phục vụ (da_phuc_vu).
    """
    current = await client.get("/orders/current", params={"table_name": table_name})
    for it in current.json()["items"]:
        if it["trangthai"] != "da_xong":
            res = await client.patch(
                f"/kds/items/{it['id']}/status", json={"trangthai": "da_xong"}
            )
            assert res.status_code == 200, res.text
        res = await client.patch(f"/waiter/items/{it['id']}/serve")
        assert res.status_code == 200, res.text


async def test_sepay_qr_noi_dung_chuyen_khoan_ban_so(client, setup_order):
    """QR sinh nội dung CK 'Ban 06 - HD-...' — khách/quầy nhận diện đúng hóa đơn (ADR-N16)."""
    ban_id = setup_order
    await _phuc_vu_het(client)
    qr = (await client.post(f"/tables/{ban_id}/pay-qr")).json()
    assert qr["hoadon_id"].startswith("HD")
    assert qr["qr_data"] == f"Ban 06 - {qr['hoadon_id']}"
    assert "des=Ban%2006%20-%20" in qr["qr_url"]


async def test_sepay_pay_qr_chan_khi_con_mon_chua_phuc_vu(client, setup_order):
    """US-05 AC5 (TC-US05-009): còn món chưa phục vụ → 409 ORDER_NOT_READY, không sinh QR."""
    ban_id = setup_order
    blocked = await client.post(f"/tables/{ban_id}/pay-qr")
    assert blocked.status_code == 409
    assert blocked.json()["error_code"] == "ORDER_NOT_READY"

    await _phuc_vu_het(client)
    qr = await client.post(f"/tables/{ban_id}/pay-qr")
    assert qr.status_code == 200


async def test_sepay_webhook_khop_hoadon_id(client, setup_order):
    """Webhook khớp bàn qua hoadon_id trong nội dung — cả khi nội dung không nhắc tên bàn."""
    ban_id = setup_order
    await _phuc_vu_het(client)
    qr = (await client.post(f"/tables/{ban_id}/pay-qr")).json()

    payload = {
        "id": 88888,
        "gateway": "MBBank",
        "content": f"chuyen tien theo HD {qr['hoadon_id']}",
        "transferAmount": 250000,
    }
    res = await client.post("/sepay/webhook", json=payload)
    assert res.status_code == 200
    assert "Bàn 06" in res.json()["message"]


async def test_sepay_close_tai_su_dung_hoadon_nhap(client, setup_order):
    """Thanh toán sau khi tạo QR → CHỐT hóa đơn nháp chứ không sinh hóa đơn thứ 2 (ADR-N16)."""
    ban_id = setup_order
    await _phuc_vu_het(client)
    qr = (await client.post(f"/tables/{ban_id}/pay-qr")).json()
    close = (await client.post(f"/tables/{ban_id}/close")).json()
    assert close["hoadon_id"] == qr["hoadon_id"]


async def test_sepay_demo_simulation_endpoint(client, setup_order, monkeypatch):
    """Endpoint /sepay/demo-sim: chỉ bật khi DEMO_MODE=true, mô phỏng đúng luồng webhook."""
    from app.config import settings

    monkeypatch.setattr(settings, "demo_mode", True)
    ban_id = setup_order

    res = await client.post(f"/sepay/demo-sim/{ban_id}")
    assert res.status_code == 200
    assert res.json()["success"] is True


async def test_sepay_demo_simulation_tat_khi_demo_mode_false(client, setup_order, monkeypatch):
    """DEMO_MODE=false (production) → demo-sim phải 404, không ai đóng bàn trợn được."""
    from app.config import settings

    monkeypatch.setattr(settings, "demo_mode", False)
    ban_id = setup_order

    res = await client.post(f"/sepay/demo-sim/{ban_id}")
    assert res.status_code == 404
