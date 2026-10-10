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
async def test_voice_endpoint_parses_order_and_modifier(client: AsyncClient, db_session: AsyncSession, endpoint: str):
    dish = await _dish(db_session, "Bún chả Hà Nội", price=55000)

    resp = await client.post(
        endpoint,
        json={"transcript": "Cho tôi 2 Bún chả Hà Nội không hành"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["transcript"] == "Cho tôi 2 Bún chả Hà Nội không hành"
    assert body["intent"] == "order"
    assert body["adds"] == [{"id": dish.id, "name": "Bún chả Hà Nội", "qty": 2, "note": "Không hành", "price": 55000}]
    assert body["not_found"] == []
    assert "Không hành" in body["message"]


@pytest.mark.parametrize("endpoint", VOICE_ENDPOINTS)
async def test_voice_endpoint_validates_missing_or_blank_transcript(client: AsyncClient, endpoint: str):
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


async def test_voice_endpoint_asks_for_quantity_when_customer_omits_it(client: AsyncClient, db_session: AsyncSession):
    dish = await _dish(db_session, "Phở bò tái lăn")

    resp = await client.post("/voice/interpret", json={"transcript": "Cho tôi Phở bò tái lăn"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "unknown"
    assert body["adds"] == []
    assert body["needs_quantity_for"] == {"item_id": dish.id, "item_name": dish.tenmon}


async def test_voice_endpoint_reports_requested_quantity_over_stock(client: AsyncClient, db_session: AsyncSession):
    dish = await _dish(db_session, "Coca", category="Đồ uống", price=15000, soluongton=2)

    resp = await client.post("/api/v1/ai/voice-parse", json={"transcript": "Cho 3 Coca"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["adds"] == []
    assert body["stock_limits"] == [{"item_id": dish.id, "item_name": "Coca", "requested": 3, "available": 2}]
    assert "chỉ còn 2 phần Coca" in body["message"]


async def test_voice_endpoint_recommends_available_beverages_only(client: AsyncClient, db_session: AsyncSession):
    coca = await _dish(db_session, "Coca", category="Đồ uống", price=15000)
    await _dish(db_session, "Trà đá", category="Đồ uống", price=10000, soluongton=0)
    appetizer = await _dish(db_session, "Khoai tây chiên", category="Khai vị", price=40000)
    await _dish(db_session, "Phở bò", category="Món chính", price=65000)

    resp = await client.post("/voice/interpret", json={"transcript": "Quán có nước uống gì?"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    assert [item["id"] for item in body["recommendations"]] == [coca.id, appetizer.id]
    assert "Coca" in body["message"]
    assert "Trà đá" not in body["message"]
    assert "Khoai tây chiên" in body["message"]


async def test_voice_endpoint_soup_search_excludes_beverages(client: AsyncClient, db_session: AsyncSession):
    pho = await _dish(
        db_session,
        "Phở bò",
        price=65000,
        mota="Phở nóng với nước dùng bò",
    )
    await _dish(db_session, "Coca", category="Đồ uống", price=15000)

    resp = await client.post("/api/v1/ai/voice-parse", json={"transcript": "Quán có món súp gì không?"})

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


async def test_voice_endpoint_decreases_quantity_in_order_draft(client: AsyncClient, db_session: AsyncSession):
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


async def test_voice_endpoint_removes_item_from_order_draft(client: AsyncClient, db_session: AsyncSession):
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

    resp = await client.post("/api/v1/ai/voice-parse", json={"transcript": "Cho tôi 1 pizza"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["adds"] == []
    assert body["not_found"]
    assert "chưa tìm thấy" in body["message"]


async def test_voice_endpoint_recognizes_finish_intent(client: AsyncClient):
    resp = await client.post("/voice/interpret", json={"transcript": "Tôi chọn món xong rồi"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "finish"
    assert body["done"] is True
    assert body["adds"] == []


# ── TEST CASES THEO YÊU CẦU 6 CASE ──


async def test_case_1_spicy_dishes_with_reason_and_price(client: AsyncClient, db_session: AsyncSession):
    """Case 1: 'Em ơi quán có món nào cay không?' -> Chỉ món có độ cay trong DB kèm lý do & giá."""
    spicy_dish = await _dish(db_session, "Gà Rán Giòn Cay", price=65000, docay="Cay vừa")
    await _dish(db_session, "Phở bò", price=65000, docay=None)

    resp = await client.post("/voice/interpret", json={"transcript": "Em ơi quán có món nào cay không?"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert spicy_dish.id in rec_ids
    assert len(rec_ids) == 1
    assert "Gà Rán Giòn Cay" in body["message"]
    assert "65.000đ" in body["message"]
    assert "Cay vừa" in body["message"]


async def test_case_2_non_spicy_dishes_exclude_spicy_with_reason(client: AsyncClient, db_session: AsyncSession):
    """Case 2: 'Tôi không ăn được cay, gợi ý món đi' -> Loại hết món cay, gợi ý món khác kèm lý do."""
    spicy_dish = await _dish(db_session, "Gà Rán Giòn Cay", price=65000, docay="Cay vừa")
    normal_dish = await _dish(db_session, "Bún chả Hà Nội", price=55000, docay=None)

    resp = await client.post("/voice/interpret", json={"transcript": "Tôi không ăn được cay, gợi ý món đi"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert spicy_dish.id not in rec_ids
    assert normal_dish.id in rec_ids
    assert "Bún chả Hà Nội" in body["message"]
    assert "55.000đ" in body["message"]


async def test_case_3_dessert_dishes_only(client: AsyncClient, db_session: AsyncSession):
    """Case 3: 'Cho tôi món ngọt tráng miệng' -> Chỉ món trong Tráng miệng."""
    flan = await _dish(db_session, "Bánh Flan", category="Tráng miệng", price=25000)
    yogurt = await _dish(db_session, "Sữa chua Hy Lạp", category="Tráng miệng", price=30000)
    main_dish = await _dish(db_session, "Phở bò", category="Món chính", price=65000)

    resp = await client.post("/voice/interpret", json={"transcript": "Cho tôi món ngọt tráng miệng"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert flan.id in rec_ids or yogurt.id in rec_ids
    assert main_dish.id not in rec_ids
    assert "Bánh Flan" in body["message"] or "Sữa chua Hy Lạp" in body["message"]


async def test_case_4_light_food_real_data_or_ask_clarification(client: AsyncClient, db_session: AsyncSession):
    """Case 4: 'Có món nào thanh đạm, nhẹ bụng không?' -> Dữ liệu thật / hỏi lại nếu thiếu thông tin."""
    # Subtest 4a: DB chưa có món nào ghi "thanh đạm" -> Hỏi lại 1 câu
    await _dish(db_session, "Phở bò", mota="Món ăn truyền thống")
    resp1 = await client.post("/voice/interpret", json={"transcript": "Có món nào thanh đạm, nhẹ bụng không?"})
    assert resp1.status_code == 200
    body1 = resp1.json()
    assert body1["intent"] == "recommendation"
    assert "chưa có thông tin đánh dấu món 'thanh đạm'" in body1["message"]

    # Subtest 4b: DB có món ghi "thanh đạm" -> Gợi ý theo dữ liệu thật
    goi_cuon = await _dish(db_session, "Gỏi cuốn", price=45000, mota="Món thanh đạm, nhẹ bụng với rau củ tươi")
    resp2 = await client.post("/voice/interpret", json={"transcript": "Có món nào thanh đạm, nhẹ bụng không?"})
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["intent"] == "recommendation"
    rec_ids2 = [r["id"] for r in body2["recommendations"]]
    assert goi_cuon.id in rec_ids2
    assert "Gỏi cuốn" in body2["message"]


async def test_case_5_soup_cold_weather_seafood_warning(client: AsyncClient, db_session: AsyncSession):
    """Case 5: 'Tôi muốn món có nước, trời lạnh' -> Món có nước dùng;
    cảnh báo hải sản nếu tất cả món nước là hải sản.
    """
    lau_hai_san = await _dish(
        db_session,
        "Set lẩu hải sản 4 người",
        category="Món chính",
        price=350000,
        mota="Nước lẩu đậm đà",
        thanhphan="Tôm, mực, cá",
        thongtindiung="Hải sản",
    )

    resp = await client.post("/voice/interpret", json={"transcript": "Tôi muốn món có nước, trời lạnh"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert lau_hai_san.id in rec_ids
    assert "hải sản" in body["message"].lower()
    assert any(w["item_id"] == lau_hai_san.id for w in body["warnings"])


async def test_case_6_best_seller_matches_real_label(client: AsyncClient, db_session: AsyncSession):
    """Case 6: 'Gợi ý món bán chạy của quán' -> Chỉ nói bán chạy nếu có cờ/thống kê thật."""
    pho_banchay = await _dish(db_session, "Phở bò tái lăn", price=65000, banchay=True)
    bun_normal = await _dish(db_session, "Bún chả Hà Nội", price=55000, banchay=False)

    resp = await client.post("/voice/interpret", json={"transcript": "Gợi ý món bán chạy của quán"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "recommendation"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert pho_banchay.id in rec_ids
    assert bun_normal.id not in rec_ids
    assert "Phở bò tái lăn" in body["message"]
    assert "khớp nhãn Bán chạy" in body["message"] or "Bán chạy" in body["message"]


async def test_screenshot_case_light_food_with_shrimp(client: AsyncClient, db_session: AsyncSession):
    """Test câu hỏi trong ảnh 1: 'Tôi thích ăn món thanh đạm mà có chứa tôm'."""
    goi_cuon = await _dish(
        db_session, "Gỏi cuốn", price=45000, thanhphan="Tôm, thịt heo, rau củ", mota="Món thanh đạm, nhẹ bụng"
    )

    resp = await client.post("/voice/interpret", json={"transcript": "Tôi thích ăn món thanh đạm mà có chứa tôm"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "ingredient_search"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert goi_cuon.id in rec_ids
    assert "Gỏi cuốn" in body["message"]
    assert "tôm" in body["message"].lower()
    assert "chưa có thông tin đánh dấu món" not in body["message"]


async def test_screenshot_case_shrimp_or_seafood(client: AsyncClient, db_session: AsyncSession):
    """Test câu hỏi trong ảnh 2: 'tôi thích ăn món có chứa tôm hoặc hải sản'."""
    lau_hai_san = await _dish(
        db_session, "Set lẩu hải sản 4 người", price=350000, thanhphan="Tôm, mực, cá", thongtindiung="Hải sản"
    )

    resp = await client.post("/voice/interpret", json={"transcript": "tôi thích ăn món có chứa tôm hoặc hải sản"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "ingredient_search"
    rec_ids = [r["id"] for r in body["recommendations"]]
    assert lau_hai_san.id in rec_ids
    assert "tôm hoặc hải sản" in body["message"].lower()
    assert "chua tom hoac hai san" not in body["message"]
