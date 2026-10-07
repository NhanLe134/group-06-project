"""US-08 — Đối soát tồn kho & đóng ca.

Mỗi test ghi AC/quy tắc được kiểm chứng (story-spec-us08-inventory.md, mục Test plan).
"""

from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChiTietMon, HoaDon, NguoiDung, PhienBan, ThucDon

PIN = "1234"


async def _setup(db: AsyncSession, stock: int = 50):
    """Trà đá đếm số lượng (tồn `stock`), Phở bò không đếm; 1 Quản lý + 1 Thu ngân có PIN."""
    tra = ThucDon(tenmon="Trà đá", phanloai="Đồ uống", giaban=5000, soluongton=stock)
    pho = ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000)
    ql = NguoiDung(hoten="Quản lý Lan", vaitro="QUAN_LY", mapin=PIN)
    tn = NguoiDung(hoten="Thu ngân Minh", vaitro="THU_NGAN", mapin="9999")
    db.add_all([tra, pho, ql, tn])
    await db.commit()
    return tra, pho


async def _order(db: AsyncSession, mon: ThucDon, qty: int, *, when=None, trangthai="da_xong"):
    phien = PhienBan(tenban="Bàn 01")
    db.add(phien)
    await db.flush()
    hd = HoaDon(phienban_id=phien.id, trangthai="da_chot")
    db.add(hd)
    await db.flush()
    item = ChiTietMon(hoadon_id=hd.id, thucdon_id=mon.id, soluong=qty, trangthai=trangthai)
    if when is not None:
        item.giogoimon = when
    # Gửi bếp trừ `soluongton` ngay (story-spec-tru-kho-tu-dong.md); món hủy đã được hoàn kho.
    # Đơn ngoài kỳ (`when`) coi như đã trừ trước khi kỳ bắt đầu → `stock` của _setup là tồn đầu kỳ.
    if mon.soluongton is not None and trangthai != "da_huy" and when is None:
        mon.soluongton -= qty
    db.add(item)
    await db.commit()


def _line(body: dict, name: str) -> dict:
    return next(line for line in body["lines"] if line["tenmon"] == name)


async def test_create_shift_snapshots_only_tracked_items_and_counts_sold(
    client: AsyncClient, db_session: AsyncSession
):
    """AC1: phiếu chỉ gồm món đếm số lượng; B = đã bán trong kỳ (bỏ món hủy, món ngoài kỳ);
    C = A - B."""
    tra, pho = await _setup(db_session, stock=50)
    await _order(db_session, tra, 2)
    await _order(db_session, tra, 5, trangthai="da_huy")  # món hủy không tính
    await _order(
        db_session, tra, 7, when=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=2)
    )
    await _order(db_session, pho, 3)  # món không đếm số lượng

    resp = await client.post("/inventory/shifts")

    assert resp.status_code == 201
    body = resp.json()
    assert body["trangthai"] == "nhap" and body["maphieu"].startswith("PKK-")
    assert [line["tenmon"] for line in body["lines"]] == ["Trà đá"]
    line = _line(body, "Trà đá")
    assert (line["tondauca"], line["daban"], line["tonlythuyet"]) == (50, 2, 48)


async def test_only_one_draft_at_a_time(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    assert (await client.post("/inventory/shifts")).status_code == 201
    resp = await client.post("/inventory/shifts")
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "SHIFT_DRAFT_EXISTS"


async def test_create_shift_requires_tracked_items(client: AsyncClient, db_session: AsyncSession):
    db_session.add(ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000))
    await db_session.commit()
    resp = await client.post("/inventory/shifts")
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "NO_TRACKED_ITEMS"


async def test_save_lines_computes_loss(client: AsyncClient, db_session: AsyncSession):
    """AC2: tồn lý thuyết 5, thực tế 4 → chênh lệch -1 (hao hụt 1)."""
    tra, _ = await _setup(db_session, stock=5)
    shift = (await client.post("/inventory/shifts")).json()

    resp = await client.put(
        f"/inventory/shifts/{shift['id']}/lines",
        json={"lines": [{"thucdon_id": str(tra.id), "tonthucte": 4}]},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert _line(body, "Trà đá")["chenhlech"] == -1
    assert (body["so_mon_hao_hut"], body["tong_hao_hut"]) == (1, 1)


async def test_close_requires_actual_stock(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    shift = (await client.post("/inventory/shifts")).json()
    resp = await client.post(
        f"/inventory/shifts/{shift['id']}/close", json={"lines": [], "manager_pin": PIN}
    )
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "ACTUAL_STOCK_MISSING"


async def test_close_rejects_loss_without_reason(client: AsyncClient, db_session: AsyncSession):
    """AC4: hao hụt mà bỏ trống lý do → chặn, chỉ ra đúng món vi phạm."""
    tra, _ = await _setup(db_session, stock=5)
    shift = (await client.post("/inventory/shifts")).json()

    resp = await client.post(
        f"/inventory/shifts/{shift['id']}/close",
        json={
            "lines": [{"thucdon_id": str(tra.id), "tonthucte": 4, "lydo": "  "}],
            "manager_pin": PIN,
        },
    )

    assert resp.status_code == 422
    body = resp.json()
    assert body["error_code"] == "LOSS_REASON_REQUIRED"
    assert body["details"] == [{"thucdon_id": str(tra.id), "tenmon": "Trà đá"}]
    assert (await client.get(f"/inventory/shifts/{shift['id']}")).json()["trangthai"] == "nhap"


async def test_close_rejects_wrong_or_non_manager_pin(
    client: AsyncClient, db_session: AsyncSession
):
    """AC5: chỉ PIN của tài khoản QUAN_LY được chốt ca (PIN Thu ngân cũng bị từ chối)."""
    tra, _ = await _setup(db_session, stock=5)
    shift = (await client.post("/inventory/shifts")).json()
    lines = [{"thucdon_id": str(tra.id), "tonthucte": 5}]

    for pin in ["0000", "9999"]:
        resp = await client.post(
            f"/inventory/shifts/{shift['id']}/close", json={"lines": lines, "manager_pin": pin}
        )
        assert resp.status_code == 403
        assert resp.json()["error_code"] == "INVALID_MANAGER_PIN"


async def test_close_locks_shift_and_rolls_actual_into_next_opening(
    client: AsyncClient, db_session: AsyncSession
):
    """AC3: chốt ca → lưu số liệu, ghi người chốt, tồn thực tế thành soluongton (tồn đầu ca sau)."""
    tra, _ = await _setup(db_session, stock=5)
    await _order(db_session, tra, 1)
    shift = (await client.post("/inventory/shifts")).json()

    resp = await client.post(
        f"/inventory/shifts/{shift['id']}/close",
        json={
            "lines": [{"thucdon_id": str(tra.id), "tonthucte": 3, "lydo": "Vỡ 1 chai"}],
            "manager_pin": PIN,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["trangthai"] == "da_chot" and body["nguoichot"] == "Quản lý Lan"
    assert body["giochot"] is not None
    line = _line(body, "Trà đá")
    assert (line["tondauca"], line["daban"], line["tonlythuyet"]) == (5, 1, 4)
    assert (line["tonthucte"], line["chenhlech"], line["lydo"]) == (3, -1, "Vỡ 1 chai")
    await db_session.refresh(tra)
    assert tra.soluongton == 3

    nxt = (await client.post("/inventory/shifts")).json()
    assert nxt["tuluc"] == body["giochot"]  # kỳ mới bắt đầu từ giờ chốt ca trước
    assert _line(nxt, "Trà đá")["tondauca"] == 3


async def test_closed_shift_is_read_only(client: AsyncClient, db_session: AsyncSession):
    """BR-07: phiếu đã chốt không sửa, không chốt lại, không xóa."""
    tra, _ = await _setup(db_session, stock=5)
    shift = (await client.post("/inventory/shifts")).json()
    lines = [{"thucdon_id": str(tra.id), "tonthucte": 5}]
    await client.post(
        f"/inventory/shifts/{shift['id']}/close", json={"lines": lines, "manager_pin": PIN}
    )

    for resp in [
        await client.put(f"/inventory/shifts/{shift['id']}/lines", json={"lines": lines}),
        await client.post(
            f"/inventory/shifts/{shift['id']}/close", json={"lines": lines, "manager_pin": PIN}
        ),
        await client.delete(f"/inventory/shifts/{shift['id']}"),
    ]:
        assert resp.status_code == 409
        assert resp.json()["error_code"] == "SHIFT_CLOSED"


async def test_close_with_zero_stock_marks_menu_out_of_stock(
    client: AsyncClient, db_session: AsyncSession
):
    """Kiểm kê thấy hết sạch → món tự thành Hết hàng trên E-Menu."""
    tra, _ = await _setup(db_session, stock=2)
    shift = (await client.post("/inventory/shifts")).json()
    await client.post(
        f"/inventory/shifts/{shift['id']}/close",
        json={
            "lines": [{"thucdon_id": str(tra.id), "tonthucte": 0, "lydo": "Bán ngoài hệ thống"}],
            "manager_pin": PIN,
        },
    )
    menu = {m["name"]: m for m in (await client.get("/menu")).json()}
    assert (menu["Trà đá"]["stock"], menu["Trà đá"]["status"]) == (0, "out_of_stock")


async def test_list_and_delete_draft(client: AsyncClient, db_session: AsyncSession):
    await _setup(db_session)
    shift = (await client.post("/inventory/shifts")).json()

    listed = (await client.get("/inventory/shifts")).json()
    assert [s["maphieu"] for s in listed] == [shift["maphieu"]]
    assert "lines" not in listed[0]

    assert (await client.delete(f"/inventory/shifts/{shift['id']}")).status_code == 204
    resp = await client.get(f"/inventory/shifts/{shift['id']}")
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "SHIFT_NOT_FOUND"


async def test_save_lines_rejects_negative_and_unknown_items(
    client: AsyncClient, db_session: AsyncSession
):
    _, pho = await _setup(db_session)
    shift = (await client.post("/inventory/shifts")).json()
    url = f"/inventory/shifts/{shift['id']}/lines"

    assert (
        await client.put(url, json={"lines": [{"thucdon_id": str(pho.id), "tonthucte": -1}]})
    ).status_code == 422
    resp = await client.put(url, json={"lines": [{"thucdon_id": str(pho.id), "tonthucte": 1}]})
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "UNKNOWN_ITEM"
