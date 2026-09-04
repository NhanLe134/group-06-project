# API Specification — Restaurant Smart Ordering System

> Chuẩn: OpenAPI-style (mô tả thủ công bằng Markdown, tương ứng 1-1 với router FastAPI). Backend: Python 3.13 / FastAPI (xem `architecture.md`). Schema field đặt tên khớp `data-model.md`.
> Auth: 2 cơ chế song song —
> - **Session Token** (`X-Session-Token` header): token nhẹ cấp cho thiết bị khách khi quét QR (gắn với `table_sessions.id`), dùng cho các endpoint khách gọi (Order Draft, AI Chat/Voice, Confirm). Không cần tài khoản `Users`.
> - **Bearer JWT** (`Authorization: Bearer <jwt>`): dùng cho endpoint nhân viên (Waiter/Kitchen/Manager), phát hành khi login vào `users`, mang `role` claim để RBAC (REQ-10, NFR-RO-03).
>
> Error body chuẩn dùng chung cho mọi mã lỗi:
> ```json
> { "error_code": "STRING_CODE", "message": "Mô tả lỗi cho người dùng/dev" }
> ```

---

## 1. `POST /orders/confirm`

**Mô tả:** Explicit Confirmation — chốt Order Draft thành Order chính thức, tạo `Kitchen_Tickets` cho từng `Order_Item` và publish sự kiện `kds:tickets` (REQ-02, US-01 AC2). Bị chặn nếu Order Draft còn món ở trạng thái Out of Stock (REQ-15 / ADR-001 gốc).

**Auth:** Header `X-Session-Token` (khách tại bàn, không cần JWT).

**Request Body**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `order_id` | `uuid` | ✔ | Order Draft đang giữ trạng thái `draft`, thuộc `table_sessions` của session token |
| `expected_total_amount` | `number` | ✔ | Tổng tiền khách nhìn thấy trên UI trước khi bấm xác nhận — dùng để phát hiện lệch giá do race condition (CMS đổi giá) |

```json
{
  "order_id": "b6a1f0b0-2e34-4c9a-9b7a-0a1e2c3d4f5a",
  "expected_total_amount": 245000
}
```

**Response `200 OK`**

```json
{
  "order_id": "b6a1f0b0-2e34-4c9a-9b7a-0a1e2c3d4f5a",
  "status": "confirmed",
  "confirmed_at": "2026-09-04T10:15:30+07:00",
  "total_amount": 245000,
  "kitchen_tickets": [
    { "id": "f1a2...", "order_item_id": "8c3d...", "status": "queued" }
  ]
}
```

**Errors**

| Code | `error_code` | Khi nào |
|---|---|---|
| `400 Bad Request` | `ORDER_EMPTY` | Order Draft không có `order_item` nào |
| `400 Bad Request` | `ORDER_CONTAINS_OOS_ITEM` | Còn ít nhất 1 `order_item` tham chiếu `menu_item.status = out_of_stock` (chặn theo REQ-15 — client phải gỡ món trước) |
| `400 Bad Request` | `TOTAL_AMOUNT_MISMATCH` | `expected_total_amount` lệch so với tổng tính lại phía server (giá vừa bị CMS đổi) |
| `403 Forbidden` | `SESSION_TOKEN_INVALID` | `X-Session-Token` không khớp/hết hạn, hoặc `order_id` không thuộc session của token này |
| `404 Not Found` | `ORDER_NOT_FOUND` | `order_id` không tồn tại hoặc đã ở trạng thái khác `draft` |

---

## 2. `POST /orders/items/{id}/void`

**Mô tả:** Huỷ món đã gửi bếp. Bắt buộc xác thực PIN của một tài khoản `role = manager` đang hoạt động (US-04 AC3, RBAC REQ-10) — kể cả khi người bấm nút là Waiter đã đăng nhập, PIN vẫn phải khớp một Manager. Ghi log vào `void_refund_logs`.

**Auth:** `Authorization: Bearer <jwt>` (Waiter/Kitchen/Manager đã đăng nhập) **+** `pin_code` trong body.

**Path Params:** `id` = `order_items.id`

**Request Body**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `pin_code` | `string` | ✔ | PIN của tài khoản Manager, đối chiếu `users.pin_hash` |
| `reason` | `string` | ✔ | Lý do huỷ (khách đổi ý, khách bom món, nấu sai...) — lưu vào `void_refund_logs.reason` |

```json
{ "pin_code": "193045", "reason": "Khách đổi món trước khi bếp bắt đầu nấu" }
```

**Response `200 OK`**

```json
{
  "order_item_id": "8c3d1a2b-...",
  "status": "void",
  "void_refund_log_id": "e7f8...",
  "approved_by": "d4c5...",
  "approved_at": "2026-09-04T10:20:11+07:00"
}
```

**Errors**

| Code | `error_code` | Khi nào |
|---|---|---|
| `400 Bad Request` | `ORDER_ITEM_NOT_VOIDABLE` | `order_items.status` đã là `served` hoặc `void` — không thể huỷ nữa |
| `403 Forbidden` | `INVALID_MANAGER_PIN` | `pin_code` không khớp bất kỳ tài khoản `role = manager` nào đang `is_active = true` |
| `403 Forbidden` | `TOKEN_ROLE_NOT_ALLOWED` | JWT hợp lệ nhưng role không nằm trong nhóm được phép gọi endpoint (ví dụ tài khoản Guest — không áp dụng vì Guest không có JWT, giữ để đồng bộ RBAC middleware chung) |
| `404 Not Found` | `ORDER_ITEM_NOT_FOUND` | `id` không tồn tại |

---

## 3. `POST /ai/chat`

**Mô tả:** Nhận prompt dạng text từ AI Assistant Chat (REQ-01, US-02), trả về danh sách món AI nhận diện được để thêm vào Order Draft. Nếu tên món mơ hồ (nhiều biến thể trùng khớp), trả `needs_clarification = true` kèm câu hỏi gợi ý (US-02 AC2). Nội bộ, AI Gateway map câu nói sang 1 trong 4 intent chuẩn hoá tại `command-schema.md` trước khi thực thi nghiệp vụ.

**Auth:** Header `X-Session-Token`.

**Request Body**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `message` | `string` | ✔ | Câu khách nhập, ví dụ `"Cho 2 ly Pepsi"` |
| `order_id` | `uuid` | ✔ | Order Draft hiện tại để AI biết context giỏ hàng |

**Response `200 OK`**

```json
{
  "reply_text": "Đã thêm 2 ly Pepsi vào giỏ hàng của bạn.",
  "needs_clarification": false,
  "clarification_question": null,
  "matched_items": [
    { "menu_item_id": "3a2b...", "name": "Pepsi", "quantity": 2, "confidence": 0.96 }
  ],
  "oos_notice": []
}
```

`oos_notice`: mảng các món khách yêu cầu nhưng đang `out_of_stock` nên **không** được thêm vào giỏ (REQ-09, REQ-15, xem `command-schema.md` Mục 2 rule 3) — `[{ "menu_item_id": "...", "name": "Bò Lúc Lắc" }]`. Rỗng nếu không có món nào bị chặn.

Ví dụ khi mơ hồ (US-02 AC2, khách nói *"Bò"* và menu có nhiều món bò):

```json
{
  "reply_text": null,
  "needs_clarification": true,
  "clarification_question": "Dạ quán có Bò Lúc Lắc, Phở Bò và Bò Nướng Lá Lốt — anh/chị muốn món nào ạ?",
  "matched_items": [],
  "oos_notice": []
}
```

**Errors**

| Code | `error_code` | Khi nào |
|---|---|---|
| `400 Bad Request` | `MESSAGE_EMPTY` | `message` rỗng hoặc chỉ chứa khoảng trắng |
| `403 Forbidden` | `SESSION_TOKEN_INVALID` | Session hết hạn/không hợp lệ, hoặc `table_sessions.status = closed` |
| `404 Not Found` | `ORDER_NOT_FOUND` | `order_id` không thuộc session hiện tại |

---

## 4. `POST /ai/voice`

**Mô tả:** Nhận audio (Voice-to-order, REQ-05, US-02), chạy Speech-to-Text + NLP, trả cùng schema kết quả như `/ai/chat`. Tuân thủ NFR-RO-05 (client phải tự chuyển Text fallback sau 2 lần lỗi — không phải trách nhiệm của endpoint này) và NFR-RO-02 (audio thô chỉ lưu tạm, gắn `table_session_id` để job xoá sau — xem `data-model.md` Mục 4).

**Auth:** Header `X-Session-Token`.

**Request:** `multipart/form-data`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `audio_file` | `binary` (`.wav`/`.webm`, ≤ 15s) | ✔ | Đoạn ghi âm khách nói |
| `order_id` | `uuid` | ✔ | Order Draft hiện tại |

**Response `200 OK`** — schema giống hệt `/ai/chat`:

```json
{
  "reply_text": "Đã thêm 1 Phở Bò vào giỏ hàng của bạn.",
  "needs_clarification": false,
  "clarification_question": null,
  "matched_items": [
    { "menu_item_id": "9f1e...", "name": "Phở Bò", "quantity": 1, "confidence": 0.91 }
  ],
  "oos_notice": [],
  "transcript_id": "c2d3..."
}
```

**Errors**

| Code | `error_code` | Khi nào |
|---|---|---|
| `400 Bad Request` | `AUDIO_FORMAT_UNSUPPORTED` | File không đúng định dạng/quá thời lượng cho phép |
| `400 Bad Request` | `SPEECH_NOT_RECOGNIZED` | STT trả rỗng/không giải mã được. Body kèm thêm `"force_text_fallback": boolean` — `true` khi đây là lần lỗi liên tiếp thứ 2 trở lên trong session (NFR-RO-05), báo client tự động chuyển bàn phím nhập tay; `false` nếu mới lỗi lần đầu (xem chi tiết cơ chế đếm lỗi tại `story-spec-ai-order.md` Mục 4) |
| `403 Forbidden` | `SESSION_TOKEN_INVALID` | Session hết hạn/không hợp lệ, hoặc đã `closed` |
| `404 Not Found` | `ORDER_NOT_FOUND` | `order_id` không thuộc session hiện tại |

---

## 5. WebSocket — KDS Realtime

Theo `architecture.md` Mục 4, route WS chung là `GET /ws/{channel}` (FastAPI native WebSocket, in-process Pub/Sub). Màn hình KDS subscribe **2 channel** để đủ dữ liệu vận hành:

- `/ws/kds:tickets` — vòng đời Kitchen Ticket, gồm sự kiện `TICKET_OVERDUE`.
- `/ws/menu:oos` — trạng thái Out of Stock, gồm sự kiện `ITEM_OOS_BROADCAST` (KDS cũng cần biết món nào vừa hết để không tiếp tục nấu nhầm).

**Auth:** `X-Session-Token` (KDS) hoặc `Authorization: Bearer <jwt>` (thiết bị Kitchen) truyền qua query string lúc handshake, ví dụ `wss://.../ws/kds:tickets?token=...` — do trình duyệt không cho set custom header khi mở WebSocket.

**Envelope chung cho mọi message:**

```json
{ "event": "EVENT_NAME", "payload": { ... }, "emitted_at": "2026-09-04T10:22:00+07:00" }
```

### 5.1 Event `TICKET_OVERDUE` (channel `kds:tickets`)

Phát khi job định kỳ phát hiện `kitchen_tickets.queued_at` vượt quá 15 phút mà `status != done` (REQ-08).

```json
{
  "event": "TICKET_OVERDUE",
  "payload": {
    "kitchen_ticket_id": "f1a2b3c4-...",
    "order_item_id": "8c3d1a2b-...",
    "table_number": "B12",
    "menu_item_name": "Bò Lúc Lắc",
    "queued_at": "2026-09-04T10:05:00+07:00",
    "elapsed_minutes": 17,
    "is_overdue": true
  },
  "emitted_at": "2026-09-04T10:22:00+07:00"
}
```

### 5.2 Event `ITEM_OOS_BROADCAST` (channel `menu:oos`)

Phát khi `POST /menu/items/{id}/out-of-stock` được gọi — broadcast toàn hệ thống (REQ-09), đồng thời kèm danh sách `table_session_id` đang có món này trong Order Draft chưa confirm để client tự grayed-out (REQ-15).

```json
{
  "event": "ITEM_OOS_BROADCAST",
  "payload": {
    "menu_item_id": "3a2b1c0d-...",
    "menu_item_name": "Bò Lúc Lắc",
    "status": "out_of_stock",
    "affected_table_sessions": ["b6a1f0b0-...", "d4e5f6a7-..."]
  },
  "emitted_at": "2026-09-04T10:23:15+07:00"
}
```

**Ghi chú đồng bộ:** phần này mô tả theo góc nhìn "1 màn hình KDS cần những gì" — thiết kế channel vật lý (`kds:tickets` tách khỏi `menu:oos`) giữ nguyên theo `architecture.md` Mục 4, không gộp thành một channel `/ws/kds/tickets` duy nhất để tránh client không liên quan (ví dụ E-Menu khách) phải nhận nhầm sự kiện ticket bếp.
