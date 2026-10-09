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


async def test_sepay_qr_noi_dung_chuyen_khoan_ban_so(client, setup_order):
    """QR sinh nội dung CK 'Ban 06' (số bàn) — hoadon chỉ sinh khi thanh toán (ADR-N14)."""
    ban_id = setup_order
    qr = (await client.post(f"/tables/{ban_id}/pay-qr")).json()
    assert qr["qr_data"] == "Ban 06"
    assert "des=Ban%2006" in qr["qr_url"]


async def test_sepay_demo_simulation_endpoint(client, setup_order):
    """Endpoint /sepay/demo-sim/{ban_id} giúp test mô phỏng thanh toán SePay."""
    ban_id = setup_order

    res = await client.post(f"/sepay/demo-sim/{ban_id}")
    assert res.status_code == 200
    assert res.json()["success"] is True
