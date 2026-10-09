# TEST CASES CHI TIẾT — US-09: KHÁCH XEM HÓA ĐƠN TẠM TÍNH CỦA BÀN

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US09.md` (file mới — 09/10/2026; trước đây US-09 chưa có bộ test case riêng)
> **User Story:** US-09 — Khách xem Hóa đơn tạm tính của bàn (`docs/04-Backlog/user stories/US-09.md` — đã đồng bộ 4 trạng thái phục vụ + ADR-N13/N14)
> **Người thực hiện (Who checked):** Nhàn (owner US-09; AI hỗ trợ viết testcase — AI_USAGE_LOG A-N70, A-N72)
> **Lần chạy:** chưa chạy (`Un-tested`) — evidence sẽ lưu `testing/reports/US-09/`
> **Màn hình kiểm thử:** `frontend/fe_ofc/pages/customer.html` (trang Hóa đơn), script `frontend/fe_ofc/assets/js/HoaDon.js`; backend `GET /orders/current`
> **Yêu cầu liên quan:** `BR-05`, `US-07` (Price Snapshot), `NFR-RO-04`, `ADR-N04`, `ADR-N05`, `ADR-N13`, `ADR-N14`
> **Cấu hình bảng:** cùng mẫu 15 cột với `testing/test-cases.md` (Ny). Cột **Mode**: `Automated` / `Manual/E2E`; tầng test ghi ở cột **Comment**. Cột **Testing Result**: `Passed` · `Failed` · `Blocked` · `Un-tested`.

## Liên kết với `testing/test-strategy.md` (Ny)

| Mã chiến lược | Nội dung | Test case ở file này |
|---|---|---|
| §11.3 | Empty (bàn chưa có đơn) | TC-US09-006 |
| §11.3 | Unicode/ghi chú tiếng Việt | TC-US09-008 |
| `IT-01` (tương đương) | API hóa đơn + DB | TC-US09-001, TC-US09-007 |
| — | 4 trạng thái phục vụ (máy trạng thái KDS) | TC-US09-002 |

## Môi trường & cách chạy (kế hoạch)

| Tầng | Công cụ | Ghi chú |
|---|---|---|
| Integration | pytest + httpx (`backend/tests/routers/test_orders.py`) | `GET /orders/current`: `all_served`, 404 bàn trống, dot theo đợt |
| E2E | Playwright (`testing/test_scripts/`) | `us09-bill.spec.ts`: gọi món → xem hóa đơn → yêu cầu thanh toán |

## BẢNG TEST CASES — US-09

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-US09-001** | Mở hóa đơn — đủ cột, giá đúng tại thời điểm đặt | `US-09` AC1<br>`US-07` Price Snapshot | Bàn đã gửi ≥ 1 đơn (US-01 AC4). | 1. Bấm "Xem hóa đơn" ở header E-Menu.<br>2. Đối chiếu bảng. | 2.1 Đơn gửi khi giá món X = giá DB lúc đặt. | `Bàn 06`<br>`Item`: giá 250.000đ lúc đặt | High | Automated/E2E | Trang full-screen: Tên món (kèm ghi chú) / SL / Thành tiền / Trạng thái + tổng số món, tổng thành tiền; giá bằng giá lúc đặt (đổi giá sau không ảnh hưởng); nút quay lại ở header. | `Passed` | 2026-10-09 | Nhàn | - | Integration `test_orders.py::test_order_current_va_trang_thai_phuc_vu`. |
| **TC-US09-002** | Hiển thị đúng 4 trạng thái phục vụ | `US-09` AC1<br>`US-04`, máy trạng thái KDS | Bàn có món ở 4 trạng thái: `cho_nau`, `dang_nau`, `da_xong`, `da_phuc_vu`. | 1. Mở hóa đơn.<br>2. Đọc nhãn trạng thái từng món. | - | 4 món × 4 trạng thái | High | Automated/E2E | Nhãn tương ứng: `Chờ nấu` / `Đang nấu` / `Chờ phục vụ` / `Đã phục vụ` (đặt tên chuẩn 09/10 — trước đây FE hiển thị "Đã xong — chờ phục vụ"). | `Un-tested` | 2026-10-09 | Nhàn | - | FE `TRANGTHAI_LABEL` (HoaDon.js + cashier.js đã đồng bộ 09/10). |
| **TC-US09-003** | Còn món chưa phục vụ → nút khóa sẵn + cảnh báo vàng | `US-09` AC2<br>`ADR-N05` | Hóa đơn có món `Chờ nấu`/`Đang nấu`/`Chờ phục vụ`. | 1. Mở hóa đơn.<br>2. Quan sát nút "Yêu cầu thanh toán".<br>3. Thử bấm (nếu được). | - | Bàn còn 1 món `Chờ phục vụ` | High | Automated/E2E | Nút **Disabled ngay khi mở** kèm hộp cảnh báo vàng "Vẫn còn món đang được chế biến/chờ bưng..."; không sinh yêu cầu thanh toán. | `Passed` | 2026-10-09 | Nhàn | - | E2E; backend trả `all_served: false` (`test_order_current_va_trang_thai_phuc_vu`). |
| **TC-US09-004** | Đã phục vụ đủ → hướng dẫn ra quầy | `US-09` AC3 | Toàn bộ món `Đã phục vụ`. | 1. Mở hóa đơn.<br>2. Bấm "Yêu cầu thanh toán". | 2.1 `all_served = true`. | Bàn đủ phục vụ | High | Automated/E2E | Nút Enabled; bấm → modal icon xanh: "Vui lòng đến quầy thu ngân để thanh toán. Xin cảm ơn!" | `Passed` | 2026-10-09 | Nhàn | - | E2E. |
| **TC-US09-005** | BR-05 — không có nút hủy/xóa đơn | `US-09` AC4<br>`BR-05` | Hóa đơn đang mở. | 1. Soi toàn trang tìm nút hủy/xóa. | - | - | Medium | Manual/E2E | Không tồn tại bất kỳ nút hủy/xóa đơn nào trên hóa đơn. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E assert số nút `[data-*cancel*]` = 0. |
| **TC-US09-006** | Bàn chưa có đơn → trạng thái rỗng + nút Disabled | `US-09` AC5<br>§11.3 empty | Khách chưa gửi đơn nào. | 1. Bấm "Xem hóa đơn". | - | Bàn mới, 0 phiếu | High | Automated/E2E | Hiện "Bàn chưa gọi món nào..."; nút "Yêu cầu thanh toán" Disabled. | `Passed` | 2026-10-09 | Nhàn | - | Integration `test_orders.py::test_order_current_chua_co_don_bao_404` (API trả 404); FE xử lý 404 → trạng thái rỗng. |
| **TC-US09-007** | Hóa đơn nhóm theo đợt gọi | `US-09` AC6<br>`ADR-N13` | Bàn gọi 3 đợt khác nhau (3 lần POST /orders). | 1. Mở hóa đơn.<br>2. Đếm tiêu đề nhóm. | - | `Bàn 08`, 3 đợt | High | Automated/E2E | 3 tiêu đề "Đợt N — gọi lúc HH:MM · X món" đúng thứ tự; món nằm đúng nhóm của mình; tổng tiền vẫn tổng toàn bàn. | `Passed` | 2026-10-09 | Nhàn | - | Integration `test_orders.py::test_gui_dot_2_cong_vao_hoa_don_cu` (đa đợt); FE `getRoundGroupedItems`. |
| **TC-US09-008** | Ghi chú tiếng Việt/emoji hiển thị nguyên vẹn trên hóa đơn | `US-09` AC1<br>§11.3 unicode | Món trong đơn có ghi chú "Không hành, Ít cay 🌶️". | 1. Mở hóa đơn.<br>2. Đọc dòng món. | - | Ghi chú có dấu + emoji | Medium | Automated | Ghi chú hiển thị dưới tên món nguyên vẹn (không lỗi font/mất dấu). | `Un-tested` | 2026-10-09 | Nhàn | - | Tham chiếu integration: `test_kds.py::test_vietnamese_and_emoji_note_shown_unchanged_on_kds`. |
| **TC-US09-009** | Phân biệt khách trước — khách đang dùng | `US-09` AC1<br>`ADR-N14` | Bàn có phiếu của khách trước (đã gắn hoadon) và phiếu mới (hoadon_id NULL). | 1. Khách mới gọi món.<br>2. Mở hóa đơn. | 2.1 Bàn đã được thanh toán lần trước nhưng chưa dọn lại. | `Bàn 06`, 2 thế hệ phiếu | High | Automated | Hóa đơn chỉ tính các phiếu `hoadon_id NULL` (của khách đang dùng) — tiền khách trước không bị tính lại. | `Un-tested` | 2026-10-09 | Nhàn | - | Integration `get_open_phieuban_list` (`hoadon_id.is_(None)`); `test_orders.py` đa đợt. |
