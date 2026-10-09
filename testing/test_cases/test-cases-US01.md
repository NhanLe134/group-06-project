# TEST CASES CHI TIẾT — US-01: GỌI MÓN QUA E-MENU VÀ GIỎ HÀNG BẢN NHÁP

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US01.md`
> **User Story:** US-01 — Gọi món qua E-Menu và Giỏ hàng bản nháp (`docs/04-Backlog/user stories/US-01.md` — đã đồng bộ ADR-N01/N06/N09/N11)
> **Người thực hiện (Who checked):** Nhàn (owner US-01; AI hỗ trợ viết testcase — AI_USAGE_LOG A-N70, A-N72)
> **Lần chạy:** chưa chạy (`Un-tested`) — kế hoạch thực thi xem mục C checklist A-N72, evidence sẽ lưu `testing/reports/US-01/`
> **Màn hình kiểm thử:** `frontend/fe_ofc/pages/customer.html` (E-Menu), script `frontend/fe_ofc/assets/js/{ThucDon,GioHang,GhiChuMon,GuiBep,customer}.js`
> **Yêu cầu liên quan:** `REQ-01`, `REQ-02`, `REQ-09`, `REQ-15`, `BR-01`, `BR-03`, `BR-06`, `NFR-RO-01`, `ADR-001`, `ADR-N01`, `ADR-N06`, `ADR-N09`, `ADR-N11`
> **Cấu hình bảng:** cùng mẫu 15 cột với `testing/test-cases.md` (Ny). Cột **Mode**: `Automated` / `Manual/E2E`; tầng test (Unit / Integration / E2E) ghi ở cột **Comment**. Cột **Testing Result**: `Passed` · `Failed` · `Blocked` · `Un-tested`.

## Liên kết với `testing/test-strategy.md` (Ny)

| Mã chiến lược | Nội dung | Test case ở file này |
|---|---|---|
| `UT-02` | Kiểm tra tồn kho, từ chối nếu vượt | TC-US01-002 |
| `IT-03` | Bếp báo hết → E-Menu khóa món < 1 s | TC-GO-003, TC-GO-004, TC-US01-010 |
| §11.3 | Offline / slow network | TC-US01-004, TC-US01-005 |
| §11.3 | Boundary quantity | TC-GO-001, TC-US01-002 |
| §11.3 | Unicode/tiếng Việt/emoji | TC-US01-008 |
| §11.3 | Double click | TC-US01-012 |
| §11.3 | Empty | TC-US01-011 |

## Môi trường & cách chạy (kế hoạch)

| Tầng | Công cụ | Ghi chú |
|---|---|---|
| Unit FE | Vitest (`frontend/tests/`, mẫu `kds-logic.test.js`) | logic giỏ/gộp món/bộ đếm |
| Integration | pytest + httpx (`backend/tests/routers/test_orders.py`, `test_menu.py`, `test_stock.py`) | SQLite trong bộ nhớ |
| E2E | Playwright (`testing/test_scripts/`) | `us01-customer.spec.ts` — kể cả `route.abort()` mô phỏng mất mạng |

## BẢNG TEST CASES — US-01

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-GO-001** | Thêm món vào giỏ — số lượng mặc định 1, đúng giá hệ thống | `US-01` AC1<br>`REQ-01`, `BR-06` | E-Menu đã tải (< 2s `NFR-RO-01`), món còn tồn. | 1. Lướt E-Menu.<br>2. Bấm "+" trên thẻ món. | 1.1 Món trạng thái Available (`listed = true`, tồn > 0). | `Bàn 06`<br>`Item`: "Bò sốt tiêu đen"<br>`Qty`: 1 | High | Automated | Món vào Order Draft Qty=1, **đơn giá đúng giá DB** (single source of truth); tổng tiền tạm tính cập nhật tức thì; KHÔNG có request nào gửi bếp (`REQ-02`/`BR-01`). | `Passed` | 2026-10-09 | Nhàn | - | E2E + Unit FE. Cập nhật 09/10: giá đọc từ `GET /menu` (không hard-code). |
| **TC-US01-002** | Chặn tăng vượt tồn kho (boundary) | `US-01` AC2<br>`BR-06`, `UT-02` | Món "Trà đá" tồn = 5, đã có trong giỏ. | 1. Bấm "+" đến lần thứ 6. | 2.1 Số lượng đang = 5 (= tồn). | `Item`: "Trà đá"<br>`Tồn`: 5<br>`Qty` thử: 6 | High | Automated | Chặn, cảnh báo "Món này chỉ còn 5 phần"; Qty giữ tối đa 5; không thể vượt. | `Un-tested` | 2026-10-09 | Nhàn | - | Unit FE (GioHang) + E2E. Backend chặn gửi vượt tồn: `test_orders.py::test_gui_mon_het_hang_bao_409`, `test_stock.py::test_order_rejected_when_not_enough_and_nothing_deducted`. |
| **TC-GO-003** | Món hết tồn → xám "Hết hàng", khóa "+" | `US-01` AC3, AC9<br>`REQ-09`, `BR-03` | Món còn bán nhưng `soluongton = 0`. | 1. Xem thẻ món trên E-Menu.<br>2. Thử bấm "+". | 2.1 Món NOT `listed = false` (còn bán). | Món hết tồn | High | Automated | Thẻ xám nhãn "Hết hàng", nút "+" disabled. | `Passed` | 2026-10-09 | Nhàn | - | Integration: `test_menu.py::test_menu_item_het_ton_nhung_van_ban_co_listed`. |
| **TC-GO-004** | Món OOS trong giỏ → xám + khóa gửi bếp | `US-01` AC3<br>`REQ-15`, `ADR-001` | Món đang nằm trong Draft; bếp báo hết món đó. | 1. Bếp bấm OOS.<br>2. Khách mở Draft.<br>3. Thử "Xác nhận gửi bếp". | 3.1 WebSocket `menu:oos` đồng bộ < 1 s. | Item trong Draft → OOS | High | Automated | Dòng món trong Draft xám + nhãn đỏ "Món đã hết"; nút "Xác nhận gửi bếp" Disabled cho đến khi gỡ món OOS. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E; kênh realtime `ITEM_OOS_BROADCAST` (đúng tên sự kiện theo `api-contract.md`). |
| **TC-US01-010** | Bếp tắt bán món → ẨN hẳn khỏi E-Menu | `US-01` AC9<br>`ADR-N11` | Món đang hiển thị trên E-Menu. | 1. Quản lý/Bếp tắt bán món (`trangthaiban = false`).<br>2. Khách tải lại E-Menu. | 2.1 Món `listed = false`. | Món bị tắt bán | High | Automated | Món **không còn xuất hiện** trong danh sách (khác với hết tồn chỉ xám — TC-GO-003). | `Passed` | 2026-10-09 | Nhàn | - | Integration `test_menu.py` (trường `listed`) + E2E. |
| **TC-GO-002** | Explicit confirmation — modal trước khi gửi bếp | `US-01` AC4<br>`REQ-02`, `BR-01` | Draft có ≥ 1 món hợp lệ. | 1. Bấm "Xác nhận gửi bếp".<br>2. Đọc modal.<br>3. Bấm "Xác nhận". | 3.1 Khách chủ động xác nhận. | Draft: 1 món | High | Automated | Modal xác nhận hiện (số món, tổng tiền, cảnh báo không tự hủy); chỉ gửi sau khi bấm "Xác nhận"; API `POST /orders` trả 200 + sinh phiếu mới (ADR-N14); Draft làm trống; popup hiển thị **"Mã đơn: {phieuban_id}"**. | `Passed` | 2026-10-09 | Nhàn | - | Cập nhật 09/10: API thật là `POST /orders`; thêm mã đơn trên popup. Integration: `test_orders.py::test_gui_dot_1_tao_phien_va_hoa_don`. **BUG-US01-001**: E2E phát hiện popup không hiện (lỗi scope `res`) — đã fix + test lại pass. |
| **TC-US01-003** | Bấm "Hủy" ở modal → không gửi | `US-01` AC4<br>`BR-01` | Modal xác nhận đang mở. | 1. Bấm "Hủy". | - | - | Medium | Automated | Modal đóng, Draft giữ nguyên, không có request `POST /orders`. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E. |
| **TC-US01-004** | Mất mạng khi tải E-Menu → banner đỏ, menu GIỮ NGUYÊN | `US-01` AC5<br>§11.3 offline | E-Menu đang mở. | 1. Ngắt kết nối (Playwright `route.abort('/menu')`).<br>2. Quan sát banner.<br>3. Bấm "Thử lại" sau khi có mạng. | 3.1 Mạng khôi phục. | - | High | Automated | Banner đỏ: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại; danh sách món chưa thay đổi" + nút "Thử lại"; **danh sách món KHÔNG bị xóa**; bấm Thử lại → banner ẩn, menu tải lại đúng (tự áp dụng trạng thái OOS mới). | `Passed` | 2026-10-09 | Nhàn | - | E2E. Đã smoke thủ công 09/10 (Playwright route-abort: banner hiện → retry → 17 món render). |
| **TC-US01-005** | Mất mạng khi thao tác → Draft bảo toàn | `US-01` AC5 | Draft có món; mạng ngắt. | 1. Bấm "+"/mở Draft trong lúc offline.<br>2. Bật lại mạng, tải menu. | - | Draft trước/sau | High | Automated | Thêm món là cục bộ vẫn hoạt động; Draft nguyên vẹn trước–sau mất mạng. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E (thêm món client-side, không gọi API). |
| **TC-US01-006** | Bộ đếm `− n +` trên thẻ món | `US-01` AC6<br>`ADR-N06` | Đã thêm món n=2. | 1. Bấm "+" / "−" tại thẻ.<br>2. Sửa qty trong Draft. | 2.1 n về 0. | `Qty`: 2 → 3 → 1 → 0 | Medium | Automated | Nút "+" thay bằng `− n +` đúng n; `−` về 0 → thẻ về nút "+"; sửa trong Draft cập nhật ngược thẻ; món hết hàng vẫn có bộ đếm nhưng "+" disabled. | `Passed` | 2026-10-09 | Nhàn | - | Unit FE + E2E. |
| **TC-US01-007** | Nhóm phân loại + scroll-spy | `US-01` AC7<br>`ADR-N09` | Menu có `Món chính`, `Set lẩu`, `Đồ uống`. | 1. Cuộn tới từng nhóm.<br>2. Bấm chip.<br>3. Tìm kiếm lọc. | 3.1 Nhóm hết kết quả tìm kiếm. | Menu 17 món | Medium | Manual/E2E | Nhóm theo thứ tự `Món chính`→`Set lẩu`→`Đồ uống`; chip nhóm đang xem nền cam; bấm chip cuộn mượt; nhóm trống tự ẩn khi lọc. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E/Manual. |
| **TC-US01-008** | Ghi chú món + chip gợi ý (tiếng Việt/emoji) | `US-01` AC8<br>`ADR-N01`, §11.3 unicode | Draft có 1 món. | 1. Mở ghi chú món.<br>2. Bấm chip "Không hành".<br>3. Gõ thêm "Ít cay 🌶️".<br>4. Lưu. | 2.1 Chip bấm lần 2 → bỏ nội dung. | Ghi chú: "Không hành, Ít cay 🌶️" | High | Automated | Chip nối/bỏ nội dung đúng; ghi chú gắn vào dòng món, hiển thị trong Draft và trên Hóa đơn (US-09 AC1); lưu nguyên dấu + emoji. | `Un-tested` | 2026-10-09 | Nhàn | - | Integration tham chiếu: `test_kds.py::test_vietnamese_and_emoji_note_shown_unchanged_on_kds`. |
| **TC-US01-009** | Xóa ghi chú; giảm ưu tiên dòng không ghi chú | `US-01` AC8, AC6<br>`ADR-N01`, `ADR-N06` | 2 dòng cùng món: 1 có ghi chú, 1 không. | 1. Bấm "−" trên thẻ món.<br>2. Xóa ghi chú dòng còn lại. | 1.1 Còn > 0 dòng sau giảm. | 2 dòng cùng món | Medium | Automated | "−" giảm dòng KHÔNG ghi chú trước; "Xóa ghi chú" làm trống ô, dòng món giữ nguyên. | `Un-tested` | 2026-10-09 | Nhàn | - | Unit FE. |
| **TC-US01-011** | Giỏ trống → không gửi được | `US-01` AC4<br>§11.3 empty | Draft trống. | 1. Quan sát nút "Xác nhận gửi bếp".<br>2. Gọi `openConfirm()` bằng console. | - | Draft: 0 món | Medium | Automated | Nút Disabled/không mở modal; gọi trực tiếp cũng không gửi (`if (!draft.length) return`). | `Passed` | 2026-10-09 | Nhàn | - | Unit FE. |
| **TC-US01-012** | Double-click "Xác nhận" → chỉ 1 phiếu | `US-01` AC4<br>§11.3 double click | Modal xác nhận đang mở. | 1. Bấm "Xác nhận" 2 lần liên tiếp nhanh. | 1.1 Giữa 2 lần bấm < 200 ms. | 1 món | High | Automated | Chỉ tạo **1 phiếu** (modal đóng ngay khi bấm lần đầu để chặn click trùng); đếm phiếu qua `GET /orders/current`. | `Un-tested` | 2026-10-09 | Nhàn | - | E2E + Integration đếm phiếu. |
