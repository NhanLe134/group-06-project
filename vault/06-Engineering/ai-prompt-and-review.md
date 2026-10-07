# AI Prompt Template & Code Review Checklist (Output #24 & #25)

> Vai trò: Lead Engineer. Output #24 = mẫu prompt chuẩn để sinh code FastAPI/WebSocket, dùng lặp lại cho toàn bộ backend. Output #25 = checklist review bắt buộc trước khi merge, tập trung 4 nhóm rủi ro cao nhất của dự án này.

## Output #24 — Mẫu AI Prompt chuẩn (sinh code FastAPI / WebSocket)

Dùng mẫu này mỗi khi nhờ AI sinh code cho 1 router/module backend — điền vào 4 chỗ `{{...}}`, không bỏ phần "Ràng buộc bắt buộc" vì đó là nơi ép AI bám nguồn Vault thay vì tự bịa.

```
Vai trò: Bạn là Backend Engineer viết code Python 3.13 / FastAPI cho dự án Restaurant Smart Ordering.

Bối cảnh bắt buộc đọc trước khi viết code (không suy đoán ngoài các nguồn này):
- Kiến trúc: vault/06-Engineering/architecture.md
- Data model: vault/06-Engineering/data-model.md
- API contract: vault/06-Engineering/api-contract.md
- Command schema (nếu liên quan AI/WS): vault/06-Engineering/command-schema.md
- Cấu trúc thư mục: vault/06-Engineering/repo-structure.md

Nhiệm vụ: Viết {{tên router/module, vd: "router POST /orders/confirm"}}.

Ràng buộc bắt buộc:
1. Field request/response PHẢI khớp chính xác tên và kiểu dữ liệu trong api-contract.md — không tự đổi tên field, không tự thêm field không có trong đặc tả.
2. Toàn bộ DB access dùng async SQLAlchemy session (async def, await), không dùng driver đồng bộ.
3. Mọi thao tác ghi nhiều bảng liên quan (VD: insert Order + insert Kitchen_Tickets) PHẢI nằm trong cùng 1 transaction — rollback toàn bộ nếu 1 bước lỗi.
4. Validate request bằng Pydantic model riêng trong app/schemas/, không validate thủ công bằng if/else rời rạc.
5. Trả đúng HTTP status code + error_code đã liệt kê trong api-contract.md cho từng endpoint (400/403/404 tương ứng).
6. Nếu endpoint liên quan RBAC (Manager Void, CMS Menu...), PHẢI dùng dependency chung app/auth/rbac.py, không tự viết lại logic kiểm role trong từng router.
7. Không tự ý thêm business rule, endpoint, hoặc field ngoài phạm vi được giao — nếu thấy thiếu thông tin, dừng lại và hỏi thay vì tự suy đoán (No Scope Creep, theo vault/00-Index.md).

Output mong muốn: {{vd: "1 file router + 1 file schema Pydantic tương ứng + docstring 1 dòng mô tả endpoint"}}.
```

**Mẫu rút gọn dành riêng cho WebSocket (khi sinh code cho `app/ws/`):**

```
Nhiệm vụ: Viết {{connect handler / broadcast function}} cho channel {{tên channel, vd: "menu:oos"}} theo đúng thiết kế ConnectionManager tại vault/06-Engineering/architecture.md Mục 4.

Ràng buộc bắt buộc:
1. Không dùng broker ngoài (Redis...) — bám đúng thiết kế in-memory ConnectionManager theo ADR-ARCH-001 (Monolith, 1 instance).
2. Phải xử lý WebSocketDisconnect để tự động gỡ connection khỏi self.channels, tránh memory leak.
3. Payload broadcast phải đúng format Mục 5 trong api-contract.md (envelope { event, payload, emitted_at }).
```

## Output #25 — Bảng tiêu chí Code Review (bắt buộc trước khi merge)

| Hạng mục | Tiêu chí kiểm tra | Ví dụ lỗi phải chặn |
|---|---|---|
| **Async safety** | Mọi hàm chạm DB/network là `async def`, dùng `await` đầy đủ; không gọi hàm blocking (`requests`, `time.sleep`, driver DB đồng bộ) bên trong `async def` | `def get_order(...)` gọi `psycopg2` đồng bộ trong route async → block toàn bộ event loop, treo các WebSocket connection khác |
| **Async safety** | `ConnectionManager.channels` (dict/set dùng chung) không bị sửa đổi đồng thời gây race condition khi nhiều client connect/disconnect cùng lúc | Broadcast lặp qua `self.channels[channel]` trực tiếp thay vì `list(...)` trước khi lặp → lỗi "set changed size during iteration" khi có client disconnect giữa lúc broadcast |
| **DB transaction** | Thao tác ghi nhiều bảng liên quan (Order + Order_Items + Kitchen_Tickets, hoặc Order_Item + Void_Refund_Log) nằm trong 1 transaction, có rollback khi lỗi giữa chừng | `POST /orders/confirm` insert xong Kitchen_Tickets cho 2 món đầu, món thứ 3 lỗi constraint → 2 ticket trước đó vẫn bị commit, dữ liệu nửa vời |
| **DB transaction** | Không có N+1 query ở endpoint trả danh sách (Dashboard, KDS tickets, Menu) — dùng `selectinload`/`joinedload` khi cần load quan hệ | `GET /kds/tickets` loop qua từng ticket rồi query riêng `order_item` và `menu_item` cho mỗi cái → hàng trăm query nhỏ khi nhà hàng đông bàn |
| **Pydantic validation** | Request/Response schema đúng field, đúng type, đúng enum như `api-contract.md`; dùng `Literal`/`Enum` cho các field trạng thái (status, method, role...) thay vì `str` tự do | `PaymentMethod: str` chấp nhận bất kỳ chuỗi nào thay vì `Literal["momo", "vnpay", "cash"]` → dữ liệu rác lọt vào DB |
| **Pydantic validation** | `quantity`, `amount`, `price` dùng kiểu số dương có ràng buộc (`Field(gt=0)`), không cho âm hoặc 0 | AI Gateway gửi `quantity: -1` từ intent `ADD_TO_CART` bị parse sai, backend không chặn → tồn kho/tổng tiền âm |
| **Security — PIN check (Manager Void)** | So sánh PIN dùng hàm verify hash an toàn (`bcrypt.checkpw`/`argon2.verify`), KHÔNG so sánh chuỗi thường (`==`) — tránh timing attack và lộ PIN dạng plaintext trong DB/log | `if pin_code == user.pin_hash:` — vừa sai (so sánh plaintext với hash) vừa là lỗ hổng timing attack |
| **Security — PIN check** | PIN phải đối chiếu với **tài khoản đang `is_active = true` và `role = manager`** — không cho phép PIN của tài khoản đã bị khoá hoặc không phải Manager | Endpoint chỉ check độ dài PIN đủ 6 số mà không JOIN `users` để xác nhận đúng role → Waiter tự đặt PIN 6 số bất kỳ cũng void được món |
| **Security — RBAC chung** | Mọi endpoint nhân viên đều đi qua dependency `app/auth/rbac.py`, không tự viết `if user.role == "manager"` rải rác nhiều nơi | Route CMS Menu tự check role bằng if/else riêng, quên áp dụng cho endpoint `DELETE /cms/menu/{id}` mới thêm sau → lỗ hổng phân quyền REQ-10/NFR-RO-03 |
| **Security — audit log** | Mọi hành động Void/Refund PHẢI insert `void_refund_logs` trong CÙNG transaction với việc đổi `order_items.status = void` — không log sau, không log bất đồng bộ (có thể mất log nếu crash giữa chừng) | Code đổi status trước, `await log_void(...)` gọi riêng ở dòng sau không nằm chung transaction → nếu crash giữa 2 bước, món bị void nhưng không có log đối soát |

**Quy trình áp dụng:** checklist này chạy song song với CI (`ci.yml`: `uv run pytest`) — pytest bắt lỗi logic/regression, còn bảng review này bắt các lỗi thiết kế mà unit test khó phủ hết (race condition, N+1, timing attack). Reviewer đánh dấu Pass/Fail theo từng dòng trước khi approve PR.
