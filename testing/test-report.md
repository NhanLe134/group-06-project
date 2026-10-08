# TEST REPORT — SMART RESTAURANT ORDERING & KDS
## Kiểm thử Hệ thống Đặt món Thông minh (Group 06)

> **Tester:** Nhóm Group 06 (Ny, Nhã, Nhàn, Trang)
> **Ngày lập báo cáo:** 08/10/2026
> **Môi trường:** [https://smart-orderding.vercel.app](https://smart-orderding.vercel.app) + Backend Render
> **Tài liệu test cases:** `testing/test_cases/test-cases-US01.md` → `test-cases-US08.md`
> **Cập nhật tự động:** Khi thành viên cập nhật kết quả trong file `test-cases-USxx.md`, cần cập nhật bảng tổng kết tương ứng trong file này.

---

## 📊 TỔNG QUAN KẾT QUẢ (OVERVIEW)

| TOTAL TEST CASES | PASSED | FAILED | BLOCKED | UN-TESTED | PASS RATE |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **90** | **30** | **0** | **2** | **58** | **93.8%**\* |

> \* Pass Rate tính trên số test đã chạy: 30 Passed / (30 + 0 + 2) = **93.8%**. Chưa tính 58 test Un-tested (US-01, US-02, US-04, US-05, US-06, US-07 chưa chạy).

---

## 📋 BẢNG CHI TIẾT THEO EPIC & USER STORY

### EPIC 1: GUEST ORDERING EXPERIENCE (Khách hàng gọi món)

| Chức năng | TC-ID phụ trách | Total | Passed | Failed | Blocked | Un-tested | Pass Rate | Who checked |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **US-01: E-Menu & Order Draft** | TC-GO-001 → TC-GO-005 (trong `test-cases.md`) | 5 | 0 | 0 | 0 | 5 | N/A | Nhàn |
| Chọn món thành công | TC-GO-001 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| Chốt đơn Explicit Confirm | TC-GO-002 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| Món OOS mờ xám E-Menu | TC-GO-003 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| Xử lý OOS trong Order Draft | TC-GO-004 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| QR mã bàn không hợp lệ | TC-GO-005 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| **US-02: AI Voice Ordering** | TC-US02-MAN-001 → 016 (`test-cases-US02.md`) | 16 | 0 | 0 | 0 | 16 | N/A | Ny |
| Text fallback luôn hiển thị | TC-US02-MAN-001 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món bằng text | TC-US02-MAN-002 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món bằng voice | TC-US02-MAN-003 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Chuyển text ↔ Voice cùng phiên | TC-US02-MAN-004 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Ghi chú món tùy chỉnh | TC-US02-MAN-005 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Làm rõ khi tên món mơ hồ | TC-US02-MAN-006 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Từ chối món hết hàng | TC-US02-MAN-007 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Không gọi vượt tồn kho | TC-US02-MAN-008 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Tư vấn đồ uống | TC-US02-MAN-009 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Tư vấn món súp / có nước | TC-US02-MAN-010 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Báo dị ứng + xác nhận xóa | TC-US02-MAN-011 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Giảm số lượng trong giỏ | TC-US02-MAN-012 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Xóa món khỏi giỏ | TC-US02-MAN-013 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Text dùng được khi micro lỗi | TC-US02-MAN-014 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Lỗi API AI — giữ nguyên giỏ | TC-US02-MAN-015 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Không tự gửi đơn xuống bếp | TC-US02-MAN-016 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| **US-05: Split Bill** | TC-GO-011 → TC-GO-012 (trong `test-cases.md`) | 2 | 0 | 0 | 0 | 2 | N/A | Nhàn |
| Split Bill chia đều 3 người | TC-GO-011 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| Validation input Split Bill | TC-GO-012 | 1 | 0 | 0 | 0 | 1 | - | Nhàn |
| **TỔNG EPIC 1** | | **23** | **0** | **0** | **0** | **23** | **N/A** | |

---

### EPIC 2: KITCHEN & TABLE OPERATIONS (Vận hành Bếp & Phục vụ)

| Chức năng | TC-ID phụ trách | Total | Passed | Failed | Blocked | Un-tested | Pass Rate | Who checked |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **US-03: KDS Bếp & AI Batching** | `test-cases-US03.md` | 23 | 21 | 0 | 2 | 0 | **91.3%** | Nhã |
| KDS nhận đơn real-time | TC-OP-001 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Độ trễ thẻ KDS < 500ms | TC-OP-KDS-013 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| AI gom mẻ "Gợi ý nấu chung" | TC-OP-KDS-001 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Không gom mẻ sai | TC-OP-KDS-002 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| FIFO, ẩn món đã phục vụ | TC-OP-KDS-003 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Bấm "Xong" → báo Phục vụ | TC-OP-KDS-004 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Chuyển trạng thái sai / 2 lần | TC-OP-KDS-005 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Nấu/Xong từng phần (tách suất) | TC-OP-KDS-006 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Hoàn tác (lùi 1 bước) | TC-OP-KDS-007 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Bếp báo hết → E-Menu khóa < 1s | TC-OP-003 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Món Chờ nấu khi đã báo hết | TC-OP-KDS-008 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Mở bán lại khi kho vẫn hết | TC-OP-KDS-009 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Hết nguyên liệu → tự khóa món | TC-OP-KDS-010 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Race condition suất cuối | TC-OP-005 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Dữ liệu biên / sai | TC-OP-KDS-015 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Ghi chú tiếng Việt + emoji | TC-OP-KDS-012 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Khung Tồn kho đúng loại món | TC-OP-KDS-014 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Mất mạng & reconnect | TC-OP-004 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Smoke staging (chỉ đọc) | TC-OP-KDS-016 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| WebSocket URL đúng khi deploy | TC-OP-KDS-017 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| KDS đọc đúng dữ liệu sau ADR-N14 | TC-OP-KDS-018 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Phục vụ vào KDS bị chặn 403 *(Blocked)* | TC-OP-KDS-011 | 1 | 0 | 0 | 1 | 0 | Blocked | Nhã |
| Thẻ > 15 phút chớp đỏ *(Blocked)* | TC-OP-002 | 1 | 0 | 0 | 1 | 0 | Blocked | Nhã |
| **US-04: Tablet Phục vụ (Waiter)** | TC-OP-006 → TC-OP-009 (trong `test-cases.md`) | 4 | 0 | 0 | 0 | 4 | N/A | Trang |
| Tablet phát âm "Ting Ting" | TC-OP-006 | 1 | 0 | 0 | 0 | 1 | - | Trang |
| Bấm "Đã phục vụ" đổi màu Table Map | TC-OP-007 | 1 | 0 | 0 | 0 | 1 | - | Trang |
| Hủy món — nhập PIN Quản lý đúng | TC-OP-008 | 1 | 0 | 0 | 0 | 1 | - | Trang |
| Hủy món — nhập PIN sai → 401/403 | TC-OP-009 | 1 | 0 | 0 | 0 | 1 | - | Trang |
| **TỔNG EPIC 2** | | **27** | **21** | **0** | **2** | **4** | **91.3%**\* | |

> \* Pass Rate Epic 2 tính trên 23 TC đã chạy (US-03).

---

### EPIC 3: RESTAURANT MANAGEMENT & CMS (Quản trị & CMS)

| Chức năng | TC-ID phụ trách | Total | Passed | Failed | Blocked | Un-tested | Pass Rate | Who checked |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **US-06: Dashboard Doanh thu** | TC-MA-001 (trong `test-cases.md`) | 1 | 0 | 0 | 0 | 1 | N/A | Trang, Nhã |
| Dashboard nhảy số doanh thu real-time | TC-MA-001 | 1 | 0 | 0 | 0 | 1 | - | Trang, Nhã |
| **US-07: CMS Quản lý Menu** | TC-MA-CMS-001 → 020 (`test-cases-US07.md`) | 20 | 0 | 0 | 0 | 20 | N/A | Ny |
| Hiển thị danh sách món đúng bảng | TC-MA-CMS-001 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Tìm kiếm món theo tên | TC-MA-CMS-002 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Lọc theo trạng thái "Tạm ẩn" | TC-MA-CMS-003 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Lọc tồn kho "Sắp hết (< 20)" | TC-MA-CMS-004 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Xem chi tiết modal | TC-MA-CMS-005 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món mới (Happy Path) | TC-MA-CMS-006 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món — thiếu Tên | TC-MA-CMS-007 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món — thiếu Giá bán | TC-MA-CMS-008 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món với tồn kho | TC-MA-CMS-009 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Thêm món không nhập tồn kho | TC-MA-CMS-010 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Hủy form thêm món | TC-MA-CMS-011 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Sửa giá bán thành công | TC-MA-CMS-012 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Sửa trạng thái "Đang bán" → "Tạm ẩn" | TC-MA-CMS-013 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Sửa món — xóa trắng Tên | TC-MA-CMS-014 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Cập nhật tồn kho inline | TC-MA-CMS-015 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Xóa món + xác nhận OK | TC-MA-CMS-016 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Hủy xóa món (Cancel) | TC-MA-CMS-017 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Waiter gọi API sửa menu → 403 (RBAC) | TC-MA-CMS-018 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Modal sửa điền sẵn đúng dữ liệu | TC-MA-CMS-019 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| Sắp xếp giá cao → thấp | TC-MA-CMS-020 | 1 | 0 | 0 | 0 | 1 | - | Ny |
| **US-08: Đối soát Tồn kho & Đóng ca** | `test-cases-US08.md` | 9 | 9 | 0 | 0 | 0 | **100%** | Nhã |
| Xem bảng đối soát, nhập tồn, chốt ca | TC-MA-004 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Phiếu chỉ gồm món mua sẵn | TC-MA-INV-001 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Hao hụt bỏ trống lý do → bị chặn | TC-MA-INV-002 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Chốt ca cần PIN Quản lý | TC-MA-INV-003 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Tồn thực tế số âm → từ chối | TC-MA-005 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Chỉ 1 phiếu nháp cùng lúc | TC-MA-INV-004 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Phiếu đã chốt không sửa/xóa | TC-MA-INV-005 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Tồn đầu ca không trừ hai lần | TC-MA-INV-006 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| Chốt về 0 → tự Hết hàng | TC-MA-INV-007 | 1 | 1 | 0 | 0 | 0 | 100% | Nhã |
| **TỔNG EPIC 3** | | **30** | **9** | **0** | **0** | **21** | **100%**\* | |

> \* Pass Rate Epic 3 tính trên 9 TC đã chạy (US-08).

---

## 📈 TỔNG CỘNG

| Epic | Total | Passed | Failed | Blocked | Un-tested | Pass Rate (đã chạy) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Epic 1: Guest Ordering (US-01, 02, 05) | 23 | 0 | 0 | 0 | 23 | N/A |
| Epic 2: Kitchen & Table (US-03, 04) | 27 | 21 | 0 | 2 | 4 | 91.3% |
| Epic 3: Management & CMS (US-06, 07, 08) | 30 | 9 | 0 | 0 | 21 | 100% |
| **TỔNG CỘNG** | **80** | **30** | **0** | **2** | **48** | **93.8%** |

> **Lưu ý:** 10 TC từ `test-cases.md` tổng (TC-GO-001→005, TC-GO-011→012, TC-OP-006→009, TC-MA-001) chưa được tách vào file riêng cho US-01, US-04, US-05, US-06. Tổng thực tế khi cộng đủ là **90 TC** (80 trong file riêng + 10 trong file tổng).

---

## 🐛 DANH SÁCH BUG ĐÃ GHI NHẬN

| BUG ID | US | Mô tả ngắn | Trạng thái | TC liên quan |
|---|---|---|---|---|
| BUG-US03-001 | US-03 | Hết nguyên liệu chưa khóa đúng tất cả món dùng chung | Đã sửa | TC-OP-KDS-010 |
| BUG-US03-002 | US-03 | Khung Tồn kho hiển thị sai nhãn theo loại món | Đã sửa | TC-OP-KDS-014 |
| BUG-US03-003 | US-03 | Địa chỉ WebSocket sai khi deploy lên HTTPS | Đã sửa | TC-OP-KDS-017 |
| BUG-US03-004 | US-03 | AI gom mẻ gộp nhầm tất cả món sau ADR-N14 | Đã sửa | TC-OP-KDS-001, TC-OP-001 |
| BUG-US03-005 | US-03 | Race condition — đơn vẫn nhận sau khi bếp báo hết | Đã sửa | TC-OP-005 |
| BUG-US07-001 | US-07 | Cập nhật trạng thái món hiển thị toast "Không thành công" dù API thành công | Đã sửa | TC-MA-CMS-012, 013 |
| BUG-US07-002 | US-07 | *(Chưa xác nhận — chờ chạy test)* | Un-tested | TC-MA-CMS-006 |
| BUG-US07-003 | US-07 | *(Chưa xác nhận — chờ chạy test)* | Un-tested | TC-MA-CMS-006 |
| BUG-US07-004 | US-07 | *(Chưa xác nhận — chờ chạy test)* | Un-tested | TC-MA-CMS-009, 010, 015 |
| BUG-US07-005 | US-07 | *(Chưa xác nhận — chờ chạy test)* | Un-tested | TC-MA-CMS-012, 013 |
| BUG-US08-001 | US-08 | Tồn đầu ca bị trừ hai lần (code cũ) | Đã sửa | TC-MA-INV-006 |
| BUG-US02-001 | US-02 | *(Chưa chạy — chờ test)* | Un-tested | TC-US02-MAN-001, 014 |
| BUG-US02-002–008 | US-02 | *(Chưa chạy — chờ test)* | Un-tested | TC-US02-MAN-005→015 |

---

## ⚠️ TEST CASE BLOCKED

| TC-ID | US | Lý do Blocked | Ngày ghi nhận | Who checked |
|---|---|---|---|---|
| TC-OP-KDS-011 | US-03 | Chờ story Auth/JWT hoàn thiện (AI_USAGE_LOG A-84) | 2026-10-08 | Nhã |
| TC-OP-002 | US-03 | REQ-08 (chớp đỏ > 15 phút) không thuộc 5 AC của US-03, chờ PO quyết định | 2026-10-08 | Nhã |

---

## 📝 GHI CHÚ CẬP NHẬT

### Hướng dẫn cập nhật báo cáo này

Khi một thành viên hoàn thành chạy test và cập nhật kết quả trong file `test-cases-USxx.md`:

1. Tìm đúng dòng của US tương ứng trong bảng ở trên
2. Cập nhật cột **Passed / Failed / Blocked / Un-tested** theo kết quả thực tế
3. Tính lại **Pass Rate** = Passed / (Passed + Failed + Blocked) × 100%
4. Cập nhật dòng **TỔNG CỘNG** ở cuối
5. Nếu có bug mới → thêm vào bảng **DANH SÁCH BUG**
6. Nếu có TC Blocked mới → thêm vào bảng **TEST CASE BLOCKED**
7. Commit với message: `test(report): update test results US-XX - [date]`

### Lịch sử cập nhật

| Ngày | Nội dung | Người cập nhật |
|---|---|---|
| 08/10/2026 | Tạo báo cáo lần đầu, tổng hợp kết quả US-03 (23 TC) và US-08 (9 TC) | Ny (AI hỗ trợ) |
| 08/10/2026 | Ghi nhận BUG-US07-001 đã sửa (recipe API error không còn block toast thành công) | Ny |
