# TEST CASES CHI TIẾT — US-03: KDS BẾP & AI BATCHING

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US03.md`
> **User Story:** US-03 — Quản lý KDS (Kitchen Display System) và AI Batching (`docs/04-Backlog/user stories/US-03.md`)
> **Story Spec:** `vault/06-Engineering/story-spec-us03-kds.md`, `vault/06-Engineering/story-spec-tru-kho-tu-dong.md`
> **Người thực hiện (Who checked):** Nhã (owner US-03, AI hỗ trợ viết và chạy test — AI_USAGE_LOG A-93)
> **Ngày chạy:** 2026-10-07, chạy lại 2026-10-08 sau ADR-N14 (bắt được BUG-US03-004) · **Trạng thái kiểm thử:** `Tested` — kết quả ở `testing/reports/US-03/`
> **Màn hình kiểm thử:** `frontend/fe_ofc/pages/kitchen.html` (KDS), `customer.html` (E-Menu), `waiter.html` (Phục vụ)
> **Yêu cầu liên quan:** `REQ-07`, `REQ-08`, `REQ-09`, `BR-03`, `BR-06`, `NFR-RO-01`, `NFR-RO-03`

## Môi trường & cách chạy

| Tầng (giáo trình §11.2) | Công cụ | Lệnh | Môi trường dữ liệu |
|---|---|---|---|
| Unit | pytest, Vitest | `cd backend && uv run pytest tests/unit` · `cd frontend && npx vitest run` | Không DB |
| Integration | pytest + httpx | `cd backend && uv run pytest tests/routers` | SQLite trong bộ nhớ |
| Integration (tranh chấp) | pytest + Postgres thật | xem đầu file `backend/tests/pg/test_race_last_portion.py` | Postgres Docker tạm (không phải Supabase) |
| E2E | Playwright (Edge) | `cd testing/test_scripts && npx playwright test -c playwright.us03.config.ts` | Backend E2E riêng, SQLite tạm (`backend/scripts/e2e_server.py`) |
| Smoke staging | Playwright | `... -c playwright.us03.config.ts --project=staging-smoke` | Vercel + Render thật, **chỉ đọc** |

Cột **Mode**: `Unit` / `Integration` / `E2E` / `Manual`. Cột **Comment** ghi tên test tự động chứng minh test case.

## BẢNG TEST CASES — US-03

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-OP-001** | KDS nhận đơn mới real-time, không F5 | `US-03` AC1<br>`REQ-07` | KDS đang mở, trạng thái "Realtime". | 1. Khách gửi bếp `POST /orders`.<br>2. Quan sát cột Chờ nấu. | 1.1 Đơn hợp lệ, món còn hàng. | `Bàn E2E-01`, 1× Bánh flan | High | E2E + Integration | Thẻ "Bàn E2E-01" hiện ở cột Chờ nấu, toast "Đơn mới — Bàn E2E-01", có tiếng "ting". Server phát `KDS_ITEMS_CHANGED`. | `Pass` | 2026-10-07 | Nhã | - | `us03-kds.spec.ts` TC-OP-001; `test_orders.py::test_gui_bep_phat_su_kien_kds` |
| **TC-OP-KDS-013** | Độ trễ từ gửi bếp tới thẻ hiện trên KDS | `US-03`<br>`NFR-RO-01` (< 500 ms) | Như TC-OP-001. | Đo thời gian từ lúc API trả về tới lúc thẻ hiện. | Mạng local. | - | Medium | E2E | Mục tiêu < 500 ms. | `Pass một phần` — đo được **710 ms** (07/10: 635 ms; > 500 ms, < 1 s) | 2026-10-08 | Nhã | - | Có debounce 150 ms + tải lại `GET /kds/items` sau sự kiện. Cần tối ưu nếu PO giữ mục tiêu 500 ms. |
| **TC-OP-KDS-001** | AI gom mẻ "Gợi ý nấu chung" | `US-03` AC1<br>`REQ-08` | 2 bàn khác nhau gọi cùng món. | 1. Bàn A gửi 2 Phở.<br>2. Bàn B gửi 1 Phở. | - | `Bàn E2E-02A` 2×, `Bàn E2E-02B` 1× Phở bò | High | Unit + E2E | Mẻ "3× Phở bò" có nhãn "Gợi ý nấu chung", liệt kê 2 bàn, đứng đầu cột Chờ nấu; mẻ nhiều suất đứng trước. | `Pass` (08/10 sau khi sửa; trước đó **Fail**) | 2026-10-08 | Nhã | BUG-US03-004 | `kds-logic.test.js` (aiBatching); `us03-kds.spec.ts` TC-OP-KDS-001 |
| **TC-OP-KDS-002** | Không gom mẻ sai | `US-03` AC1 | - | Gom với: cùng 1 bàn; món không ở Chờ nấu; món bếp đã báo hết; danh sách rỗng. | - | - | Medium | Unit | Không tạo mẻ trong cả 4 trường hợp. | `Pass` | 2026-10-07 | Nhã | - | `kds-logic.test.js` |
| **TC-OP-KDS-003** | Thứ tự FIFO, ẩn món đã phục vụ/đã hủy | `US-03` AC1 | Có món ở nhiều trạng thái. | `GET /kds/items` | - | - | Medium | Integration | Món cũ nhất trước; không trả `da_phuc_vu`, `da_huy`. | `Pass` | 2026-10-07 | Nhã | - | `test_kds.py::test_list_items_*` |
| **TC-OP-KDS-004** | Bấm "Xong" → lưu DB + báo Phục vụ | `US-03` AC2<br>`REQ-07` | KDS và trang Phục vụ cùng mở. | 1. Gửi bếp 1 Gỏi cuốn.<br>2. Bếp bấm **Xong** trên thẻ. | - | `Bàn E2E-03`, 1× Gỏi cuốn | High | E2E + Integration | Thẻ sang cột Đã nấu; DB `chitietmon.trangthai = da_xong`; trang Phục vụ hiện thẻ thông báo "Bàn E2E-03 … Gỏi cuốn" (sự kiện `ITEM_READY`). | `Pass` | 2026-10-07 | Nhã | - | `us03-kds.spec.ts` TC-OP-KDS-004; `test_kds.py::test_update_status_valid_transitions` |
| **TC-OP-KDS-005** | Chuyển trạng thái sai / bấm 2 lần | `US-03` AC2<br>(§11.3 double click) | Thẻ đã ở Đã nấu. | Gửi "Xong" lần 2; nhảy lùi 2 bước; đổi món đã hủy. | - | - | High | Unit + Integration | 409 `INVALID_STATUS_TRANSITION`, dữ liệu không đổi. | `Pass` | 2026-10-07 | Nhã | - | `test_kds_rules.py`; `test_kds.py::test_double_click_done_second_request_is_409` |
| **TC-OP-KDS-006** | Nấu/Xong từng phần (tách suất) | `US-03` AC2 | Món 10 suất. | Tách 4 suất sang Đang nấu. | Số tách < số hiện có. | 4/10 | Medium | Integration | Dòng gốc còn 6, dòng mới 4 cùng giờ gọi; tách ≥ số hiện có → 422. | `Pass` | 2026-10-07 | Nhã | - | `test_kds.py::test_split_*` |
| **TC-OP-KDS-007** | Hoàn tác (lùi 1 bước) | `US-03` AC2 | Thẻ ở Đã nấu. | Bấm **Hoàn tác**. | - | - | Low | Unit | Về Đang nấu. | `Pass` | 2026-10-07 | Nhã | - | `test_kds_rules.py::test_allowed_transitions_forward_and_one_step_back` |
| **TC-OP-003** | Bếp báo hết → E-Menu khóa món < 1 s | `US-03` AC3<br>`REQ-09`, `BR-03` | KDS và E-Menu khách cùng mở. | 1. Khung Tồn kho → **Báo hết** "Salad cá ngừ".<br>2. Xác nhận trong hộp thoại. | Có hộp xác nhận (tránh bấm nhầm). | Salad cá ngừ | High | E2E + Integration | E-Menu gỡ món không cần F5 trong < 1 s; KDS ghi "Hết hàng". | `Pass` — đồng bộ **117 ms** (07/10: 41 ms) | 2026-10-08 | Nhã | - | E-Menu **ẩn** món (theo ADR-N11 của US-01), không làm xám. `us03-kds.spec.ts` TC-OP-003; `test_kds.py::test_mark_out_of_stock_then_in_stock` |
| **TC-OP-KDS-008** | Món chờ nấu của món đã báo hết | `US-03` AC3<br>`BR-03` | Món bị báo hết, còn thẻ Chờ nấu. | 1. Bấm Nấu.<br>2. Bấm Xóa khỏi hàng đợi. | - | - | High | Unit + Integration | Nấu bị chặn 409 `ITEM_OUT_OF_STOCK`; xóa → `da_huy` + ghi `loghuymon` + hoàn kho. | `Pass` | 2026-10-07 | Nhã | - | `test_kds_rules.py`; `test_kds.py::test_cancel_out_of_stock_*`; `test_stock.py::test_kitchen_cancel_returns_stock` |
| **TC-OP-KDS-009** | Mở bán lại khi kho vẫn hết | `US-03` AC3 | Nguyên liệu không đủ 1 phần. | Bấm **Mở bán lại**. | - | - | Medium | Integration | 409 `STOCK_EMPTY`; nhập thêm hàng → tự bán lại + phát realtime. | `Pass` | 2026-10-07 | Nhã | - | `test_stock.py::test_reopen_rejected_while_ingredient_is_empty` |
| **TC-OP-KDS-010** | Hết nguyên liệu → tự khóa món (không cần bấm) | `US-03` AC3<br>Spec trừ kho AC3, AC6 | Kho bò 0.3 kg, Phở cần 0.2 kg/phần. | Gửi bếp 1 Phở. | - | `Bàn E2E-05` | High | E2E + Unit + Integration | E-Menu xám "Hết hàng"; KDS ghi "Hết nguyên liệu"; mọi món dùng chung bò cùng khóa; **thẻ đã gửi vẫn bấm Nấu được**. | `Pass` | 2026-10-07 | Nhã | BUG-US03-001 | `us03-kds.spec.ts` TC-OP-KDS-010; `test_stock.py::test_running_out_locks_every_dish_sharing_the_ingredient` |
| **TC-OP-005** | Tranh chấp suất cuối (nhiều bàn cùng gửi) | `US-03`<br>`BR-06`, §11.3 Concurrency | Còn đúng 2 phần (chế biến) / 3 hũ (mua sẵn). | 6 bàn gửi bếp cùng lúc, mỗi bàn 1 kết nối DB. | Postgres thật. | 6 request đồng thời | High | Integration (Postgres) | Đúng 2 (hoặc 3) đơn thành công, còn lại 409; tồn = 0, không âm. | `Pass` | 2026-10-07 | Nhã | - | `tests/pg/test_race_last_portion.py`. Đã thử bỏ khóa dòng → 6/6 đơn qua (bán vượt) → test bắt được. |
| **TC-OP-KDS-015** | Dữ liệu biên / sai | `US-03`<br>§11.3 Boundary | - | Gửi số lượng 0; tồn nguyên liệu âm; định lượng 0; thiếu 0.01 kg. | - | - | Medium | Unit + Integration | 422, kho không đổi; thiếu 0.01 kg là không đủ 1 phần. | `Pass` | 2026-10-07 | Nhã | - | `test_stock.py::test_boundary_inputs_rejected_and_stock_untouched`; `test_stock_rules.py` |
| **TC-OP-KDS-012** | Ghi chú tiếng Việt + emoji | `US-03`<br>§11.3 Unicode | - | Gửi bếp ghi chú "Không hành, ít cay 🌶️ — thêm chanh". | - | - | Low | Integration | KDS hiện nguyên vẹn. | `Pass` | 2026-10-07 | Nhã | - | `test_kds.py::test_vietnamese_and_emoji_note_shown_unchanged_on_kds` |
| **TC-OP-KDS-014** | Khung Tồn kho hiện đúng theo loại món | `US-03`<br>Spec trừ kho Mục 3 | - | Hiển thị món mua sẵn / chế biến / chưa có công thức / hết. | - | - | Medium | Unit + E2E | "Còn N", "Chưa có công thức", "Hết hàng", "Hết nguyên liệu" đúng từng trường hợp. | `Pass` | 2026-10-07 | Nhã | BUG-US03-002 | `kds-logic.test.js` (stockLabel); `test_stock_rules.py` |
| **TC-OP-004** | Mất mạng tại bếp rồi có mạng lại | `US-03` AC5 | KDS đang Realtime. | 1. Ngắt mạng.<br>2. Bấm Xong.<br>3. Bật lại mạng. | - | `Bàn E2E-06` | High | E2E | Không treo; banner "Offline: Đang lưu cục bộ"; server vẫn `cho_nau`; có mạng → tự đồng bộ `da_xong`, banner ẩn. | `Pass` | 2026-10-07 | Nhã | - | `us03-kds.spec.ts` TC-OP-004 (`context.setOffline`) |
| **TC-OP-KDS-011** | Phục vụ vào KDS bị chặn 403 | `US-03` AC4<br>`NFR-RO-03` | Tài khoản role WAITER. | Mở `/kds`. | JWT role WAITER. | - | High | E2E | 403, chuyển về `/pos`. | `Blocked` | 2026-10-07 | Nhã | - | Chờ story Auth/JWT (A-84). Test để `skip` có lý do. |
| **TC-OP-002** | Thẻ quá 15 phút chớp đỏ, đẩy lên đầu | `REQ-08` | Thẻ chờ > 15 phút. | Theo dõi KDS. | - | - | Medium | E2E | Thẻ chớp đỏ, lên đầu. | `Not implemented` | 2026-10-07 | Nhã | - | REQ-08 có nhưng **không nằm trong 5 AC của US-03** → chờ PO quyết có làm không. |
| **TC-OP-KDS-016** | Smoke trên staging (chỉ đọc) | `US-03`<br>Giáo trình §12 | Bản Vercel + Render đang chạy. | Gọi `/health`, `/menu`; mở KDS online. | Không ghi dữ liệu. | - | High | E2E (smoke) | 200; `/menu` có trường `portions`; KDS hiện "Bếp KDS" + "Realtime". | `Pass` | 2026-10-07 | Nhã | - | `us03-smoke.spec.ts` |
| **TC-OP-KDS-018** | KDS đọc đúng dữ liệu API sau khi đổi thiết kế DB | `US-03` AC1, AC3<br>ADR-N14 | API trả `mon_id`, `phieuban_id`. | Đổi KdsItem sang thẻ; gom mẻ 2 món khác nhau. | - | - | High | Unit + E2E | Thẻ có đúng mã món, mã phiếu; 2 món khác nhau không bị gom chung; vẫn đọc tên trường cũ. | `Pass` | 2026-10-08 | Nhã | BUG-US03-004 | `kds-logic.test.js` (fromApi) |
| **TC-OP-KDS-017** | Địa chỉ WebSocket đúng khi deploy | `US-03` | Trang chạy trên Vercel (https). | Tính địa chỉ WS từ `APP_CONFIG.API_BASE_URL`. | - | - | Medium | Unit | `wss://group06-restaurant-api.onrender.com`. | `Pass` | 2026-10-07 | Nhã | BUG-US03-003 | `kds-logic.test.js` (wsBaseFrom) |

## Tổng kết lần chạy 2026-10-08 (sau khi gộp ADR-N14)

| Tầng | Số test | Kết quả |
|---|---|---|
| Unit backend (`tests/unit`) | 18 | 18 pass |
| Unit frontend (Vitest) | 11 | 11 pass |
| Integration (`tests/routers`, phần US-03 + trừ kho) | 31 | 31 pass |
| Integration Postgres (`tests/pg`) | 2 | 2 pass |
| E2E local (US-03) | 8 | 6 pass, 2 skip (AC4 chờ JWT, TC-OP-002 chưa làm) |
| Smoke staging | 2 | 2 pass |

Toàn bộ backend: 87 test pass (gồm cả test của thành viên khác). Bằng chứng: `testing/reports/US-03/`.
