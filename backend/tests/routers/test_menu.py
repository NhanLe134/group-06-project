from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import ThucDon
from app.ws.manager import MENU_OOS_CHANNEL, manager


async def test_list_menu_items_empty(client: AsyncClient):
    """GIVEN chua co mon nao, WHEN GET /menu, THEN tra ve list rong."""
    resp = await client.get("/menu")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_menu_items_maps_thucdon_to_api_fields(
    client: AsyncClient, db_session: AsyncSession
):
    """GIVEN 1 mon trong bang thucdon, WHEN GET /menu,
    THEN tra ve dung ten truong API (name, price...)."""
    db_session.add(ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000))
    await db_session.commit()

    resp = await client.get("/menu")

    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Phở bò tái lăn"
    assert body[0]["price"] == 65000
    assert body[0]["category"] == "Món chính"
    assert body[0]["status"] == "available"
    assert body[0]["bestseller"] is False  # banchay NULL → không phải món bán chạy


async def test_menu_item_out_of_stock_when_trangthaiban_false(
    client: AsyncClient, db_session: AsyncSession
):
    """GIVEN mon co trangthaiban = false (Bep bao Het hang - REQ-09), WHEN GET /menu,
    THEN status = out_of_stock de E-Menu lam mo mon."""
    db_session.add(
        ThucDon(tenmon="Bò sốt tiêu đen", phanloai="Món chính", giaban=120000, trangthaiban=False)
    )
    await db_session.commit()

    resp = await client.get("/menu")

    body = resp.json()[0]
    assert body["status"] == "out_of_stock"
    # ADR-N11: trangthaiban = false → listed = false → E-Menu ẨN món (không chỉ làm mờ)
    assert body["listed"] is False


async def test_menu_item_het_ton_nhung_van_ban_co_listed(
    client: AsyncClient, db_session: AsyncSession
):
    """ADR-N11: trangthaiban = true + soluongton = 0 → món VẪN HIỂN trên E-Menu
    (listed = true) với status out_of_stock để render xám "Hết hàng"."""
    from app.models.menu import ThucDon, true

    db_session.add(
        ThucDon(tenmon="Trà đá", phanloai="Đồ uống", giaban=5000, trangthaiban=true(), soluongton=0)
    )
    await db_session.commit()

    resp = await client.get("/menu")

    body = resp.json()[0]
    assert body["status"] == "out_of_stock"
    assert body["listed"] is True


async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_health_db_ok(client: AsyncClient):
    """GIVEN backend ket noi duoc DB, WHEN GET /health/db, THEN tra ve database ok."""
    resp = await client.get("/health/db")
    assert resp.status_code == 200
    assert resp.json() == {"database": "ok"}


async def _drink(db_session: AsyncSession, stock: int | None) -> ThucDon:
    mon = ThucDon(tenmon="Trà đá", phanloai="Đồ uống", giaban=5000, soluongton=stock)
    db_session.add(mon)
    await db_session.commit()
    return mon


async def test_menu_returns_stock_and_null_for_untracked_items(
    client: AsyncClient, db_session: AsyncSession
):
    """GIVEN đồ uống có soluongton = 24 và món nấu không đếm số lượng,
    WHEN GET /menu, THEN stock = 24 / null, cả hai đều đang bán."""
    await _drink(db_session, 24)
    db_session.add(ThucDon(tenmon="Phở bò tái lăn", phanloai="Món chính", giaban=65000))
    await db_session.commit()

    body = {m["name"]: m for m in (await client.get("/menu")).json()}

    assert (body["Trà đá"]["stock"], body["Trà đá"]["status"]) == (24, "available")
    assert (body["Phở bò tái lăn"]["stock"], body["Phở bò tái lăn"]["status"]) == (
        None,
        "available",
    )


async def test_stock_zero_means_out_of_stock(client: AsyncClient, db_session: AsyncSession):
    """GIVEN đồ uống còn 3, WHEN đặt tồn = 0, THEN món thành Hết hàng; nhập lại 12 thì bán lại."""
    mon = await _drink(db_session, 3)

    resp = await client.patch(f"/menu/items/{mon.id}/stock", json={"stock": 0})
    assert resp.status_code == 200
    assert (resp.json()["stock"], resp.json()["status"]) == (0, "out_of_stock")

    resp = await client.patch(f"/menu/items/{mon.id}/stock", json={"stock": 12})
    assert (resp.json()["stock"], resp.json()["status"]) == (12, "available")


async def test_stock_rejects_negative(client: AsyncClient, db_session: AsyncSession):
    mon = await _drink(db_session, 3)
    resp = await client.patch(f"/menu/items/{mon.id}/stock", json={"stock": -1})
    assert resp.status_code == 422


async def test_stock_null_turns_item_untracked(client: AsyncClient, db_session: AsyncSession):
    mon = await _drink(db_session, 0)
    resp = await client.patch(f"/menu/items/{mon.id}/stock", json={"stock": None})
    assert (resp.json()["stock"], resp.json()["status"]) == (None, "available")


async def test_in_stock_rejected_when_count_is_zero(client: AsyncClient, db_session: AsyncSession):
    """Mở bán lại đồ uống đã hết số lượng mà chưa nhập thêm → 409 STOCK_EMPTY."""
    mon = await _drink(db_session, 0)
    resp = await client.post(f"/menu/items/{mon.id}/in-stock")
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "STOCK_EMPTY"


async def test_update_stock_404(client: AsyncClient):
    resp = await client.patch("/menu/items/KHONG-TON-TAI/stock", json={"stock": 5})
    assert resp.status_code == 404


async def test_api_list_menu_items_empty(client: AsyncClient):
    """GET /api/menu returns an empty collection when the catalog has no items."""
    resp = await client.get("/api/menu")

    assert resp.status_code == 200
    assert resp.json() == []


async def test_api_list_menu_items_filters_category_and_availability(
    client: AsyncClient, db_session: AsyncSession
):
    """Category and availability query parameters are applied together."""
    db_session.add_all(
        [
            ThucDon(tenmon="Bò xào", phanloai="Món chính", giaban=85000),
            ThucDon(
                tenmon="Bò sốt tiêu", phanloai="Món chính", giaban=120000,
                trangthaiban=False,
            ),
            ThucDon(tenmon="Coca", phanloai="Đồ uống", giaban=15000),
        ]
    )
    await db_session.commit()

    available = await client.get(
        "/api/menu", params={"category": "Món chính", "is_available": "true"}
    )
    unavailable = await client.get(
        "/api/menu", params={"category": "Món chính", "is_available": "false"}
    )

    assert available.status_code == unavailable.status_code == 200
    assert [item["name"] for item in available.json()] == ["Bò xào"]
    assert [item["name"] for item in unavailable.json()] == ["Bò sốt tiêu"]


async def test_api_get_menu_item_returns_not_found_error(client: AsyncClient):
    resp = await client.get("/api/menu/UNKNOWN")

    assert resp.status_code == 404
    assert resp.json()["error_code"] == "MENU_ITEM_NOT_FOUND"


async def test_api_create_menu_item_maps_all_fields(
    client: AsyncClient, db_session: AsyncSession
):
    payload = {
        "name": "Bún chả Hà Nội",
        "description": "Bún chả nướng ăn kèm rau sống",
        "price": 55000,
        "category": "Món chính",
        "image_url": "https://example.test/bun-cha.jpg",
        "is_available": True,
        "stock": None,
        "ingredients": "Thịt heo, bún, rau sống",
        "spicy": "Không cay",
        "diet": "Mặn",
        "allergens": "Đậu nành",
    }

    resp = await client.post("/api/menu", json=payload)

    assert resp.status_code == 201
    body = resp.json()
    assert body["id"]
    assert {key: body[key] for key in payload} == payload
    saved = await db_session.get(ThucDon, body["id"])
    assert saved is not None
    assert saved.tenmon == payload["name"]
    assert saved.thongtindiung == payload["allergens"]


async def test_api_create_menu_item_rejects_invalid_required_fields(client: AsyncClient):
    resp = await client.post(
        "/api/menu",
        json={"name": "", "price": 0, "category": ""},
    )

    assert resp.status_code == 422


async def test_api_update_menu_item_changes_only_submitted_fields(
    client: AsyncClient, db_session: AsyncSession
):
    mon = ThucDon(
        tenmon="Coca",
        phanloai="Đồ uống",
        giaban=15000,
        mota="Nước ngọt có gas",
        thanhphan="Nước, đường",
    )
    db_session.add(mon)
    await db_session.commit()

    resp = await client.put(f"/api/menu/{mon.id}", json={"price": 18000})

    assert resp.status_code == 200
    assert resp.json()["price"] == 18000
    assert resp.json()["name"] == "Coca"
    assert resp.json()["description"] == "Nước ngọt có gas"
    assert resp.json()["ingredients"] == "Nước, đường"
    await db_session.refresh(mon)
    assert (mon.tenmon, mon.giaban, mon.mota) == ("Coca", 18000, "Nước ngọt có gas")


async def test_api_update_availability_broadcasts_status_change(
    client: AsyncClient, db_session: AsyncSession, monkeypatch
):
    mon = ThucDon(tenmon="Khoai tây chiên", phanloai="Khai vị", giaban=40000)
    db_session.add(mon)
    await db_session.commit()
    published = []

    async def fake_publish(channel, event, payload):
        published.append((channel, event, payload))

    monkeypatch.setattr(manager, "publish", fake_publish)

    resp = await client.put(f"/api/menu/{mon.id}", json={"is_available": False})

    assert resp.status_code == 200
    assert resp.json()["is_available"] is False
    assert len(published) == 1
    channel, event, payload = published[0]
    assert (channel, event) == (MENU_OOS_CHANNEL, "ITEM_OOS_BROADCAST")
    assert payload["menu_item_id"] == mon.id
    assert payload["menu_item_name"] == "Khoai tây chiên"
    assert payload["status"] == "out_of_stock"


async def test_api_update_menu_item_not_found(client: AsyncClient):
    resp = await client.put("/api/menu/UNKNOWN", json={"price": 10000})

    assert resp.status_code == 404
    assert resp.json()["error_code"] == "MENU_ITEM_NOT_FOUND"


async def test_api_update_stock_validates_and_updates_availability(
    client: AsyncClient, db_session: AsyncSession, monkeypatch
):
    mon = ThucDon(tenmon="Coca", phanloai="Đồ uống", giaban=15000, soluongton=3)
    db_session.add(mon)
    await db_session.commit()

    async def fake_publish(channel, event, payload):
        return None

    monkeypatch.setattr(manager, "publish", fake_publish)

    empty = await client.patch(f"/api/menu/items/{mon.id}/stock", json={"stock": 0})
    assert empty.status_code == 200
    assert (empty.json()["stock"], empty.json()["is_available"]) == (0, False)

    restocked = await client.patch(f"/api/menu/items/{mon.id}/stock", json={"stock": 12})
    assert restocked.status_code == 200
    assert (restocked.json()["stock"], restocked.json()["is_available"]) == (12, True)

    invalid = await client.patch(f"/api/menu/items/{mon.id}/stock", json={"stock": -1})
    assert invalid.status_code == 422


async def test_api_delete_menu_item_returns_no_content_and_404(
    client: AsyncClient, db_session: AsyncSession
):
    mon = ThucDon(tenmon="Sữa chua", phanloai="Tráng miệng", giaban=25000)
    db_session.add(mon)
    await db_session.commit()

    deleted = await client.delete(f"/api/menu/{mon.id}")
    missing = await client.delete(f"/api/menu/{mon.id}")

    assert deleted.status_code == 204
    assert deleted.content == b""
    assert missing.status_code == 404
    assert missing.json()["error_code"] == "MENU_ITEM_NOT_FOUND"
