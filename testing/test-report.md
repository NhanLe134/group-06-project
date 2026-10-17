# Báo cáo kiểm thử hệ thống Smart Ordering

## 1. Thông tin báo cáo

| Thuộc tính | Nội dung |
|---|---|
| Ngày cập nhật | 17/10/2026 |
| Dự án | Smart Restaurant Ordering & KDS — Group 06 |
| Phạm vi | US-01 đến US-11 (US-06 chưa có test case); kiểm thử chức năng, API, tích hợp và E2E theo các bộ test hiện hành |
| Môi trường | Localhost, backend kiểm thử (SQLite / Postgres tạm), staging Vercel/Render theo từng bộ test |
| Nguồn testcase | Các file trong [`testing/test_cases/`](test_cases/) (`test-cases-US01.md` … `test-cases-US11.md`) |
| Sổ đăng ký lỗi | [`testing/bug-reports/bug-report.md`](bug-reports/bug-report.md) |
| Kỳ chạy được tổng hợp | 07/10/2026 – 17/10/2026 |

> Số liệu được đếm trực tiếp từ cột **Testing Result** của từng file test case, theo **TC-ID duy nhất** (không trùng TC-ID giữa các file). Với US-04, US-10, US-11 (mẫu bảng cũ, cột `Result` để trống), mọi test case được tính là `Un-tested`.

## 2. Tổng quan kết quả

| Tổng TC | Passed | Failed | Blocked | Un-tested |
|---:|---:|---:|---:|---:|
| **139** | **90** | **0** | **1** | **48** |

| Chỉ số | Giá trị | Cách tính |
|---|---:|---|
| Pass rate (trên TC đã chạy) | **98,9%** | Passed / (Passed + Failed + Blocked) = 90 / 91 |
| Độ phủ thực thi | **64,7%** | (Passed + Failed) / Tổng = 90 / 139 |
| TC chưa thực thi | **34,5%** | Un-tested / Tổng = 48 / 139 |
| Failed | 0 | Không có TC nào đang fail |

> **Lưu ý khi đọc số liệu:** pass rate cao nhưng **chưa phản ánh toàn bộ hệ thống**, vì hơn một phần ba test case chưa được thực thi (tập trung ở US-04, US-10, US-11, và một phần US-01, US-05, US-09). Cần đọc kèm chỉ số **độ phủ thực thi**.

## 3. Kết quả theo User Story

| User Story | Phạm vi / nguồn testcase | Tổng | Passed | Failed | Blocked | Un-tested | Pass rate | Độ phủ thực thi | Người kiểm tra |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| US-01 — E-Menu & Order Draft | [`test-cases-US01.md`](test_cases/test-cases-US01.md) | 15 | 7 | 0 | 0 | 8 | 100% | 46,7% | Nhàn |
| US-02 — AI Voice/Text Ordering | [`test-cases-US02.md`](test_cases/test-cases-US02.md) (TC-US02-MAN-001–016) | 16 | 16 | 0 | 0 | 0 | 100% | 100% | Ny |
| US-03 — KDS & AI Batching | [`test-cases-US03.md`](test_cases/test-cases-US03.md) | 24 | 23 | 0 | 1 | 0 | 95,8% | 95,8% | Nhã |
| US-04 — Tablet Phục vụ | [`test-cases-US04.md`](test_cases/test-cases-US04.md) | 19 | 0 | 0 | 0 | 19 | — | 0% | Chưa ghi nhận |
| US-05 — Thu ngân SePay | [`test-cases-US05.md`](test_cases/test-cases-US05.md) | 12 | 8 | 0 | 0 | 4 | 100% | 66,7% | Nhàn |
| US-06 — Dashboard Doanh thu | [`test-cases-US06.md`](test_cases/test-cases-US06.md) hiện **trống** | 0 | 0 | 0 | 0 | 0 | — | — | Chưa ghi nhận |
| US-07 — Menu CMS | [`test-cases-US07.md`](test_cases/test-cases-US07.md) (TC-MA-CMS-001–022) | 22 | 22 | 0 | 0 | 0 | 100% | 100% | Ny |
| US-08 — Đối soát tồn kho & Đóng ca | [`test-cases-US08.md`](test_cases/test-cases-US08.md) | 9 | 9 | 0 | 0 | 0 | 100% | 100% | Nhã |
| US-09 — Hóa đơn tạm tính | [`test-cases-US09.md`](test_cases/test-cases-US09.md) | 9 | 5 | 0 | 0 | 4 | 100% | 55,6% | Nhàn |
| US-10 — Smart Batching (Waiter) | [`test-cases-US10.md`](test_cases/test-cases-US10.md) | 8 | 0 | 0 | 0 | 8 | — | 0% | Chưa ghi nhận |
| US-11 — Quản lý khu vực bàn | [`test-cases-US11.md`](test_cases/test-cases-US11.md) | 5 | 0 | 0 | 0 | 5 | — | 0% | Chưa ghi nhận |
| **Tổng cộng** | **139 TC-ID duy nhất** | **139** | **90** | **0** | **1** | **48** | **98,9%** | **64,7%** | — |

`—` nghĩa là chưa có test case nào được chạy (hoặc chưa có test case) cho User Story đó.

### Phân bổ theo Epic

| Epic | User Story | Tổng | Passed | Failed | Blocked | Un-tested |
|---|---|---:|---:|---:|---:|---:|
| Guest Ordering Experience | US-01, US-02, US-05, US-09 | 52 | 36 | 0 | 0 | 16 |
| Kitchen & Table Operations | US-03, US-04, US-10, US-11 | 56 | 23 | 0 | 1 | 32 |
| Restaurant Management & CMS | US-06, US-07, US-08 | 31 | 31 | 0 | 0 | 0 |
| **Tổng cộng** | **US-01–US-11** | **139** | **90** | **0** | **1** | **48** |

> US-10 và US-11 chưa có trong cách phân epic của báo cáo trước; ở đây tạm xếp vào *Kitchen & Table Operations* vì cùng thuộc nhóm màn hình Phục vụ. Cần PO xác nhận.

## 4. Kết quả chạy tự động gần nhất

Số liệu lấy từ phần tổng kết trong các file test case và báo cáo trước. Đây là kết quả test ở tầng unit / integration / E2E, báo cáo tách khỏi số TC-ID ở trên (một TC-ID có thể được bao phủ bởi nhiều test tự động).

| Bộ test | Ngày | Kết quả | Nguồn |
|---|---|---|---|
| US-03 — Unit backend (`tests/unit`) | 08/10 | 18 / 18 pass | `test-cases-US03.md` |
| US-03 — Unit frontend (Vitest) | 08/10 | 14 / 14 pass | `test-cases-US03.md` |
| US-03 — Integration (`test_kds`, `test_stock`, `test_logging`, `test_orders`) | 08/10 | 38 / 38 pass | `test-cases-US03.md` |
| US-03 — Integration Postgres (`tests/pg`, tranh chấp suất cuối) | 08/10 | 3 / 3 pass | `test-cases-US03.md` |
| US-03 — E2E local | 08/10 | 7 pass, 1 skip (TC-OP-KDS-011 Blocked) | `test-cases-US03.md` |
| US-03 — Smoke staging (chỉ đọc) | 07/10 | 2 / 2 pass | `test-cases-US03.md` |
| US-08 — Integration (`test_inventory.py`) + E2E | 08/10 | 13 integration + 2 E2E, tất cả pass | `test-cases-US08.md` |
| US-05 / US-09 — Integration liên quan | 09/10 | 116 / 116 pass | `test-cases-US05.md` |
| Menu API (`test_menu.py`) | 08/10 | 22 passed | báo cáo trước |
| Voice API (`test_voice.py`, Gemini stub) | 08/10 | 16 passed | báo cáo trước |
| US-07 — Playwright E2E (14 TC chọn automation) | 08/10 và 17/10 | Tất cả Passed (xem lưu ý mục 7) | `test-cases-US07.md` |

### Số đo hiệu năng ghi nhận

| Chỉ tiêu | Kết quả | Test case |
|---|---|---|
| Đồng bộ báo hết món → E-Menu/Phục vụ | 52 ms (yêu cầu < 1 s) | TC-OP-003 |
| KDS nhận đơn realtime | Trung vị 217 ms, lớn nhất 311 ms (5 mẫu, yêu cầu < 1 s) | TC-OP-KDS-013 |

Các số đo trên là phép đo **local**, chưa phải kiểm thử tải.

## 5. Testcase đang bị Blocked

| TC-ID | User Story | Lý do | Điều kiện để tiếp tục |
|---|---|---|---|
| TC-OP-KDS-011 | US-03 | Chưa có luồng xác thực JWT/role Waiter hoàn chỉnh cho trang KDS (kỳ vọng 403 và chuyển về `/pos`). | Hoàn thiện story Auth/JWT và cấp tài khoản Waiter hợp lệ. |

TC-OP-002 (thẻ chờ quá 15 phút chớp đỏ) đã được **gỡ Blocked** ngày 09/10 và chuyển sang `Passed`, sau khi nhóm thống nhất yêu cầu trong Design System.

## 6. Testcase chưa thực thi (Un-tested)

Tổng **48 TC**, trong đó **35 TC ưu tiên cao**.

| User Story | Số TC chưa chạy | Trong đó ưu tiên cao | TC-ID | Ghi chú |
|---|---:|---:|---|---|
| US-04 | 19 | 14 | TC-US04-01 … 19 | Chưa thực thi toàn bộ; file dùng mẫu bảng cũ (không có cột Result/Date/Who checked). |
| US-10 | 8 | 7 | TC-US10-01 … 08 | Chưa thực thi toàn bộ; mẫu bảng cũ. |
| US-11 | 5 | 4 | TC-US11-01 … 05 | Chưa thực thi toàn bộ; mẫu bảng cũ. |
| US-01 | 8 | 5 | TC-US01-002, 003, 005, 007, 008, 009, 012; TC-GO-004 | Gồm chặn vượt tồn, mất mạng khi thao tác, double-click gửi bếp. |
| US-05 | 4 | 3 | TC-US05-005, 006, 008, 012 | Gồm webhook mơ hồ, sai API key, lỗi tạo QR. |
| US-09 | 4 | 2 | TC-US09-002, 005, 008, 009 | Gồm 4 trạng thái phục vụ, phân biệt khách trước/khách đang dùng. |
| US-06 | — | — | — | File test case trống, chưa có TC để chạy. |
| **Tổng** | **48** | **35** | | |

## 7. Lỗi đã ghi nhận

Tổng hợp từ cột **BUG ID** và phần Comment của các file test case, đối chiếu với báo cáo trước. **Cần đối chiếu lại với [Bug Report Register](bug-reports/bug-report.md)** trước khi chốt.

| User Story | Bug ID | Số lượng | Trạng thái ghi nhận |
|---|---|---:|---|
| US-01 | BUG-US01-001 | 1 | Closed (Fixed) — popup mã đơn không hiện do lỗi scope `res`, đã sửa và test lại pass |
| US-02 | BUG-US02-001–009 | 9 | Closed (Passed) |
| US-03 | BUG-US03-001–005 | 5 | Closed (Fixed) |
| US-05 | BUG-US05-001 | 1 | Closed (Fixed) — `demo-sim` không xác thực trên production, đã gate `DEMO_MODE` và tự ký Apikey |
| US-07 | BUG-US07-001–005 | 5 | Closed (Passed) |
| US-07 | **BUG-US07-006** | 1 | **Open** — Playwright timeout khi `fill` ô tìm kiếm trên Mobile Chrome (ảnh hưởng TC-MA-CMS-002 chạy tự động trên di động) |
| US-08 | BUG-US08-001 | 1 | Closed (Fixed) — tồn đầu ca bị trừ hai lần |
| **Tổng** | — | **23** | **22 Closed, 1 Open** |

BUG-US02-009 không được tham chiếu trong cột BUG ID của file `test-cases-US02.md` hiện tại; số liệu lấy từ báo cáo trước. BUG-US01-001 và BUG-US05-001 được ghi nhận qua Comment của TC-GO-002 và TC-US05-011.

## 8. Rủi ro và lưu ý

1. **Độ phủ thực thi mới đạt 64,7%.** Bốn nhóm chưa chạy là US-04, US-10, US-11 (32 TC) và 16 TC rải ở US-01, US-05, US-09. Pass rate 98,9% chỉ đúng trên phần đã chạy.
2. **US-06 chưa có test case.** File `test-cases-US06.md` đang trống; TC-MA-001 (Dashboard) của báo cáo trước nằm ở `test-cases.md` và không được tính ở đợt tổng hợp này.
3. **Kết quả US-07 thu được với API `/api/menu` được mock** (theo `test-cases-US07.md`), nên chưa chứng minh tích hợp frontend–backend–DB. Cần chạy lại bản E2E không mock, có dữ liệu tự tạo/tự dọn, trên môi trường staging có database riêng.
4. **TC-MA-CMS-002 trên Mobile Chrome đang lỗi tự động** (BUG-US07-006, Open). Kết quả `Passed` của TC này áp dụng cho desktop.
5. **TC-US05-009** (chặn tạo QR khi còn món chưa hoàn thành) mới có guard ở frontend; đang chờ bổ sung validate backend và integration test.
6. **TC-MA-005** (US-08, tồn thực tế âm): nút "Chốt ca" không bị disabled mà báo lỗi tại dòng; mục tiêu chặn lưu đạt nhưng khác kỳ vọng gốc, cần Ny/PO xác nhận hành vi mong muốn.
7. **TC-OP-KDS-011** vẫn Blocked chờ story Auth/JWT, nên kiểm soát truy cập KDS theo role chưa được xác minh.
8. Từ 09/10, món "Đồ uống" **không hiển thị trên KDS** (phục vụ tự mang ra); dữ liệu test KDS dùng món ăn. Các test case US-04 liên quan thông báo "CẦN LẤY NƯỚC" cần đối chiếu lại khi thực thi.
9. Chưa có kiểm thử tải 50 bàn bằng k6/Locust; số đo realtime hiện chỉ là đo local.
10. Kiểm thử có ghi dữ liệu trên staging cần database staging riêng; smoke staging chỉ đọc không thay thế E2E có ghi dữ liệu.

## 9. Khuyến nghị bước tiếp theo

| Ưu tiên | Việc cần làm | Phạm vi |
|---|---|---|
| 1 | Thực thi 35 TC ưu tiên cao chưa chạy | US-04, US-10, US-11, US-01, US-05, US-09 |
| 2 | Sửa BUG-US07-006 và chạy lại TC-MA-CMS-002 trên Mobile Chrome | US-07 |
| 3 | Chuyển US-04, US-10, US-11 sang mẫu bảng 15 cột để ghi Result/Date/Who checked/BUG ID | US-04, US-10, US-11 |
| 4 | Viết test case cho US-06 hoặc đưa lại TC-MA-001 vào file riêng | US-06 |
| 5 | Chạy E2E US-07 không mock trên staging; bổ sung validate backend cho TC-US05-009 | US-07, US-05 |
| 6 | Hoàn thiện Auth/JWT để mở khóa TC-OP-KDS-011 | US-03 |

## 10. Quy trình cập nhật

1. Ghi kết quả, ngày và người kiểm tra trong file testcase tương ứng.
2. Cập nhật bảng theo User Story và phần tổng quan ở báo cáo này; khử trùng TC-ID trước khi tính tổng.
3. Khi phát hiện bug, liên kết `BUG ID` từ testcase tới [Bug Report Register](bug-reports/bug-report.md) và đính kèm bằng chứng.
4. Chỉ chuyển bug sang trạng thái đã đóng sau khi có kết quả kiểm tra lại và bằng chứng phù hợp.
5. Báo cáo cả **pass rate** lẫn **độ phủ thực thi** để tránh hiểu nhầm chất lượng khi còn nhiều TC chưa chạy.

## 11. Lịch sử cập nhật

| Ngày | Nội dung |
|---|---|
| 17/10/2026 | Viết lại báo cáo theo dữ liệu thực tế của 11 file test case (US-01–US-11): tổng 116 → 139 TC. Mở rộng phạm vi sang US-10, US-11. Thêm chỉ số độ phủ thực thi, mục Un-tested, rủi ro và khuyến nghị. Ghi nhận BUG-US07-006 (Open). |
| 17/10/2026 (thay đổi so với bản 08/10) | US-02: 21 → 16 TC (bộ TC-GO-006–010 cũ không còn trong file, thay bằng TC-US02-MAN). US-03: 23 → 24 TC, Blocked 2 → 1 (TC-OP-002 Passed). US-04: 4 → 19 TC. US-06: 1 → 0 TC (file trống). US-10, US-11: thêm 13 TC. US-07: Passed 20 → 22 (thêm TC-021, TC-022 ngày 17/10). |
| 08/10/2026 | Chuẩn hóa tổng số testcase theo TC-ID duy nhất; đồng bộ kết quả US-02, US-03, US-07, US-08; bổ sung kết quả chạy API menu/voice và lý do Blocked. |