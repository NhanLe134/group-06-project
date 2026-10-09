# TEST CASES CHI TIẾT — US-03: KDS BẾP & AI BATCHING

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US03.md`
> **User Story:** US-03 — Quản lý KDS (Kitchen Display System) và AI Batching (`docs/04-Backlog/user stories/US-03.md`)
> **Story Spec:** `vault/06-Engineering/story-spec-us03-kds.md`, `vault/06-Engineering/story-spec-tru-kho-tu-dong.md`
> **Người thực hiện (Who checked):** Nhã (owner US-03; AI hỗ trợ viết và chạy test — AI_USAGE_LOG A-93, A-96…A-98, A-105)
> **Lần chạy:** 2026-10-07; **chạy lại 2026-10-08** sau khi gộp thiết kế DB ADR-N14 · Kết quả: `testing/reports/US-03/`
> **Màn hình kiểm thử:** `frontend/fe_ofc/pages/kitchen.html` (KDS), `customer.html` (E-Menu), `waiter.html` (Phục vụ)
> **Giao diện:** KDS dùng chung `assets/css/design-system.css` (Design System của Nhàn, 2026-10-09).
> **Lưu ý 2026-10-09:** từ `fix(bug-wt-002)` (Trang), **món "Đồ uống" không hiện trên KDS** (phục vụ tự mang ra) — dữ liệu test KDS dùng món ăn.
> **Yêu cầu liên quan:** `REQ-07`, `REQ-08`, `REQ-09`, `BR-03`, `BR-06`, `NFR-RO-01`, `NFR-RO-03`
> **Cấu hình bảng:** cùng mẫu 15 cột với `testing/test-cases.md` (Ny). Cột **Mode**: `Automated` / `Manual/E2E` như file tổng; tầng test (Unit / Integration / E2E) ghi ở cột **Comment**. Cột **Testing Result**: `Passed` · `Failed` · `Blocked` (chưa thể chạy vì tính năng/điều kiện chưa có) · `Un-tested`.

## Liên kết với `testing/test-strategy.md` (Ny)

| Mã chiến lược | Nội dung | Test case ở file này |
|---|---|---|
| `UT-02` | Kiểm tra tồn kho, từ chối nếu vượt | TC-OP-KDS-010, TC-OP-KDS-015 |
| `UT-05` | Đồng hồ KDS, chớp đỏ > 15 phút | TC-OP-002 |
| `UT-06` | Máy trạng thái chuyển trạng thái món | TC-OP-KDS-005, TC-OP-KDS-007 |
| `IT-02` | Đơn mới → KDS nhận sự kiện WebSocket < 1 s | TC-OP-001, TC-OP-KDS-013 |
| `IT-03` | Bếp báo hết → E-Menu/Phục vụ khóa món < 1 s | TC-OP-003, TC-OP-KDS-010 |
| `IT-06` | Tranh chấp suất cuối / đơn trùng lúc bếp báo hết → 409, tồn ≥ 0 | TC-OP-005 |

Khác chiến lược ở tên sự kiện: hệ thống dùng `KDS_ITEMS_CHANGED`, `ITEM_READY`, `ITEM_OOS_BROADCAST` (`vault/06-Engineering/api-contract.md` Mục 5–6) thay cho `ORDER_CREATED`, `ORDER_ITEM_DONE`, `ITEM_OOS`.

## Môi trường & cách chạy

| Tầng | Công cụ | Môi trường dữ liệu |
|---|---|---|
| Unit | pytest (`backend/tests/unit/`), Vitest (`frontend/tests/`) | Không DB |
| Integration | pytest + httpx (`backend/tests/routers/`) | SQLite trong bộ nhớ |
| Integration (tranh chấp) | pytest + Postgres thật (`backend/tests/pg/`) | Postgres Docker tạm (không phải Supabase) |
| E2E | Playwright, Edge (`testing/test_scripts/`, `playwright.us03.config.ts`) | Backend E2E riêng, SQLite tạm (`backend/scripts/e2e_server.py`); dữ liệu `data/kds.ts` |
| Smoke staging | Playwright `--project=staging-smoke` | Vercel + Render thật, **chỉ đọc** |

Lệnh chạy (PowerShell): xem `testing/reports/US-03/README.md`.

## BẢNG TEST CASES — US-03

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-OP-001** | KDS nhận đơn mới real-time, không F5 | `US-03` AC1<br>`REQ-07`, `IT-02` | KDS đang mở, trạng thái "Realtime". | 1. Khách gửi bếp `POST /orders`.<br>2. Quan sát cột Chờ nấu. | 1.1 Đơn hợp lệ, món còn hàng. | `Bàn E2E-01`, Bánh flan | High | Automated | Thẻ hiện ở cột Chờ nấu không cần F5, toast "Đơn mới — Bàn E2E-01", có tiếng "ting". Server phát `KDS_ITEMS_CHANGED`. | `Passed` | 2026-10-08 | Nhã | - | E2E `us03-kds.spec.ts`; Integration `test_orders.py::test_gui_bep_phat_su_kien_kds`. Từ 2026-10-09 thẻ có đồng hồ chờ `⏱ mm:ss` (TC-OP-002). |
| **TC-OP-KDS-013** | Độ trễ gửi bếp → thẻ hiện trên KDS | `US-03`<br>`NFR-RO-01` (< 500 ms), `IT-02` | Như TC-OP-001. | Gửi 5 đơn liên tiếp, đo từ lúc API trả về tới lúc thẻ hiện. | Mạng local. | 5 mẫu | Medium | Automated | Trung vị < 500 ms. | `Passed` — trung vị **217 ms**, lớn nhất 311 ms (mẫu: 311, 208, 215, 230, 217) | 2026-10-08 | Nhã | - | E2E. Mẫu chậm nhất luôn là **đơn đầu tiên** sau khi mở trang. Lần đo 07/10 chỉ lấy 1 mẫu (đúng đơn đầu) nên ra 635–710 ms và ghi nhầm là chưa đạt — đã sửa cách đo. Đo trên máy local, chưa đo dưới tải 50 bàn (k6) như chiến lược §3. |
| **TC-OP-KDS-001** | AI gom mẻ "Gợi ý nấu chung" | `US-03` AC1<br>`REQ-08` | 2 bàn khác nhau gọi cùng món. | 1. Bàn A gửi 2 Phở.<br>2. Bàn B gửi 1 Phở. | - | `Bàn E2E-02A` 2×, `Bàn E2E-02B` 1× Phở bò | High | Automated | Mẻ "3× Phở bò" nhãn "Gợi ý nấu chung", liệt kê 2 bàn, đứng đầu cột Chờ nấu; mẻ nhiều suất đứng trước. | `Passed` | 2026-10-08 | Nhã | BUG-US03-004 | Unit `kds-logic.test.js` (aiBatching) + E2E. **Lần chạy 08/10 trước khi sửa: `Failed`** (gom mọi món thành "4× Món" sau ADR-N14). |
| **TC-OP-KDS-002** | Không gom mẻ sai | `US-03` AC1 | - | Gom với: cùng 1 bàn; món không ở Chờ nấu; món bếp đã báo hết; danh sách rỗng; 2 món khác nhau. | - | - | Medium | Automated | Không tạo mẻ trong mọi trường hợp. | `Passed` | 2026-10-08 | Nhã | - | Unit `kds-logic.test.js` |
| **TC-OP-KDS-003** | FIFO, ẩn món đã phục vụ/đã hủy | `US-03` AC1 | Có món ở nhiều trạng thái. | `GET /kds/items` | - | - | Medium | Automated | Món cũ nhất trước; không trả `da_phuc_vu`, `da_huy`. | `Passed` | 2026-10-08 | Nhã | - | Integration `test_kds.py::test_list_items_*` |
| **TC-OP-KDS-004** | Bấm "Xong" → lưu DB + báo Phục vụ | `US-03` AC2<br>`REQ-07` | KDS và trang Phục vụ cùng mở. | 1. Gửi bếp 1 Gỏi cuốn.<br>2. Bếp bấm **Xong**. | - | `Bàn E2E-03`, Gỏi cuốn | High | Automated | Thẻ sang cột Đã nấu; DB `trangthai = da_xong`; trang Phục vụ hiện thông báo "Bàn E2E-03 … Gỏi cuốn" (`ITEM_READY`). | `Passed` | 2026-10-08 | Nhã | - | E2E + Integration `test_update_status_valid_transitions`. Từ 2026-10-09 trang Phục vụ (Trang, US-10) **gom thông báo theo bàn 10 giây** rồi mới hiện → E2E chờ tối đa 15 s. |
| **TC-OP-KDS-005** | Chuyển trạng thái sai / bấm 2 lần | `US-03` AC2<br>`UT-06`, §11.3 double click | Thẻ đã ở Đã nấu. | Gửi "Xong" lần 2; nhảy lùi 2 bước; đổi món đã hủy. | - | - | High | Automated | 409 `INVALID_STATUS_TRANSITION`, dữ liệu không đổi. | `Passed` | 2026-10-08 | Nhã | - | Unit `test_kds_rules.py`; Integration `test_double_click_done_second_request_is_409` |
| **TC-OP-KDS-006** | Nấu/Xong từng phần (tách suất) | `US-03` AC2 | Món 10 suất. | Tách 4 suất sang Đang nấu. | Số tách < số hiện có. | 4/10 | Medium | Automated | Dòng gốc còn 6, dòng mới 4 cùng phiếu; tách ≥ số hiện có → 422. | `Passed` | 2026-10-08 | Nhã | - | Integration `test_kds.py::test_split_*` |
| **TC-OP-KDS-007** | Hoàn tác (lùi 1 bước) | `US-03` AC2<br>`UT-06` | Thẻ ở Đã nấu. | Bấm **Hoàn tác**. | - | - | Low | Automated | Về Đang nấu. | `Passed` | 2026-10-08 | Nhã | - | Unit `test_allowed_transitions_forward_and_one_step_back` |
| **TC-OP-003** | Bếp báo hết → E-Menu khóa món < 1 s | `US-03` AC3<br>`REQ-09`, `BR-03`, `IT-03` | KDS và E-Menu cùng mở. | 1. Khung Tồn kho → **Báo hết** "Salad cá ngừ".<br>2. Xác nhận hộp thoại. | Có hộp xác nhận. | Salad cá ngừ | High | Automated | E-Menu khóa món không cần F5 trong < 1 s; KDS ghi "Hết hàng". | `Passed` — đồng bộ **52 ms** | 2026-10-08 | Nhã | - | E2E + Integration. Kỳ vọng gốc "mờ xám": món bếp báo hết bị **ẩn** khỏi E-Menu theo ADR-N11 (US-01, Nhàn); món hết do nguyên liệu thì **xám** (TC-OP-KDS-010). Chưa kiểm Tablet Phục vụ (chưa hiển thị thực đơn). |
| **TC-OP-KDS-008** | Món Chờ nấu của món đã báo hết | `US-03` AC3<br>`BR-03` | Món bị báo hết, còn thẻ Chờ nấu. | 1. Bấm Nấu.<br>2. Bấm Xóa khỏi hàng đợi. | - | - | High | Automated | Nấu bị chặn 409 `ITEM_OUT_OF_STOCK`; xóa → `da_huy` + `loghuymon` + hoàn kho. | `Passed` | 2026-10-08 | Nhã | - | Unit + Integration `test_cancel_out_of_stock_*`, `test_kitchen_cancel_returns_stock` |
| **TC-OP-KDS-009** | Mở bán lại khi kho vẫn hết | `US-03` AC3 | Nguyên liệu không đủ 1 phần. | Bấm **Mở bán lại**. | - | - | Medium | Automated | 409 `STOCK_EMPTY`; nhập thêm hàng → tự bán lại + phát realtime. | `Passed` | 2026-10-08 | Nhã | - | Integration `test_reopen_rejected_while_ingredient_is_empty` |
| **TC-OP-KDS-010** | Hết nguyên liệu → tự khóa món | `US-03` AC3<br>`UT-02`, `IT-03` | Kho bò 0.3 kg, Phở 0.2 kg/phần. | Gửi bếp 1 Phở. | - | `Bàn E2E-05` | High | Automated | E-Menu xám "Hết"; KDS "Hết nguyên liệu"; mọi món dùng chung bò cùng khóa; **thẻ đã gửi vẫn nấu được**. | `Passed` | 2026-10-08 | Nhã | BUG-US03-001 | E2E + Integration `test_running_out_locks_every_dish_sharing_the_ingredient` |
| **TC-OP-005** | Tranh chấp: nhiều bàn tranh suất cuối; đơn gửi đúng lúc bếp báo hết | `US-03`<br>`BR-06`, `IT-06` | (a) Còn 2 phần / 3 hũ. (b) Bếp đang bấm "Báo hết" (giữ khóa, chưa commit). | (a) 6 bàn gửi cùng lúc.<br>(b) 1 bàn gửi trong lúc bếp đang báo hết; bếp commit trước. | Postgres thật, mỗi bàn 1 kết nối. | 6 request đồng thời | High | Automated | (a) Đúng 2 / 3 đơn thành công, còn lại 409, tồn = 0, không âm.<br>(b) Đơn đến sau bị 409, tồn không đổi. | `Passed` | 2026-10-08 | Nhã | BUG-US03-005 | Integration Postgres `tests/pg/test_race_last_portion.py` (3 test). (b) **`Failed` trước khi sửa** — đơn vẫn được nhận sau khi bếp đã báo hết. Thử bỏ khóa dòng → (a) bán vượt 6/6 → test bắt được. |
| **TC-OP-KDS-015** | Dữ liệu biên / sai | `US-03`<br>`UT-02`, §11.3 Boundary | - | Số lượng 0; tồn nguyên liệu âm; định lượng 0; thiếu 0.01 kg. | - | - | Medium | Automated | 422, kho không đổi; thiếu 0.01 kg là không đủ 1 phần. | `Passed` | 2026-10-08 | Nhã | - | Unit `test_stock_rules.py`; Integration `test_boundary_inputs_rejected_and_stock_untouched` |
| **TC-OP-KDS-012** | Ghi chú tiếng Việt + emoji | `US-03`<br>§11.3 Unicode | - | Gửi bếp ghi chú "Không hành, ít cay 🌶️ — thêm chanh". | - | - | Low | Automated | KDS hiện nguyên vẹn. | `Passed` | 2026-10-08 | Nhã | - | Integration `test_vietnamese_and_emoji_note_shown_unchanged_on_kds` |
| **TC-OP-KDS-014** | Khung Tồn kho hiện đúng theo loại món | `US-03`<br>Spec trừ kho Mục 3 | - | Món mua sẵn / chế biến / chưa có công thức / hết. | - | - | Medium | Automated | "Còn N", "Chưa có công thức", "Hết hàng", "Hết nguyên liệu" đúng từng trường hợp. | `Passed` | 2026-10-08 | Nhã | BUG-US03-002 | Unit `kds-logic.test.js` (stockLabel), `test_stock_rules.py` |
| **TC-OP-004** | Mất mạng tại bếp rồi có mạng lại | `US-03` AC5<br>(Reliability) | KDS đang Realtime. | 1. Ngắt mạng.<br>2. Bấm Xong.<br>3. Khách gửi đơn mới.<br>4. Bật lại mạng. | - | `Bàn E2E-06`, `Bàn E2E-07` | High | Automated | Không treo; banner "Offline: Đang lưu cục bộ"; server vẫn `cho_nau`; có mạng → tự đồng bộ `da_xong`, banner ẩn, **đơn gửi lúc mất mạng hiện ra** (nhận bù ticket bị nhỡ). | `Passed` | 2026-10-08 | Nhã | - | E2E (`context.setOffline`). |
| **TC-OP-KDS-016** | Smoke trên staging (chỉ đọc) | `US-03`<br>Giáo trình §12 | Bản Vercel + Render đang chạy. | Gọi `/health`, `/menu`; mở KDS online. | Không ghi dữ liệu. | - | High | Automated | 200; `/menu` có `portions`; KDS hiện "Bếp KDS" + "Realtime". | `Passed` (2026-10-07) | 2026-10-07 | Nhã | - | E2E smoke `us03-smoke.spec.ts`. Chạy lại sau khi staging deploy bản có sửa BUG-US03-004/005. |
| **TC-OP-KDS-017** | Địa chỉ WebSocket đúng khi deploy | `US-03` | Trang chạy trên Vercel (https). | Tính địa chỉ WS từ `APP_CONFIG.API_BASE_URL`. | - | - | Medium | Automated | `wss://group06-restaurant-api.onrender.com`. | `Passed` | 2026-10-08 | Nhã | BUG-US03-003 | Unit `kds-logic.test.js` (wsBaseFrom) |
| **TC-OP-KDS-018** | KDS đọc đúng dữ liệu API sau khi đổi thiết kế DB | `US-03` AC1, AC3<br>ADR-N14 | API trả `mon_id`, `phieuban_id`. | Đổi KdsItem sang thẻ; gom mẻ 2 món khác nhau. | - | - | High | Automated | Đúng mã món, mã phiếu; 2 món khác nhau không gom chung; vẫn đọc tên trường cũ. | `Passed` | 2026-10-08 | Nhã | BUG-US03-004 | Unit `kds-logic.test.js` (fromApi) |
| **TC-OP-KDS-019** | Log backend cho luồng KDS + lỗi 500 | `US-03`<br>Giáo trình §12 (logging), viva §16.3 | Backend đang chạy. | 1. Gửi bếp, bếp bấm Xong, báo hết.<br>2. Gửi đơn vượt tồn.<br>3. Giả lập lỗi DB ở `GET /kds/items`. | - | Ghi chú khách "Không đá — dị ứng lạnh" | Medium | Automated | (1) Có log `order_sent_to_kitchen`, `stock_reserved`, `kds_status`, `menu_availability`, `request`.<br>(2) `stock_rejected` + `api_error status=409`.<br>(3) Client nhận 500 `INTERNAL_ERROR` chung, không lộ chi tiết; log ERROR `unhandled_error` có traceback. Log không chứa ghi chú khách. | `Passed` | 2026-10-09 | Nhã | - | Integration `test_logging.py` (3 test). Thử bỏ bộ bắt lỗi 500 → test fail. Cách xem log: `docs/RUNBOOK.md` Mục 7. |
| **TC-OP-KDS-011** | Phục vụ vào KDS bị chặn 403 | `US-03` AC4<br>`NFR-RO-03` | Tài khoản role WAITER. | Mở `/kds`. | JWT role WAITER. | - | High | Manual/E2E | 403, chuyển về `/pos`. | `Blocked` | 2026-10-08 | Nhã | - | Chờ story Auth/JWT (AI_USAGE_LOG A-84). Test để `skip` có lý do. |
| **TC-OP-002** | Thẻ quá 15 phút chớp đỏ, đẩy lên đầu | `REQ-08`<br>`UT-05` | Món ở Chờ nấu / Đang nấu. | 1. Gửi bếp 1 Gỏi cuốn.<br>2. Tua đồng hồ trình duyệt 15:10. | Đúng 15:00 chưa tính là quá. | `Bàn E2E-08` | Medium | Automated | Mỗi thẻ / dòng trong mẻ hiện đồng hồ chờ `⏱ mm:ss` chạy từng giây; quá 15 phút: viền đỏ + nền nhấp nháy + nhãn "Chờ quá 15 phút", khối đó lên đầu cột. Bật giảm chuyển động → không nhấp nháy, giữ viền + nhãn. | `Passed` | 2026-10-09 | Nhã | - | Unit `kds-logic.test.js` (waitLabel, isOverdue biên 15:00, overdueFirst) + E2E `us03-kds.spec.ts` (`page.clock`). Làm theo yêu cầu của nhóm (tin nhắn design system của Nhàn, A-125). |

## Tổng kết lần chạy 2026-10-08

| Tầng | Số test | Kết quả |
|---|---|---|
| Unit backend (`tests/unit`) | 18 | 18 pass |
| Unit frontend (Vitest) | 14 | 14 pass |
| Integration (`test_kds.py` 23, `test_stock.py` 11, `test_logging.py` 3, `test_orders.py` 1) | 38 | 38 pass |
| Integration Postgres (`tests/pg`) | 3 | 3 pass |
| E2E local (US-03) | 8 | 7 pass, 1 skip (AC4 `Blocked`) |
| Smoke staging | 2 | 2 pass (07/10) |

Test case: 23 `Passed`, 0 `Failed`, 1 `Blocked` (AC4 chờ JWT). 2026-10-09: thêm TC-OP-KDS-019 (log); TC-OP-002 từ `Blocked` → `Passed`. Bằng chứng, độ phủ code, tỉ lệ tầng: `testing/reports/US-03/README.md`.
