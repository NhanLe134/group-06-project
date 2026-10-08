# Story Spec — US-03: Quản lý KDS (Kitchen Display System) và AI Batching

> Theo template "Story Spec" của giáo trình (§9 — Giai đoạn 7). Owner: Nhã (Engineering). Cập nhật: 2026-10-06.

| Mục | Nội dung |
| :--- | :--- |
| **Story ID** | US-03 — `docs/04-Backlog/user stories/US-03.md` |
| **Requirement IDs** | REQ-07 (Kanban KDS), REQ-08 (AI Batching), REQ-09 / BR-03 (Out of Stock sync), NFR-RO-01 (realtime < 500ms), NFR-RO-03 (RBAC CHEF/MANAGER) |
| **Design link** | `frontend/fe_ofc/pages/kitchen.html` (giao diện đã duyệt — AI Usage Log A-28 → A-41); `docs/05-Design/DESIGN.md` |
| **Kiến trúc liên quan** | ADR-ARCH-001 (Monolith), ADR-ARCH-003 (Supabase làm PostgreSQL, FastAPI là lớp duy nhất truy cập dữ liệu), `architecture.md` Mục 4 (WebSocket Pub/Sub) |

## 1. Goal

Đầu bếp nhìn thấy mọi món cần nấu theo thứ tự gọi món, chuyển trạng thái món (Chờ nấu → Đang nấu → Đã nấu), được AI gợi ý nấu chung các món trùng giữa nhiều bàn, và báo Hết hàng để E-Menu/POS khóa món ngay.

## 2. Preconditions

- Món đã được khách/phục vụ chốt gửi bếp: có dòng `chitietmon` (trạng thái mặc định `cho_nau`) thuộc `hoadon` → `phienban`.
- Thiết bị bếp mở `kitchen.html`, backend FastAPI chạy và kết nối được database (`GET /health/db` = ok).

## 3. Happy path

1. KDS gọi `GET /kds/items` + `GET /menu`, hiển thị 3 cột theo `chitietmon.trangthai`, sắp theo `giogoimon` tăng dần (FIFO).
2. KDS mở WebSocket `/ws/kds:tickets` và `/ws/menu:oos`; khi có sự kiện thì tải lại danh sách (< 500ms trong mạng LAN).
3. **AC1:** món Chờ nấu cùng `thucdon_id` đến từ ≥ 2 bàn → khung "Gợi ý nấu chung" ở đầu cột (logic phía client, thay cho AI Service sau này); đơn mới có âm "ting".
4. **AC2:** bếp bấm nút hoặc kéo thả → `PATCH /kds/items/{id}/status`; sang `da_xong` thì server phát `ITEM_READY` cho màn hình Phục vụ.
5. **Nấu/Xong từng phần:** món > 1 suất → KDS hỏi số suất → `POST /kds/items/{id}/split` tách dòng mới mang trạng thái mới, giữ `giogoimon` gốc.
6. **AC3:** bếp báo Hết hàng → `POST /menu/items/{id}/out-of-stock` (`thucdon.trangthaiban = false`) → phát `ITEM_OOS_BROADCAST` trên `menu:oos`.

## 4. Alternate / error paths

| Tình huống | Hành vi |
| :--- | :--- |
| Chuyển trạng thái không hợp lệ (vd. `da_xong` → `cho_nau`) | 409 `INVALID_STATUS_TRANSITION`; KDS báo lỗi và tải lại để hoàn tác |
| Món Chờ nấu đã hết hàng mà bếp bấm Nấu/Xong | 409 `ITEM_OUT_OF_STOCK` (chặn ở server, client không bypass được) — chỉ được `POST /kds/items/{id}/cancel-out-of-stock` |
| Xóa món hết hàng | `chitietmon.trangthai = da_huy` + ghi `loghuymon` (lý do "Hết nguyên liệu") |
| Số suất tách ≥ số suất hiện có | 422 `INVALID_SPLIT_QUANTITY` |
| Không tìm thấy món | 404 `ORDER_ITEM_NOT_FOUND` / `MENU_ITEM_NOT_FOUND` |
| **AC5** — mất mạng / backend không phản hồi | Thao tác vào hàng đợi `localStorage` (`g06-kds-queue-v2`), banner "Offline: Đang lưu cục bộ"; có mạng lại thì gửi lần lượt; thao tác bị server từ chối thì báo lỗi và bỏ |
| WebSocket rớt | Trạng thái "Đang kết nối lại…", tự nối lại sau 3 giây, trong lúc đó hỏi lại server mỗi 15 giây |
| Không tải được dữ liệu lần đầu | Màn hình "Không kết nối được máy chủ" + nút Thử lại (không treo) |

## 5. Data read / write

| Bảng | Đọc | Ghi |
| :--- | :--- | :--- |
| `chitietmon` | `id, hoadon_id, thucdon_id, soluong, trangthai, ghichu, giogoimon` | `trangthai`; `soluong` + thêm dòng mới khi tách suất |
| `thucdon` | `tenmon, trangthaiban, soluongton` (hết hàng khi tắt bán hoặc tồn = 0) | `trangthaiban` (Hết hàng / mở bán lại); `soluongton` qua `PATCH /menu/items/{id}/stock` |
| `hoadon`, `phienban` | `phienban.tenban` (tên bàn), `hoadon.trangthai = ban_nhap` (bàn bị ảnh hưởng khi hết hàng) | — |
| `loghuymon` | — | 1 dòng khi xóa món hết hàng |

Giá trị trạng thái: DB dùng `cho_nau / dang_nau / da_xong` (`frontend/fe_ofc/dtb.md`); giao diện dùng `PENDING / COOKING / READY` và ánh xạ tại lớp gọi API (`TO_API` / `FROM_API` trong `kitchen.html`). Cột `giogoimon` thêm bằng `backend/db/migrations/001_chitietmon_giogoimon.sql`.

## 6. API contract

Chi tiết request/response: `api-contract.md` Mục 6. Tóm tắt:

| Method | Path | Mục đích |
| :--- | :--- | :--- |
| GET | `/kds/items` | Món ở 3 cột KDS, FIFO |
| PATCH | `/kds/items/{id}/status` | Đổi trạng thái (AC2) |
| POST | `/kds/items/{id}/split` | Nấu/Xong từng phần |
| POST | `/kds/items/{id}/cancel-out-of-stock` | Xóa món hết hàng khỏi hàng đợi |
| POST | `/menu/items/{id}/out-of-stock`, `/in-stock` | Báo hết / mở bán lại (AC3) |
| WS | `/ws/kds:tickets`, `/ws/menu:oos` | `KDS_ITEMS_CHANGED`, `ITEM_READY`, `ITEM_OOS_BROADCAST` |
| POST | `/kds/demo/orders` | Chỉ khi `DEMO_MODE=true` — tạo đơn mẫu AC1 |

## 7. Authorization

- **Mục tiêu (AC4, NFR-RO-03):** chỉ JWT có vai trò `BEP` (CHEF) hoặc `QUAN_LY` (MANAGER) được gọi `/kds/*` và báo hết hàng; vai trò khác nhận 403 và bị chuyển về `/pos`.
- **Hiện trạng — TBD:** hệ thống đăng nhập/JWT chưa được xây (chưa có story Auth). Các endpoint KDS hiện **chưa yêu cầu token**; kiểm tra vai trò mới chỉ có ở giao diện (`g06-auth` trong `localStorage`), có thể bypass bằng cách gọi API trực tiếp. Phải bổ sung dependency kiểm tra JWT ở router `/kds` trước khi deploy thật.

## 8. Validation / business rules

- Bảng chuyển trạng thái hợp lệ (server): `cho_nau → dang_nau | da_xong`, `dang_nau → cho_nau | da_xong`, `da_xong → dang_nau`.
- BR-03: món Chờ nấu thuộc món hết hàng không được nấu tiếp.
- Tách suất: `1 ≤ soluong < soluong hiện tại`; dòng mới copy `hoadon_id, thucdon_id, ghichu, giogoimon`.
- Khóa dòng (`SELECT ... FOR UPDATE`) khi đổi trạng thái/tách suất để 2 màn hình bếp bấm cùng lúc không ghi đè nhau.

## 9. Observability / logging

- Hủy món ghi `loghuymon` (bằng chứng chống gian lận).
- `GET /health/db` dùng cho smoke test. Chưa có structured logging cho thao tác KDS — việc còn lại cho Bài cuối (§12 giáo trình).

## 10. Test plan

> Cập nhật 2026-10-07 theo testing pyramid (giáo trình §11.2). Test case đầy đủ: `testing/test_cases/test-cases-US03.md`; kết quả: `testing/reports/US-03/`.

| Tầng | Kiểm chứng | Nơi |
| :--- | :--- | :--- |
| Unit (backend) | Bảng chuyển trạng thái, bấm 2 lần, chặn nấu chỉ khi báo hết tay, số phần còn | `backend/tests/unit/` (18 test) |
| Unit (frontend) | AI gom mẻ, chữ khung Tồn kho, địa chỉ WebSocket khi deploy | `frontend/tests/kds-logic.test.js` (8 test, Vitest) |
| Integration (SQLite) | FIFO, ẩn món đã phục vụ/hủy, chuyển trạng thái, tách suất, xóa món hết hàng + log, báo hết/mở bán, trừ kho, Unicode, dữ liệu biên | `backend/tests/routers/test_kds.py`, `test_stock.py`, `test_orders.py` |
| Integration (Postgres thật) | 6 bàn tranh suất cuối — không bán vượt (TC-OP-005) | `backend/tests/pg/test_race_last_portion.py` |
| E2E (Playwright, backend E2E riêng) | AC1 realtime + gom mẻ, AC2 + màn Phục vụ, AC3 báo hết + hết nguyên liệu, AC5 offline → đồng bộ | `testing/test_scripts/tests/us03-kds.spec.ts` |
| Smoke staging (chỉ đọc) | Backend Render sống, KDS online kết nối Realtime | `testing/test_scripts/tests/us03-smoke.spec.ts` |
| Chưa có | AC4 (chờ JWT); TC-OP-002 chớp đỏ 15 phút (chưa làm); E2E/Postgres chưa chạy trong CI | — |

## 11. Definition of Done

- [ ] Spec này được viết trước khi code — **không**: spec viết sau khi đã có giao diện KDS (phát hiện khi rà soát giáo trình, AI_USAGE_LOG A-58); các phần sau (trừ kho) có spec trước.
- [x] `ruff check` sạch, `pytest` + `vitest` + Playwright pass (2026-10-07).
- [x] AC1, AC2, AC3, AC5 chạy được trên database thật và có E2E tự động.
- [x] Màn hình Phục vụ nhận `ITEM_READY`; E-Menu nhận `menu:oos` (A-72).
- [ ] AC4 kiểm tra quyền ở server (chờ story Auth/JWT).
- [ ] PR có Story ID + review của thành viên khác trước khi merge (PR `feature/US-03-tests`).
- [x] Độ trễ đơn mới < 500 ms (NFR-RO-01): trung vị 217 ms trên 5 mẫu (2026-10-08). Lần đo 1 mẫu ngày 07/10 (635 ms) là đơn đầu tiên lúc trang vừa mở — đã sửa cách đo. Chưa đo dưới tải 50 bàn.
