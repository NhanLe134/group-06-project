"""API tests for the voice transcript interpretation endpoints.

Gemini is stubbed so these tests exercise the HTTP contract and deterministic
menu/draft rules without making network calls or depending on an API key.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import ThucDon
from app.services import voice as voice_service

VOICE_ENDPOINTS = ("/voice/interpret", "/api/v1/ai/voice-parse")


@pytest.fixture(autouse=True)
def use_rule_based_voice_fallback(monkeypatch: pytest.MonkeyPatch):
    async def no_gemini(*args, **kwargs):
        return None

    monkeypatch.setattr(voice_service, "_gemini_interpret", no_gemini)


async def _dish(
    db_session: AsyncSession,
    name: str,
    *,
    category: str = "Món chính",
    price: int = 65000,
    **fields,
) -> ThucDon:
    dish = ThucDon(tenmon=name, phanloai=category, giaban=price, **fields)
    db_session.add(dish)
    await db_session.commit()
    return dish


@pytest.mark.parametrize("endpoint", VOICE_ENDPOINTS)
async def test_voice_endpoint_parses_order_and_modifier(
    client: AsyncClient, db_session: AsyncSession, endpoint: str
):
    dish = await _dish(db_session, "Bún chả Hà Nội", price=55000)

    resp = await client.post(
        endpoint,
        json={"transcript": "Cho tôi 2 Bún chả Hà Nội không hành"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["transcript"] == "Cho tôi 2 Bún chả Hà Nội không hành"
    assert body["intent"] == "order"
    assert body["adds"] == [
        {"id": dish.id, "name": "Bún chả Hà Nội", "qty": 2, "note": "Không hành", "price": 55000}
    ]
    assert body["not_found"] == []
    assert "Không hành" in body["message"]


@pytest.mark.parametrize("endpoint", VOICE_ENDPOINTS)
async def test_voice_endpoint_validates_missing_or_blank_transcript(
    client: AsyncClient, endpoint: str
):
    missing = await client.post(endpoint, json={})
    blank = await client.post(endpoint, json={"transcript": "   "})

    assert missing.status_code == 422
    assert blank.status_code == 422


async def test_voice_endpoint_rejects_invalid_draft_quantity(client: AsyncClient):
    resp = await client.post(
        "/api/v1/ai/voice-parse",
        json={"transcript": "Xóa món này", "draft": [{"item_id": "MON-1", "quantity": 0}]},
    )

    assert resp.status_code == 422


async def test_voice_endpoint_asks_for_quantity_when_customer_omits_it(
    client: AsyncClient, db_session: AsyncSession
):
    dish = await _dish(db_session, "Phở bò tái lăn")

    resp = await client.post("/voice/interpret", json={"transcript": "Cho tôi Phở bò tái lăn"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "unknown"
    assert body["adds"] == []
    assert body["needs_quantity_for"] == {"item_id": dish.id, "item_name": dish.tenmon}


async def test_voice_endpoint_reports_requested_quantity_over_stock(
    client: AsyncClient, db_session: AsyncSession
):
    dish = await _dish(
        db_session, "Coca", category="Đồ uống", price=15000, soluongton=2
    )

    resp = await client.post(
        "/api/v1/ai/voice-parse", json={"transcript": "Cho 3 Coca"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["adds"] == []
    assert body["stock_limits"] == [
        {"item_id": dish.id, "item_name": "Coca", "requested": 3, "available": 2}
    ]
    assert "chỉ còn 2 phần Coca" in body["message"]


async def test_voice_endpoint_recommends_available_beverages_only(
    client: AsyncClient, db_session: AsyncSession
):
    coca = await _dish(db_session, "Coca", category="Đồ uống", price=15000)
    await _dish(db_session, "Trà đá", category="Đồ uống", price=10000, soluongton=0)
    appetizer = await _dish(db_session, "Khoai tây chiên", category="Khai vị", price=40000)
    await _dish(db_session, "Phở bò", category="Món chính", price=65000)

    resp = await client.post(
        "/voice/interpret", json={"transcript": "Quán có nước uống gì?"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    assert [item["id"] for item in body["recommendations"]] == [coca.id, appetizer.id]
    assert "Coca" in body["message"]
    assert "Trà đá" not in body["message"]
    assert "Khoai tây chiên" in body["message"]


async def test_voice_endpoint_soup_search_excludes_beverages(
    client: AsyncClient, db_session: AsyncSession
):
    pho = await _dish(
        db_session,
        "Phở bò",
        price=65000,
        mota="Phở nóng với nước dùng bò",
    )
    await _dish(db_session, "Coca", category="Đồ uống", price=15000)

    resp = await client.post(
        "/api/v1/ai/voice-parse", json={"transcript": "Quán có món súp gì không?"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    assert [item["id"] for item in body["recommendations"]] == [pho.id]
    assert "Phở bò" in body["message"]
    assert "Coca" not in body["message"]


async def test_voice_endpoint_warns_about_allergen_in_draft_and_requests_confirmation(
    client: AsyncClient, db_session: AsyncSession
):
    dish = await _dish(
        db_session,
        "Bò xào",
        thanhphan="Thịt bò, đậu phộng",
    )

    resp = await client.post(
        "/voice/interpret",
        json={
            "transcript": "Tôi bị dị ứng đậu phộng",
            "draft": [{"item_id": dish.id, "quantity": 1}],
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["pending_draft_removal"] == {"item_id": dish.id, "allergen": "đậu phộng"}
    assert body["warnings"][0]["item_name"] == "Bò xào"
    assert body["warnings"][0]["allergen"] == "đậu phộng"
    assert body["remove_from_draft"] == []
    assert "Anh/chị có muốn em xóa món này" in body["message"]


async def test_voice_endpoint_confirms_removal_after_allergy_confirmation(
    client: AsyncClient, db_session: AsyncSession
):
    dish = await _dish(db_session, "Bò xào", thanhphan="Thịt bò, đậu phộng")

    resp = await client.post(
        "/api/v1/ai/voice-parse",
        json={
            "transcript": "Ừ, xóa đi",
            "draft": [{"item_id": dish.id, "quantity": 1}],
            "pending_draft_removal": {"item_id": dish.id, "allergen": "đậu phộng"},
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["remove_from_draft"] == [dish.id]
    assert body["pending_draft_removal"] is None
    assert "đã xóa Bò xào khỏi giỏ hàng" in body["message"]


async def test_voice_endpoint_keeps_item_when_customer_declines_allergy_removal(
    client: AsyncClient, db_session: AsyncSession
):
    dish = await _dish(db_session, "Bò xào", thanhphan="Thịt bò, đậu phộng")

    resp = await client.post(
        "/voice/interpret",
        json={
            "transcript": "Không xóa, giữ lại",
            "draft": [{"item_id": dish.id, "quantity": 1}],
            "pending_draft_removal": {"item_id": dish.id, "allergen": "đậu phộng"},
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["remove_from_draft"] == []
    assert body["pending_draft_removal"] is None
    assert "giữ món Bò xào" in body["message"]


async def test_voice_endpoint_decreases_quantity_in_order_draft(
    client: AsyncClient, db_session: AsyncSession
):
    coca = await _dish(db_session, "Coca", category="Đồ uống", price=15000)

    resp = await client.post(
        "/api/v1/ai/voice-parse",
        json={
            "transcript": "Bỏ bớt 1 Coca đi",
            "draft": [{"item_id": coca.id, "quantity": 3}],
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["draft_changes"] == [{"item_id": coca.id, "quantity": 2}]
    assert body["remove_from_draft"] == []
    assert "giảm xuống còn 2 Coca" in body["message"]


async def test_voice_endpoint_removes_item_from_order_draft(
    client: AsyncClient, db_session: AsyncSession
):
    coca = await _dish(db_session, "Coca", category="Đồ uống", price=15000)

    resp = await client.post(
        "/voice/interpret",
        json={
            "transcript": "Xóa Coca giúp anh",
            "draft": [{"item_id": coca.id, "quantity": 1}],
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["remove_from_draft"] == [coca.id]
    assert "đã xóa Coca khỏi giỏ hàng" in body["message"]


async def test_voice_endpoint_returns_not_found_item_without_mutating_draft(
    client: AsyncClient, db_session: AsyncSession
):
    await _dish(db_session, "Phở bò tái lăn")

    resp = await client.post(
        "/api/v1/ai/voice-parse", json={"transcript": "Cho tôi 1 pizza"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["adds"] == []
    assert body["not_found"]
    assert "chưa tìm thấy" in body["message"]


async def test_voice_endpoint_recognizes_finish_intent(client: AsyncClient):
    resp = await client.post(
        "/voice/interpret", json={"transcript": "Tôi chọn món xong rồi"}
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "finish"
    assert body["done"] is True
    assert body["adds"] == []
