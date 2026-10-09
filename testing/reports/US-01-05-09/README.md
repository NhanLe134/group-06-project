# Test report — US-01 E-Menu · US-05 Thu ngân SePay · US-09 Hóa đơn tạm tính

> Owner: Nhàn · Lần chạy cuối: **2026-10-09** trên nhánh `develop` (commit `dcaaa3d` trở đi, sau ADR-N15/N16) · Bằng chứng cho giáo trình (bảng artifact QA: "Test cases + test result + bug report") và theo `testing/test-strategy.md` của Ny. Cấu trúc thư mục làm theo mẫu `reports/US-03/` (Nhã).

## 1. Kết quả

| Tầng | Bộ test | Số test | Kết quả | File kết quả |
|---|---|---|---|---|
| Integration backend | `backend/tests/` (pytest, phần US-01/05/09: `test_orders.py`, `test_sepay.py`, `test_menu.py`) | 119 (toàn bộ suite) | **119 pass** | `pytest-junit.xml` |
| Unit frontend | `frontend/tests/` (Vitest: `kds-logic.test.js` + `cashier-logic.test.js`) | 17 | **17 pass** | `vitest-output.txt` |
| E2E local | `testing/test_scripts/tests/us01-emenu.spec.ts` (5), `us05-cashier.spec.ts` (2), `us09-bill.spec.ts` (3) | 10 | **10 pass** | `playwright-results.json`, `playwright-output.txt` |
| Smoke staging | `us010509-smoke.spec.ts` (Vercel + Render thật, chỉ đọc) | 3 | **3 pass** | `playwright-results.json` |

## 2. Lỗi tìm được nhờ test (đã fix + test lại pass)

| Bug | Mức | Tìm bởi | Fix | Regression test |
|---|---|---|---|---|
| [BUG-US01-001](../../bug-reports/BUG-US01-001.md) — popup gửi bếp thành công không bao giờ hiện (`const` trong khối `try` dùng ngoài scope → ReferenceError sau POST 200) | **P1 High** | E2E `TC-GO-002` | GuiBep.js: dời `res` ra ngoài `try`; bổ sung element `#success-code` | E2E TC-GO-002 assert `#success-code` chứa "Mã đơn:" — pass |
| [BUG-US05-001](../../bug-reports/BUG-US05-001.md) — `/sepay/demo-sim` không xác thực: production ai gọi cũng đóng bàn được | **P1 High (Security)** | E2E `TC-US05-011` (401 UNAUTHORIZED_WEBHOOK) | Gate `DEMO_MODE` (tắt → 404) + tự ký Apikey nội bộ | `test_sepay_demo_simulation_tat_khi_demo_mode_false` + E2E TC-US05-011 — pass |

Chi tiết Root Cause / Solution / Evidence: 2 file bug report trong `testing/bug-reports/`.

## 3. Tóm tắt theo test case

| User Story | Tổng TC | Passed | Un-tested (manual/chưa auto) | Chi tiết |
|---|---:|---:|---:|---|
| US-01 — E-Menu & Order Draft | 15 | 7 | 8 | `test_cases/test-cases-US01.md` |
| US-05 — Thu ngân SePay | 12 | 8 | 4 | `test_cases/test-cases-US05.md` |
| US-09 — Hóa đơn tạm tính | 9 | 5 | 4 | `test_cases/test-cases-US09.md` |

Các TC `Un-tested` là TC **manual** (scroll-spy, BR-05 soi nút, ghi chú FE...) hoặc chưa viết automation — không tính vào pass rate theo công thức của `testing/test-report.md`.

## 4. Cách chạy lại (PowerShell)

```powershell
cd backend;  uv run pytest -q --junitxml=../testing/reports/US-01-05-09/pytest-junit.xml
cd frontend; npx vitest run
cd testing/test_scripts; npx playwright test -c playwright.us010509.config.ts
# chỉ smoke staging (chỉ đọc):
npx playwright test -c playwright.us010509.config.ts --project=staging-smoke
```
