import pytest

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def sample_waiter_data(db_session):
    """Tạo dữ liệu mẫu cho Waiter API test: Bàn 01 (Khu A) có 1 món chờ nấu, 1 món đã nấu xong."""
    from app.models.menu import ThucDon
    from app.models.order import Ban, ChiTietPhieu, PhieuBan

    ban01 = Ban(tenban="Bàn 01", trangthai=2)  # Occupied
    db_session.add(ban01)
    await db_session.flush()

    pho = ThucDon(tenmon="Phở bò tái", phanloai="Món chính", giaban=65000)
    db_session.add(pho)
    await db_session.flush()

    phieu = PhieuBan(ban_id=ban01.ban_id, hoadon_id=None)
    db_session.add(phieu)
    await db_session.flush()

    ct1 = ChiTietPhieu(phieuban_id=phieu.phieuban_id, mon_id=pho.id, soluong=1, trangthai="cho_nau")
    ct2 = ChiTietPhieu(phieuban_id=phieu.phieuban_id, mon_id=pho.id, soluong=2, trangthai="da_xong")
    db_session.add_all([ct1, ct2])
    await db_session.commit()

    return {
        "ban_id": ban01.ban_id,
        "ct_cho_nau_id": ct1.chitietphieu_id,
        "ct_da_xong_id": ct2.chitietphieu_id,
    }


async def test_get_tables_zone(client, sample_waiter_data):
    """Test lấy danh sách bàn và Map Zone (Bàn 01 -> Khu A)"""
    res = await client.get("/waiter/tables")
    assert res.status_code == 200
    tables = res.json()
    assert len(tables) > 0
    
    ban01 = next(t for t in tables if t["name"] == "Bàn 01")
    assert ban01["zone"] == "Khu A"
    assert ban01["status"] == "occupied"
    
    # Ktra items
    assert len(ban01["items"]) == 2
    items_status = [i["status"] for i in ban01["items"]]
    assert "pending" in items_status
    assert "ready" in items_status


async def test_mark_item_served_success(client, sample_waiter_data, db_session):
    """Test Waiter xác nhận bưng món ra bàn thành công"""
    item_id = sample_waiter_data["ct_da_xong_id"]
    res = await client.patch(f"/waiter/items/{item_id}/serve")
    assert res.status_code == 200
    assert res.json() == {"message": "Đã phục vụ thành công"}
    
    # Ktra DB
    from app.models.order import ChiTietPhieu
    ct = await db_session.get(ChiTietPhieu, item_id)
    assert ct.trangthai == "da_phuc_vu"


async def test_mark_item_served_invalid_state(client, sample_waiter_data):
    """Test lỗi khi cố bưng món chưa nấu xong"""
    item_id = sample_waiter_data["ct_cho_nau_id"]
    res = await client.patch(f"/waiter/items/{item_id}/serve")
    assert res.status_code == 400


async def test_void_item(client, sample_waiter_data, db_session):
    """Test Hủy món qua API Waiter (Không yêu cầu mã PIN nữa)"""
    item_id = sample_waiter_data["ct_cho_nau_id"]
    # Gọi chỉnh qty = 0 (tương đương xóa)
    res = await client.post(f"/waiter/items/{item_id}/void", json={"pin": "", "new_quantity": 0})
    assert res.status_code == 200
    
    # DB nên xóa luôn ct
    from app.models.order import ChiTietPhieu
    ct = await db_session.get(ChiTietPhieu, item_id)
    assert ct is None
