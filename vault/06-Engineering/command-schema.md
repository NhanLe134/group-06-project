# Command / Intent Schema — AI Assistant (Output #19)

> Vai trò: Lead Engineer. Định nghĩa hợp đồng dữ liệu nội bộ giữa **AI Gateway** (module trong Backend, xem `architecture.md` Mục 1) và **AI/LLM Provider**: mọi câu nói/chat của khách phải được LLM chuẩn hoá thành đúng 1 trong 4 intent dưới đây trước khi Backend xử lý nghiệp vụ. Áp dụng cho `POST /ai/chat` và `POST /ai/voice` (xem `api-contract.md` Mục 3–4).
> Nguyên tắc guardrail (theo `vault/00-Index.md` mục "No Scope Creep"): AI **không được tự bịa intent khác ngoài danh sách này**, không tự đặt giá, không tự đổi trạng thái đơn hàng ngoài phạm vi 4 intent.

## 1. Envelope chung

Mọi phản hồi từ AI/LLM Provider gửi về AI Gateway (nội bộ, không phải response trả cho frontend) phải theo đúng schema sau:

```json
{
  "intent": "ADD_TO_CART | REMOVE_FROM_CART | QUERY_MENU | CLARIFY",
  "confidence": 0.0,
  "slots": { }
}
```

**Rule ngưỡng tin cậy (áp dụng cho mọi intent):** nếu `confidence < 0.7`, AI Gateway **bắt buộc ép intent về `CLARIFY`** bất kể LLM trả gì khác — không tin tưởng intent có độ tin cậy thấp (liên quan US-02 AC2).

## 2. `ADD_TO_CART`

**Khi nào:** khách yêu cầu thêm món vào Order Draft (REQ-01, US-01, US-02).

**Ví dụ câu nói:** *"Cho 2 ly Pepsi"*

**JSON payload mẫu:**

```json
{
  "intent": "ADD_TO_CART",
  "confidence": 0.96,
  "slots": {
    "items": [
      { "menu_item_name": "Pepsi", "quantity": 2, "note": null }
    ]
  }
}
```

**Rule backend (AI Gateway thực thi, không phải LLM tự quyết):**
1. Với mỗi phần tử trong `items`, resolve `menu_item_name` → `menu_items.id` bằng fuzzy match trên `menu_items.name` (chỉ tìm trong DB thật — không được để LLM tự bịa `menu_item_id`).
2. Nếu tìm được **nhiều hơn 1** kết quả khớp gần đúng (VD: khách nói "Bò" mà menu có 3 món Bò) → không thêm, chuyển sang trả kết quả dạng `CLARIFY` (US-02 AC2).
3. Nếu `menu_items.status = out_of_stock` → **không được `INSERT order_items`** — trả `reply_text` thông báo nhẹ nhàng món đã hết (đúng văn bản mẫu tại `vault/08-Decisions/decision-log.md` ADR-001 gốc), món đó xuất hiện trong response ở mảng `oos_notice`, không xuất hiện trong `matched_items` (REQ-09, REQ-15).
4. Nếu `menu_items.status = available` → `INSERT order_items (order_id, menu_item_id, quantity, unit_price = menu_items.price, status='pending')`, cập nhật lại `orders.total_amount`.
5. `quantity` bắt buộc là số nguyên dương; LLM trả `quantity <= 0` hoặc không phải số → coi như lỗi parse, ép về `CLARIFY`.

## 3. `REMOVE_FROM_CART`

**Khi nào:** khách muốn bỏ món khỏi Order Draft — **chỉ áp dụng khi `orders.status = draft`** (chưa Explicit Confirmation).

**Ví dụ câu nói:** *"Bỏ giúp tôi 1 ly Pepsi"*

**JSON payload mẫu:**

```json
{
  "intent": "REMOVE_FROM_CART",
  "confidence": 0.91,
  "slots": {
    "items": [
      { "menu_item_name": "Pepsi", "quantity": 1 }
    ]
  }
}
```

**Rule backend:**
1. Chỉ thao tác trên `order_items` thuộc `order.status = draft`. Nếu `order.status = confirmed` (đã gửi bếp), **AI Gateway phải từ chối thực hiện REMOVE_FROM_CART** — trả `reply_text`: "Món đã gửi xuống bếp, anh/chị vui lòng nhờ nhân viên hỗ trợ huỷ món." Không được tự gọi sang endpoint `POST /orders/items/{id}/void` (endpoint đó bắt buộc PIN Manager — REQ-10 — AI không có quyền này).
2. Nếu `quantity` không được nói rõ (`null`), mặc định hiểu là xoá toàn bộ số lượng món đó khỏi giỏ.
3. Nếu `quantity` yêu cầu xoá lớn hơn số lượng hiện có trong giỏ → xoá tối đa số lượng đang có, không báo lỗi vụn vặt, chỉ cần đồng bộ đúng số liệu.

## 4. `QUERY_MENU`

**Khi nào:** khách hỏi thông tin món ăn (tư vấn, tìm món theo khẩu vị/dị ứng — REQ-01), không có ý định thêm/xoá giỏ ngay.

**Ví dụ câu nói:** *"Quán có món gì không cay không?"*

**JSON payload mẫu:**

```json
{
  "intent": "QUERY_MENU",
  "confidence": 0.88,
  "slots": {
    "keyword": "không cay",
    "category": null,
    "exclude_allergens": []
  }
}
```

**Rule backend:**
1. **Chỉ đọc** (`SELECT`) từ bảng `menu_items` thật trong DB — LLM tuyệt đối không được tự bịa tên món, giá, hoặc mô tả không có trong DB (đúng nguyên tắc Vault "không dùng tri thức ngoài để lấp khoảng trống").
2. Món `status = out_of_stock` vẫn được liệt kê trong kết quả nếu khớp filter, nhưng phải gắn cờ `is_out_of_stock: true` để AI Gateway build `reply_text` có nhắc "hiện đang hết".
3. Không trả về các trường không thuộc `menu_items` (VD: không tự tính khuyến mãi nếu DB không có bảng promotion).

## 5. `CLARIFY`

**Khi nào:** LLM không đủ tin cậy để xác định 1 trong 3 intent trên, hoặc tên món mơ hồ khớp nhiều kết quả, hoặc `confidence < 0.7` (US-02 AC2).

**Ví dụ câu nói:** *"Cho tôi món Bò"* (menu có Bò Lúc Lắc, Phở Bò, Bò Nướng Lá Lốt)

**JSON payload mẫu:**

```json
{
  "intent": "CLARIFY",
  "confidence": 0.42,
  "slots": {
    "ambiguous_term": "Bò",
    "candidates": ["Bò Lúc Lắc", "Phở Bò", "Bò Nướng Lá Lốt"]
  }
}
```

**Rule backend:**
1. AI Gateway build `clarification_question` từ `candidates` theo mẫu: *"Dạ quán có {candidate_1}, {candidate_2} và {candidate_3} — anh/chị muốn món nào ạ?"*.
2. Response trả về frontend luôn có `needs_clarification = true`, `matched_items = []` — **không được** vừa trả `CLARIFY` vừa nhét sẵn 1 món đoán đại vào giỏ.
3. Câu trả lời tiếp theo của khách (turn kế tiếp) phải được AI Gateway coi là bổ sung ngữ cảnh cho `ambiguous_term` cũ, không xử lý như 1 câu độc lập mới (giữ context hội thoại trong session).

## 6. Bảng tổng hợp validation bắt buộc

| Intent | Bắt buộc resolve qua DB? | Được phép tự chốt hành động? | Trace |
|---|---|---|---|
| `ADD_TO_CART` | ✔ (`menu_items`) | ✔ nếu available, ✘ nếu OOS | REQ-01, REQ-09, REQ-15 |
| `REMOVE_FROM_CART` | ✔ (`order_items` đang `draft`) | ✔ chỉ khi chưa confirm | REQ-02 |
| `QUERY_MENU` | ✔ (`menu_items`, read-only) | Không áp dụng (không ghi dữ liệu) | REQ-01 |
| `CLARIFY` | ✘ | ✘ (luôn hỏi lại người) | US-02 AC2 |
