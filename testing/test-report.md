# Báo cáo kiểm thử hệ thống Smart Ordering

## 1. Thông tin báo cáo

| Thuộc tính | Nội dung |
|---|---|
| Ngày cập nhật | 08/10/2026 |
| Dự án | Smart Restaurant Ordering & KDS — Group 06 |
| Phạm vi | US-01 đến US-08; kiểm thử chức năng, API, tích hợp và E2E được ghi trong bộ test hiện hành |
| Môi trường | Localhost, backend kiểm thử và staging Vercel/Render theo từng bộ test |
| Nguồn testcase | [`testing/test-cases.md`](test-cases.md) và các file trong [`testing/test_cases/`](test_cases/) |
| Sổ đăng ký lỗi | [`testing/bug-reports/bug-report.md`](bug-reports/bug-report.md) |

> Báo cáo tổng hợp theo **TC-ID duy nhất**. Các TC-ID xuất hiện đồng thời trong file tổng và file riêng của User Story chỉ được tính một lần.

## 2. Tổng quan kết quả

| Tổng TC | Passed | Failed | Blocked | Un-tested | Pass rate* |
|---:|---:|---:|---:|---:|---:|
| **87** | **66** | **0** | **2** | **19** | **97,1%** |

\* Pass rate = Passed / (Passed + Failed + Blocked) = 66 / 68. Các testcase `Un-tested` không nằm trong mẫu số. Hai testcase `Blocked` được giữ riêng vì chưa thể thực thi trong điều kiện hiện tại.

## 3. Kết quả theo User Story

| User Story | Phạm vi / nguồn testcase | Tổng | Passed | Failed | Blocked | Un-tested | Pass rate* | Người kiểm tra |
|---|---|---:|---:|---:|---:|---:|---:|---|
| US-01 — E-Menu & Order Draft | TC-GO-001–005, [`test-cases.md`](test-cases.md) | 5 | 0 | 0 | 0 | 5 | — | Nhàn |
| US-02 — AI Voice/Text Ordering | TC-GO-006–010 và TC-US02-MAN-001–016; [`test-cases-US02.md`](test_cases/test-cases-US02.md) | 21 | 16 | 0 | 0 | 5 | 100% | Ny |
| US-03 — KDS & AI Batching | 23 TC trong [`test-cases-US03.md`](test_cases/test-cases-US03.md) | 23 | 21 | 0 | 2 | 0 | 91,3% | Nhã |
| US-04 — Tablet Phục vụ | TC-OP-006–009, [`test-cases.md`](test-cases.md) | 4 | 0 | 0 | 0 | 4 | — | Trang |
| US-05 — Split Bill | TC-GO-011–012, [`test-cases.md`](test-cases.md) | 2 | 0 | 0 | 0 | 2 | — | Nhàn |
| US-06 — Dashboard Doanh thu | TC-MA-001, [`test-cases.md`](test-cases.md) | 1 | 0 | 0 | 0 | 1 | — | Trang, Nhã |
| US-07 — Menu CMS | TC-MA-002–003 và TC-MA-CMS-001–020; [`test-cases-US07.md`](test_cases/test-cases-US07.md) | 22 | 20 | 0 | 0 | 2 | 100% | Ny |
| US-08 — Đối soát tồn kho & Đóng ca | 9 TC trong [`test-cases-US08.md`](test_cases/test-cases-US08.md) | 9 | 9 | 0 | 0 | 0 | 100% | Nhã |
| **Tổng cộng** | **87 TC-ID duy nhất** | **87** | **66** | **0** | **2** | **19** | **97,1%** | — |

\* Cùng công thức ở phần tổng quan; `—` nghĩa là chưa có testcase nào được chạy cho User Story đó.

### Phân bổ theo Epic

| Epic | User Story | Tổng | Passed | Failed | Blocked | Un-tested |
|---|---|---:|---:|---:|---:|---:|
| Guest Ordering Experience | US-01, US-02, US-05 | 28 | 16 | 0 | 0 | 12 |
| Kitchen & Table Operations | US-03, US-04 | 27 | 21 | 0 | 2 | 4 |
| Restaurant Management & CMS | US-06, US-07, US-08 | 32 | 29 | 0 | 0 | 3 |
| **Tổng cộng** | **US-01–US-08** | **87** | **66** | **0** | **2** | **19** |

## 4. Kết quả chạy tự động gần nhất

Các bộ API menu và voice đã chạy riêng ngày 08/10/2026. Đây là kết quả của test tự động ở tầng router/API, được báo cáo tách khỏi số TC-ID ở phần trên.

| Bộ test | Lệnh | Kết quả |
|---|---|---:|
| Menu API | `uv run pytest tests/routers/test_menu.py -v -p no:cacheprovider` | **22 passed** |
| Voice API | `uv run pytest tests/routers/test_voice.py -v -p no:cacheprovider` | **16 passed** |
| **Tổng hai bộ** | — | **38 passed, 0 failed** |

Voice API tests dùng Gemini stub để kiểm tra hợp đồng HTTP và luật xử lý xác định mà không gọi dịch vụ ngoài. Chi tiết test và từng kết quả `PASSED` được in bằng chế độ verbose.

## 5. Testcase đang bị Blocked

| TC-ID | User Story | Lý do | Điều kiện để tiếp tục |
|---|---|---|---|
| TC-OP-KDS-011 | US-03 | Chưa có luồng xác thực JWT/role Waiter hoàn chỉnh cho trang KDS. | Hoàn thiện Auth/JWT và cấp tài khoản Waiter hợp lệ. |
| TC-OP-002 | US-03 | Quy tắc thẻ chờ quá 15 phút chưa nằm trong các AC được thống nhất; đang chờ quyết định PO. | PO xác nhận phạm vi và hành vi mong muốn. |

## 6. Lỗi đã ghi nhận

Sổ đăng ký hiện có **20 bug**, tất cả được đánh dấu đã đóng trong hồ sơ bug.

| User Story | Bug ID | Số lượng | Trạng thái ghi nhận |
|---|---|---:|---|
| US-02 | BUG-US02-001–009 | 9 | Closed (Passed) |
| US-03 | BUG-US03-001–005 | 5 | Closed (Fixed) |
| US-07 | BUG-US07-001–005 | 5 | Closed (Passed) |
| US-08 | BUG-US08-001 | 1 | Closed (Fixed) |
| **Tổng** | — | **20** | **0 bug đang mở theo bug register** |

Mô tả, kết quả thực tế và bằng chứng của từng bug nằm trong [Bug Report Register](bug-reports/bug-report.md) và các hồ sơ chi tiết cùng thư mục.

## 7. Phạm vi chưa hoàn tất và lưu ý

- Còn **19 testcase Un-tested**: US-01 (5), các testcase cũ TC-GO-006–010 của US-02 (5), US-04 (4), US-05 (2), US-06 (1), và TC-MA-002–003 của US-07 (2).
- Kiểm thử có ghi dữ liệu trên staging cần dùng database staging riêng; các bài smoke staging chỉ đọc không thay thế kiểm thử E2E có ghi dữ liệu.
- Báo cáo US-03 ghi nhận chưa có kiểm thử tải 50 bàn bằng k6/Locust; số đo realtime hiện có là phép đo local.
- Kết quả từng tầng và bằng chứng US-03/US-08 được lưu tại [`testing/reports/US-03/`](reports/US-03/).

## 8. Quy trình cập nhật

1. Ghi kết quả, ngày và người kiểm tra trong file testcase tương ứng.
2. Cập nhật bảng theo User Story và phần tổng quan ở báo cáo này; khử trùng TC-ID trước khi tính tổng.
3. Khi phát hiện bug, liên kết `BUG ID` từ testcase tới [Bug Report Register](bug-reports/bug-report.md) và đính kèm bằng chứng.
4. Chỉ chuyển bug sang trạng thái đã đóng sau khi có kết quả kiểm tra lại và bằng chứng phù hợp.

## 9. Lịch sử cập nhật

| Ngày | Nội dung |
|---|---|
| 08/10/2026 | Chuẩn hóa tổng số testcase theo TC-ID duy nhất; đồng bộ kết quả US-02, US-03, US-07, US-08; bổ sung kết quả chạy API menu/voice và lý do Blocked. |
