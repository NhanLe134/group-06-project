# Test report — US-03 KDS (+ trừ kho tự động) và US-08 Kiểm kê

> Owner: Nhã · Chạy lần 1: 2026-10-07 (nhánh `feature/US-03-tests`) · **Chạy lại: 2026-10-08** sau khi gộp thiết kế DB mới ADR-N14 của Nhàn vào `develop` · Bằng chứng cho giáo trình (bảng artifact QA: "Test cases + test result + bug report").

> **Lần chạy lại 2026-10-08 bắt được 1 lỗi thật:** E2E TC-OP-KDS-001 fail vì ADR-N14 đổi tên trường API mà KDS chưa cập nhật → **BUG-US03-004** (đã sửa, thêm unit test). Số liệu bên dưới là của lần chạy 2026-10-08.

## Kết quả

| Tầng (§11.2) | Bộ test | Số test | Kết quả | File kết quả |
|---|---|---|---|---|
| Unit backend | `backend/tests/unit/` | 18 | 18 pass | `pytest-junit.xml` |
| Unit frontend | `frontend/tests/kds-logic.test.js` (Vitest) | 11 | 11 pass | `vitest-output.txt` |
| Integration | `backend/tests/routers/` (cả nhóm) | 67 | 67 pass | `pytest-junit.xml`, `pytest-output.txt` |
| Integration Postgres | `backend/tests/pg/` (tranh chấp suất cuối) | 2 | 2 pass | `pytest-junit.xml` |
| E2E local | `testing/test_scripts/tests/us03-kds.spec.ts`, `us08-inventory.spec.ts` | 10 | 8 pass, 2 skip | `playwright-results.json` |
| Smoke staging | `testing/test_scripts/tests/us03-smoke.spec.ts` (Vercel + Render, chỉ đọc) | 2 | 2 pass (2026-10-07; chưa chạy lại vì staging chưa có bản sửa BUG-US03-004) | (output console) |
| Lint | `ruff check .` | — | sạch | `pytest-output.txt` |

Tỉ lệ phần US-03/US-08 của Nhã: Unit 29 · Integration 46 · E2E 10 (+2 smoke).

**Bỏ qua có lý do:** TC-OP-KDS-011 (AC4 — chờ JWT), TC-OP-002 (chớp đỏ 15 phút — chưa có trong AC US-03, chờ PO).

## Số đo (giáo trình §15 bước 8 — performance cơ bản)

| Chỉ số | Mục tiêu | Đo được | Đánh giá |
|---|---|---|---|
| Gửi bếp → thẻ hiện trên KDS (NFR-RO-01) | < 500 ms | **710 ms** (07/10: 635 ms) | Chưa đạt — có debounce 150 ms + tải lại `GET /kds/items`; ghi nhận để tối ưu |
| Bếp báo hết → E-Menu gỡ món (REQ-09) | < 1 s | **117 ms** (07/10: 41 ms) | Đạt |
| 6 bàn tranh 2 phần cuối (Postgres) | Không bán vượt | 2 thành công / 4 bị 409, tồn = 0 | Đạt |

Đo trên máy local (backend + trình duyệt cùng máy); trên mạng thật sẽ chậm hơn.

## Kiểm chứng test có ý nghĩa (mutation check)

| Test | Cách phá code | Kết quả khi phá |
|---|---|---|
| `test_opening_stock_not_double_counted_after_real_orders` | Đưa công thức tồn đầu ca về như cũ | Fail `(7, 3, 4) != (10, 3, 7)` |
| `tests/pg/test_race_last_portion.py` (2 test) | Bỏ `SELECT ... FOR UPDATE` trong `services/stock.py` | Fail — 6/6 đơn qua (bán vượt tồn) |

Sau khi khôi phục code, cả 3 test pass lại.

## Cách chạy lại

```bash
cd backend && uv run pytest && uv run ruff check .
cd frontend && npx vitest run
cd testing/test_scripts && npm ci && npx playwright test -c playwright.us03.config.ts
# Postgres (cần Docker): xem đầu file backend/tests/pg/test_race_last_portion.py
```

Test case: `testing/test_cases/test-cases-US03.md`, `test-cases-US08.md`. Bug report: `testing/bug-reports/`.
