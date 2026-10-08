# TEST CASES CHI TIẾT — US-08: ĐỐI SOÁT TỒN KHO & ĐÓNG CA

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US08.md`
> **User Story:** US-08 — Đối soát tồn kho và Đóng ca (`docs/04-Backlog/user stories/US-08.md`)
> **Story Spec:** `vault/06-Engineering/story-spec-us08-inventory.md`
> **Người thực hiện (Who checked):** Nhã (owner task T-13/T-14, AI hỗ trợ — AI_USAGE_LOG A-93)
> **Ngày chạy:** 2026-10-07 · **Trạng thái kiểm thử:** `Tested` — kết quả ở `testing/reports/US-03/`
> **Màn hình kiểm thử:** `frontend/fe_ofc/pages/manager.html` → tab **Phiếu Kiểm kê**
> **Yêu cầu liên quan:** `REQ-12`, `BR-06`, `BR-07`, `NFR-RO-03`
> **Phạm vi:** phiếu gồm các món **mua sẵn** (có `soluongton`) — món chế biến tính theo nguyên liệu, ngoài phạm vi US-08.

Cách chạy giống `test-cases-US03.md` (Integration: `uv run pytest tests/routers/test_inventory.py`; E2E: `npx playwright test -c playwright.us03.config.ts tests/us08-inventory.spec.ts`).

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-MA-004** | Xem bảng đối soát, nhập tồn thực tế, chốt ca | `US-08` AC1–AC3<br>`REQ-12`, `BR-06` | Có món mua sẵn (Coca 24, Trà đá 50); có tài khoản Quản lý PIN 1234. | 1. Tab Phiếu Kiểm kê → **Tạo Phiếu Kiểm Kê**.<br>2. Nhập tồn thực tế (Trà đá thiếu 1).<br>3. Nhập lý do → **Xác nhận Đóng ca** → PIN 1234. | 2.1 Tồn thực tế là số nguyên ≥ 0. | Trà đá: C − 1, lý do "Vỡ 1 chai" | High | E2E + Integration | Bảng có A, B, C = A − B; dòng thiếu tô màu hao hụt; chốt xong phiếu `da_chot`, ghi người chốt, chỉ xem; `soluongton` Trà đá = tồn thực tế. | `Pass` | 2026-10-07 | Nhã | - | `us08-inventory.spec.ts` TC-MA-004; `test_inventory.py::test_close_locks_shift_and_rolls_actual_into_next_opening` |
| **TC-MA-INV-001** | Phiếu chỉ gồm món mua sẵn; B bỏ món hủy, món ngoài kỳ | `US-08` AC1 | Có món chế biến, món hủy, đơn 2 ngày trước. | Tạo phiếu. | - | - | Medium | Integration | Chỉ món có `soluongton`; B không tính món `da_huy` và đơn trước kỳ. | `Pass` | 2026-10-07 | Nhã | - | `test_inventory.py::test_create_shift_snapshots_only_tracked_items_and_counts_sold` |
| **TC-MA-INV-002** | Hao hụt mà bỏ trống lý do | `US-08` AC4 | Phiếu nháp, có dòng thiếu. | Bấm **Xác nhận Đóng ca** khi chưa nhập lý do. | - | - | High | E2E + Integration | Lỗi đỏ ngay dòng: "Vui lòng nhập lý do hao hụt trước khi chốt ca"; **không gọi API**; server vẫn chặn 422 `LOSS_REASON_REQUIRED`. | `Pass` | 2026-10-07 | Nhã | - | E2E đếm request `/close` = 0; `test_inventory.py::test_close_rejects_loss_without_reason` |
| **TC-MA-INV-003** | Chốt ca cần PIN Quản lý | `US-08` AC5<br>`NFR-RO-03` | Phiếu hợp lệ. | Nhập PIN Thu ngân (9999), rồi PIN sai. | - | - | High | E2E + Integration | Popup "Cần quyền Quản lý…"; PIN không phải Quản lý → 403 `INVALID_MANAGER_PIN`, phiếu không đổi. | `Pass` | 2026-10-07 | Nhã | - | `test_inventory.py::test_close_rejects_wrong_or_non_manager_pin` |
| **TC-MA-005** | Tồn thực tế là số âm | `US-08`<br>(Negative) | Phiếu nháp. | Nhập −5 → Đóng ca. | - | `-5` | Medium | E2E + Integration | Lỗi "Tồn thực tế phải là số nguyên ≥ 0", không mở PIN; API 422. | `Pass` | 2026-10-07 | Nhã | - | `us08-inventory.spec.ts` TC-MA-005; `test_inventory.py::test_save_lines_rejects_negative_and_unknown_items` |
| **TC-MA-INV-004** | Chỉ 1 phiếu nháp cùng lúc | `US-08` | Đã có phiếu nháp. | Tạo phiếu thứ 2. | - | - | Medium | Integration | 409 `SHIFT_DRAFT_EXISTS`. | `Pass` | 2026-10-07 | Nhã | - | `test_inventory.py::test_only_one_draft_at_a_time` |
| **TC-MA-INV-005** | Phiếu đã chốt không sửa / xóa được | `US-08` AC3<br>`BR-07` | Phiếu `da_chot`. | Lưu dòng, chốt lại, xóa. | - | - | High | Integration | 409 `SHIFT_CLOSED`, dữ liệu không đổi. | `Pass` | 2026-10-07 | Nhã | - | `test_inventory.py::test_closed_shift_is_read_only` |
| **TC-MA-INV-006** | Tồn đầu ca không bị trừ hai lần | `US-08` AC1 | Đã bán 3 Trà đá qua gửi bếp (tự trừ `soluongton`) trước khi tạo phiếu. | Tạo phiếu. | - | Tồn 10, bán 3 | High | Integration | A = 10, B = 3, C = 7. | `Pass` | 2026-10-07 | Nhã | BUG-US08-001 | `test_inventory.py::test_opening_stock_not_double_counted_after_real_orders` (đã thử với code cũ → fail `(7, 3, 4)`) |
| **TC-MA-INV-007** | Chốt về 0 → món tự Hết hàng | `US-08` AC3<br>`BR-03` | Phiếu có dòng tồn thực tế 0. | Chốt ca. | - | - | Medium | Integration | Món chuyển Hết hàng, phát realtime `menu:oos`. | `Pass` | 2026-10-07 | Nhã | - | `test_inventory.py::test_close_with_zero_stock_marks_menu_out_of_stock` |

**Tổng kết 2026-10-07:** 13 test integration (`test_inventory.py`) + 2 test E2E — tất cả pass.
