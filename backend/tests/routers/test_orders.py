"""US-01 / US-09 / US-05 — test API gọi món, hóa đơn tạm tính và Thu ngân."""

import pytest

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def menu_ids(db_session):
    """Tạo 2 món mẫu, trả về (id_phở, id_trà_đá)."""
    from app.models.menu import ThucDon

    pho = ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000)
    tra = ThucDon(tenmon="Trà đá", phanloai="Đồ uống", giaban=5000)
    db_session.add_all([pho, tra])
    await db_session.commit()
    return pho.id, tra.id


async def test_gui_dot_1_tao_phien_va_hoa_don(client, menu_ids):
    """US-01 AC4: gửi bếp đợt 1 → tạo phienban 'dang_phuc_vu' + hoadon 'da_chot'."""
    pho_id, _ = menu_ids
    res = await client.post(
        "/orders",
        json={
            "table_name": "Bàn 06",
            "items": [{"thucdon_id": str(pho_id), "soluong": 2, "ghichu": "Không hành"}],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["table_name"] == "Bàn 06"
    assert data["tongtien"] == 130000
    assert len(data["items"]) == 1
    assert data["items"][0]["trangthai"] == "cho_nau"
    assert data["items"][0]["ghichu"] == "Không hành"
    assert data["all_served"] is False


async def test_gui_bep_phat_su_kien_kds(client, menu_ids, monkeypatch):
    """US-03 AC1: gửi bếp → publish KDS_ITEMS_CHANGED lên kênh kds:tickets cho KDS."""
    from app.ws.manager import manager

    sent = []

    async def fake_publish(channel, event, payload):
        sent.append((channel, event, payload))

    monkeypatch.setattr(manager, "publish", fake_publish)
    pho_id, _ = menu_ids
    res = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 2}]},
    )
    assert res.status_code == 200
    item_id = res.json()["items"][0]["id"]
    assert sent == [
        (
            "kds:tickets",
            "KDS_ITEMS_CHANGED",
            {"item_ids": [item_id], "reason": "new_order", "ban": "Bàn 06"},
        )
    ]


async def test_gui_dot_2_cong_vao_hoa_don_cu(client, menu_ids):
    """US-01: gọi đợt 2 → giữ nguyên hoadon, chèn thêm món, tongtien = đợt 1 + đợt 2."""
    pho_id, tra_id = menu_ids
    res1 = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 2}]},
    )
    hoadon_1 = res1.json()["hoadon_id"]

    res2 = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(tra_id), "soluong": 4}]},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["hoadon_id"] == hoadon_1            # giữ nguyên hóa đơn cũ
    assert len(data2["items"]) == 2                  # món đợt 1 + đợt 2
    assert data2["tongtien"] == 130000 + 4 * 5000    # tính lại toàn bộ


async def test_gui_mon_het_hang_bao_409(client, menu_ids, db_session):
    """US-01/REQ-09: món hết hàng → server chặn, không tạo hóa đơn."""
    from app.models.menu import ThucDon

    pho_id, _ = menu_ids
    mon = await db_session.get(ThucDon, pho_id)
    mon.trangthaiban = False
    await db_session.commit()

    res = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 1}]},
    )
    assert res.status_code == 409
    assert res.json()["error_code"] == "ITEM_OUT_OF_STOCK"


async def test_order_current_va_trang_thai_phuc_vu(client, menu_ids, db_session):
    """US-09: hóa đơn tạm tính + all_served chỉ True khi mọi món 'da_phuc_vu'."""
    pho_id, tra_id = menu_ids
    res = await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 1}]},
    )
    data = res.json()
    assert data["all_served"] is False

    current = await client.get("/orders/current", params={"table_name": "Bàn 06"})
    assert current.status_code == 200
    items = current.json()["items"]
    assert items[0]["gia"] == 65000
    assert items[0]["thanhtien"] == 65000

    # Đánh dấu món đã phục vụ (giả lập Waiter bấm "Đã phục vụ" — US-04)
    from app.models.order import ChiTietMon

    mon = await db_session.get(ChiTietMon, items[0]["id"])
    mon.trangthai = "da_phuc_vu"
    await db_session.commit()

    current2 = await client.get("/orders/current", params={"table_name": "Bàn 06"})
    assert current2.json()["all_served"] is True
    assert tra_id  # dùng biến để lint không báo chưa dùng


async def test_order_current_chua_co_don_bao_404(client):
    """US-09 AC5: bàn chưa gọi món → 404."""
    res = await client.get("/orders/current", params={"table_name": "Bàn 99"})
    assert res.status_code == 404


async def test_cashier_tables_va_qr_va_dong_ban(client, menu_ids):
    """US-05: danh sách bàn → tạo QR → xác nhận tiền & đóng bàn."""
    pho_id, _ = menu_ids
    await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 2}]},
    )

    tables = await client.get("/cashier/tables")
    assert tables.status_code == 200
    rows = tables.json()
    ban06 = next(r for r in rows if r["tenban"] == "Bàn 06")
    assert ban06["trangthai"] == "dang_phuc_vu"
    assert ban06["tongtien"] == 130000

    qr = await client.post(f"/orders/{ban06['hoadon_id']}/pay-qr")
    assert qr.status_code == 200
    assert qr.json()["amount"] == 130000
    assert qr.json()["qr_url"].startswith("https://")

    closed = await client.post(f"/tables/{ban06['id']}/close")
    assert closed.status_code == 200
    assert closed.json()["tongtien"] == 130000

    tables2 = (await client.get("/cashier/tables")).json()
    ban06_sau = next(r for r in tables2 if r["tenban"] == "Bàn 06")
    assert ban06_sau["trangthai"] == "trong"
    assert ban06_sau["hoadon_id"] is None  # hóa đơn đã 'da_thanh_toan', không còn 'da_chot'


async def test_dong_ban_khi_dang_phuc_vu(client, menu_ids):
    """US-05: thu ngân xác nhận tiền mặt → chốt hóa đơn và đóng bàn bình thường."""
    pho_id, _ = menu_ids
    await client.post(
        "/orders",
        json={"table_name": "Bàn 06", "items": [{"thucdon_id": str(pho_id), "soluong": 1}]},
    )
    tables = (await client.get("/cashier/tables")).json()
    ban06 = next(r for r in tables if r["tenban"] == "Bàn 06")

    closed = await client.post(f"/tables/{ban06['id']}/close")
    assert closed.status_code == 200
    assert closed.json()["message"]
