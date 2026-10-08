"""Trừ kho tự động theo công thức — vault/06-Engineering/story-spec-tru-kho-tu-dong.md Mục 5.

Mỗi test ghi AC được kiểm chứng.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ThucDon
from app.ws.manager import manager

pytestmark = pytest.mark.asyncio


@pytest.fixture
def published(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, str, dict]]:
    sent: list[tuple[str, str, dict]] = []

    async def fake_publish(channel, event, payload):
        sent.append((channel, event, payload))

    monkeypatch.setattr(manager, "publish", fake_publish)
    return sent


async def _ingredient(client: AsyncClient, name: str, stock: float, unit: str = "kg") -> str:
    resp = await client.post(
        "/inventory/ingredients", json={"name": name, "unit": unit, "stock": stock}
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _dish(db: AsyncSession, name: str, phanloai: str = "Món chính", **kw) -> ThucDon:
    # POST /orders yêu cầu bàn đã seed trong bảng master `ban`
    from sqlalchemy import select as _select

    from app.models.order import Ban

    if not (await db.execute(_select(Ban).where(Ban.tenban == "Bàn 01"))).scalars().first():
        for i in range(1, 7):
            db.add(Ban(tenban=f"Bàn {i:02d}", trangthai=1))
        await db.commit()
    mon = ThucDon(tenmon=name, phanloai=phanloai, giaban=80000, **kw)
    db.add(mon)
    await db.commit()
    return mon


async def _recipe(client: AsyncClient, mon: ThucDon, **lines: float) -> dict:
    resp = await client.put(
        f"/menu/items/{mon.id}/recipe",
        json={"lines": [{"ingredient_id": i, "quantity": q} for i, q in lines.items()]},
    )
    assert resp.status_code == 200
    return resp.json()


async def _order(client: AsyncClient, mon: ThucDon, qty: int, table: str = "Bàn 01"):
    return await client.post(
        "/orders", json={"table_name": table, "items": [{"thucdon_id": mon.id, "soluong": qty}]}
    )


async def _stock(client: AsyncClient, ingredient_id: str) -> float:
    rows = (await client.get("/inventory/ingredients")).json()
    return next(r["stock"] for r in rows if r["id"] == ingredient_id)


async def _menu(client: AsyncClient, mon: ThucDon) -> dict:
    return next(m for m in (await client.get("/menu")).json() if m["id"] == mon.id)


async def test_order_deducts_ingredients_and_reports_portions(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC1: Bò xào cần 0.2 kg bò, kho 1 kg; gửi bếp 2 phần → kho còn 0.6 kg, còn 3 phần."""
    bo = await _ingredient(client, "Thịt bò", 1)
    mon = await _dish(db_session, "Bò xào")
    recipe = await _recipe(client, mon, **{bo: 0.2})
    assert recipe["portions"] == 5

    assert (await _order(client, mon, 2)).status_code == 200

    assert await _stock(client, bo) == pytest.approx(0.6)
    item = await _menu(client, mon)
    assert (item["portions"], item["status"]) == (3, "available")


async def test_order_rejected_when_not_enough_and_nothing_deducted(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC2: kho bò còn 0.3 kg, gửi 2 phần (cần 0.4) → 409, kho không đổi, không tạo đơn."""
    bo = await _ingredient(client, "Thịt bò", 0.3)
    mon = await _dish(db_session, "Bò xào")
    await _recipe(client, mon, **{bo: 0.2})

    resp = await _order(client, mon, 2)

    assert resp.status_code == 409
    body = resp.json()
    assert body["error_code"] == "ITEM_OUT_OF_STOCK"
    assert body["details"] == [{"thucdon_id": mon.id, "tenmon": "Bò xào", "con_lai": 1}]
    assert await _stock(client, bo) == pytest.approx(0.3)
    assert (await client.get("/orders/current", params={"table_name": "Bàn 01"})).status_code == 404


async def test_running_out_locks_every_dish_sharing_the_ingredient(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC3: kho bò về dưới định lượng → Bò xào VÀ Bò sốt tiêu (dùng chung bò) cùng hết hàng,
    phát ITEM_OOS_BROADCAST cho cả hai."""
    bo = await _ingredient(client, "Thịt bò", 0.5)
    xao = await _dish(db_session, "Bò xào")
    sot = await _dish(db_session, "Bò sốt tiêu")
    await _recipe(client, xao, **{bo: 0.2})
    await _recipe(client, sot, **{bo: 0.3})

    assert (await _order(client, xao, 2)).status_code == 200  # còn 0.1 kg

    assert (await _menu(client, xao))["status"] == "out_of_stock"
    assert (await _menu(client, sot))["status"] == "out_of_stock"
    oos = {p["menu_item_id"] for ch, ev, p in published if ev == "ITEM_OOS_BROADCAST"}
    assert oos == {xao.id, sot.id}
    assert all(ch == "menu:oos" for ch, ev, _ in published if ev == "ITEM_OOS_BROADCAST")


async def test_kitchen_cancel_returns_stock(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC4: bếp báo hết rồi xóa món chờ nấu → cộng trả nguyên liệu (món nấu)
    và soluongton (đồ uống)."""
    bo = await _ingredient(client, "Thịt bò", 1)
    mon = await _dish(db_session, "Bò xào")
    coca = await _dish(db_session, "Coca", phanloai="Đồ uống", soluongton=10)
    await _recipe(client, mon, **{bo: 0.2})
    items = (
        await client.post(
            "/orders",
            json={
                "table_name": "Bàn 01",
                "items": [
                    {"thucdon_id": mon.id, "soluong": 2},
                    {"thucdon_id": coca.id, "soluong": 3},
                ],
            },
        )
    ).json()["items"]
    assert await _stock(client, bo) == pytest.approx(0.6)
    assert (await _menu(client, coca))["stock"] == 7

    for dish, item in zip((mon, coca), items, strict=True):
        assert (await client.post(f"/menu/items/{dish.id}/out-of-stock")).status_code == 200
        resp = await client.post(f"/kds/items/{item['id']}/cancel-out-of-stock")
        assert resp.status_code == 200 and resp.json()["trangthai"] == "da_huy"

    assert await _stock(client, bo) == pytest.approx(1.0)
    assert (await _menu(client, coca))["stock"] == 10


async def test_drink_count_goes_down_on_order(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC5: đồ uống soluongton = 24, gửi bếp 5 lon → còn 19; gửi quá số còn → 409."""
    coca = await _dish(db_session, "Coca", phanloai="Đồ uống", soluongton=24)

    assert (await _order(client, coca, 5)).status_code == 200
    item = await _menu(client, coca)
    assert (item["stock"], item["portions"]) == (19, 19)

    resp = await _order(client, coca, 20, table="Bàn 02")
    assert resp.status_code == 409 and resp.json()["details"][0]["con_lai"] == 19


async def test_reopen_rejected_while_ingredient_is_empty(
    client: AsyncClient, db_session: AsyncSession, published
):
    """Mục 3: hết nguyên liệu thì "Mở bán lại" bị từ chối cho tới khi nhập thêm hàng."""
    bo = await _ingredient(client, "Thịt bò", 0.1)
    mon = await _dish(db_session, "Bò xào")
    await _recipe(client, mon, **{bo: 0.2})

    resp = await client.post(f"/menu/items/{mon.id}/in-stock")
    assert resp.status_code == 409 and resp.json()["error_code"] == "STOCK_EMPTY"

    resp = await client.put(f"/inventory/ingredients/{bo}", json={"stock": 2})
    assert resp.status_code == 200
    assert (await _menu(client, mon))["status"] == "available"
    assert any(p["menu_item_id"] == mon.id for _, ev, p in published if ev == "ITEM_OOS_BROADCAST")


async def test_delete_ingredient_in_use_rejected(
    client: AsyncClient, db_session: AsyncSession, published
):
    """AC7: nguyên liệu đang có trong công thức thì không xóa được; chưa dùng thì xóa được."""
    bo = await _ingredient(client, "Thịt bò", 1)
    hanh = await _ingredient(client, "Hành lá", 1)
    mon = await _dish(db_session, "Bò xào")
    await _recipe(client, mon, **{bo: 0.2})

    resp = await client.delete(f"/inventory/ingredients/{bo}")
    assert resp.status_code == 409 and resp.json()["error_code"] == "INGREDIENT_IN_USE"
    assert (await client.delete(f"/inventory/ingredients/{hanh}")).status_code == 204


async def test_recipe_validation_and_replace(
    client: AsyncClient, db_session: AsyncSession, published
):
    """Công thức: trùng nguyên liệu → 422, nguyên liệu không tồn tại → 404, PUT thay toàn bộ."""
    bo = await _ingredient(client, "Thịt bò", 1)
    can = await _ingredient(client, "Cần tây", 3)
    mon = await _dish(db_session, "Bò xào cần")
    url = f"/menu/items/{mon.id}/recipe"

    dup = {"lines": [{"ingredient_id": bo, "quantity": 0.2}, {"ingredient_id": bo, "quantity": 1}]}
    assert (await client.put(url, json=dup)).status_code == 422
    bad = {"lines": [{"ingredient_id": "NL-KHONG-CO", "quantity": 0.2}]}
    assert (await client.put(url, json=bad)).status_code == 404

    await _recipe(client, mon, **{bo: 0.2, can: 0.1})
    recipe = await _recipe(client, mon, **{can: 0.5})  # thay hẳn, bỏ dòng bò
    assert [line["ingredient_name"] for line in recipe["lines"]] == ["Cần tây"]
    assert recipe["portions"] == 6
    assert (await client.get(url)).json() == recipe


async def test_each_dish_counts_by_quantity_or_recipe_regardless_of_category(
    client: AsyncClient, db_session: AsyncSession, published
):
    """Phương án A (Nhã 2026-10-07): cách tính tồn theo TỪNG MÓN, không theo phân loại.
    Cùng là Tráng miệng: sữa chua hũ mua sẵn (có soluongton) đếm số lượng và KHÔNG trừ nguyên liệu
    dù có công thức; chè tự nấu (soluongton NULL) trừ nguyên liệu theo công thức."""
    duong = await _ingredient(client, "Đường", 1)
    sua_chua = await _dish(db_session, "Sữa chua hũ", phanloai="Tráng miệng", soluongton=50)
    che = await _dish(db_session, "Chè đậu đen", phanloai="Tráng miệng")
    assert (await _menu(client, che))["portions"] is None  # chế biến, chưa có công thức
    await _recipe(client, sua_chua, **{duong: 0.5})  # công thức bị bỏ qua vì món mua sẵn
    await _recipe(client, che, **{duong: 0.1})

    resp = await client.post(
        "/orders",
        json={
            "table_name": "Bàn 01",
            "items": [
                {"thucdon_id": sua_chua.id, "soluong": 4},
                {"thucdon_id": che.id, "soluong": 3},
            ],
        },
    )
    assert resp.status_code == 200

    item = await _menu(client, sua_chua)
    assert (item["stock"], item["portions"]) == (46, 46)
    assert await _stock(client, duong) == pytest.approx(0.7)  # chỉ chè trừ đường
    assert (await _menu(client, che))["portions"] == 7


async def test_boundary_inputs_rejected_and_stock_untouched(
    client: AsyncClient, db_session: AsyncSession, published
):
    """TC-OP-KDS-015 (§11.3 boundary/invalid): số lượng 0, tồn âm, định lượng 0 → 422;
    kho không bị trừ."""
    bo = await _ingredient(client, "Thịt bò", 1)
    mon = await _dish(db_session, "Bò xào")
    await _recipe(client, mon, **{bo: 0.2})

    assert (await _order(client, mon, 0)).status_code == 422
    resp = await client.post(
        "/inventory/ingredients", json={"name": "Tôm", "unit": "kg", "stock": -1}
    )
    assert resp.status_code == 422
    resp = await client.put(
        f"/menu/items/{mon.id}/recipe", json={"lines": [{"ingredient_id": bo, "quantity": 0}]}
    )
    assert resp.status_code == 422
    assert await _stock(client, bo) == pytest.approx(1.0)


async def test_exact_last_portion_then_next_order_rejected(
    client: AsyncClient, db_session: AsyncSession, published
):
    """TC-OP-005 (tuần tự): đủ đúng 1 phần cuối → bán được; đơn tiếp theo 409, kho không âm.
    Bản chạy đồng thời trên Postgres: tests/pg/test_race_last_portion.py."""
    bo = await _ingredient(client, "Thịt bò", 0.2)
    mon = await _dish(db_session, "Bò xào")
    await _recipe(client, mon, **{bo: 0.2})

    assert (await _order(client, mon, 1, table="Bàn 01")).status_code == 200
    resp = await _order(client, mon, 1, table="Bàn 02")
    assert resp.status_code == 409 and resp.json()["error_code"] == "ITEM_OUT_OF_STOCK"
    assert await _stock(client, bo) == pytest.approx(0.0)
