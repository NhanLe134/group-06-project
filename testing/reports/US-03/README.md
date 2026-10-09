# Test report — US-03 KDS (+ trừ kho tự động) và US-08 Kiểm kê

> Owner: Nhã · Lần chạy cuối: **2026-10-08** trên `develop` (sau khi gộp thiết kế DB ADR-N14 của Nhàn) · Bằng chứng cho giáo trình (bảng artifact QA: "Test cases + test result + bug report") và theo `testing/test-strategy.md` của Ny.
> Lần chạy 2026-10-07 xem lịch sử git của file này.

> **Bổ sung 2026-10-09 (2):** KDS dùng chung `design-system.css`; làm REQ-08 đồng hồ chờ + chớp đỏ > 15 phút → TC-OP-002 `Passed` (Vitest 14/14, Playwright 9 pass + 1 skip AC4). `playwright-results.json` là lần chạy mới nhất.
> **Bổ sung 2026-10-09:** log backend (giáo trình §12 bước 4) + 3 test `backend/tests/routers/test_logging.py` (TC-OP-KDS-019) — backend 114 passed, ruff sạch. Cách xem log: `docs/RUNBOOK.md` Mục 7.

## 1. Kết quả

| Tầng | Bộ test | Số test | Kết quả | File kết quả |
|---|---|---|---|---|
| Unit backend | `backend/tests/unit/` | 18 | 18 pass | `pytest-junit.xml` |
| Unit frontend | `frontend/tests/kds-logic.test.js` (Vitest) | 11 | 11 pass | `vitest-output.txt` |
| Integration | `backend/tests/routers/` (cả nhóm; phần US-03/US-08: 48) | 67 | 67 pass | `pytest-junit.xml` |
| Integration Postgres | `backend/tests/pg/` (tranh chấp) | 3 | 3 pass | `pytest-junit.xml` |
| E2E local | `testing/test_scripts/tests/us03-kds.spec.ts`, `us08-inventory.spec.ts` | 10 | 8 pass, 2 skip (`Blocked`) | `playwright-results.json` |
| Smoke staging | `us03-smoke.spec.ts` (Vercel + Render, chỉ đọc) | 2 | 2 pass (07/10) | — |
| Lint | `ruff check .` | — | sạch | `pytest-output.txt` |

Test case: US-03 **21 `Passed` · 0 `Failed` · 2 `Blocked`**; US-08 **9 `Passed`**. Chi tiết: `testing/test_cases/test-cases-US03.md`, `test-cases-US08.md`; kết quả cũng đã điền vào `testing/test-cases.md` (TC-OP-001…005, TC-MA-004/005).

**`Blocked` có lý do:** TC-OP-KDS-011 (AC4 — chờ JWT), TC-OP-002 (chớp đỏ 15 phút — không có trong AC US-03, chờ PO).

## 2. Lỗi tìm được nhờ test (thang mức độ của `test-strategy.md` §4.1)

| Bug | Mức | Tìm bởi | Trạng thái |
|---|---|---|---|
| BUG-US03-001 Món đã gửi bếp bị khóa nấu khi tồn về 0 | P2 | Thiết kế + integration | Fixed |
| BUG-US03-002 Khung Tồn kho sai với `soluongton` cũ | P2 | Nhã chụp màn hình | Fixed |
| BUG-US03-003 Realtime không chạy trên bản deploy | P1 | Khi gộp code (A-86) | Fixed |
| BUG-US03-004 KDS gom mọi món thành "N× Món" sau ADR-N14 | P1 | **E2E** TC-OP-KDS-001 | Fixed |
| BUG-US03-005 Đơn gửi đúng lúc bếp báo hết vẫn được nhận | P2 | **Integration Postgres** TC-OP-005 | Fixed |
| BUG-US08-001 Tồn đầu ca bị trừ hai lần | P2 | Thiết kế + integration | Fixed |

Còn mở: **0** P1/P2 — đạt tiêu chí `test-strategy.md` §4.1 mục 6. Bảng tổng hợp: [`testing/bug-reports/bug-report.md`](../../bug-reports/bug-report.md); hồ sơ chi tiết nằm trong `testing/bug-reports/`.

## 3. Đối chiếu tiêu chí đóng (`test-strategy.md` §4.1)

| Tiêu chí của Ny | Yêu cầu | Phần US-03/US-08 | Đạt? |
|---|---|---|---|
| Tỉ lệ thực thi test case | 100% trên **staging** | 100% test case chạy, nhưng E2E chạy trên **backend E2E local**; staging chỉ smoke chỉ đọc | ⚠️ Lệch có chủ đích (ADR-NA09): chạy test có ghi dữ liệu trên Supabase dùng chung sẽ làm bẩn dữ liệu cả nhóm — cần DB staging riêng |
| Pass P1 | 100% | 100% (trừ 2 `Blocked`) | ✅ |
| Pass toàn bộ | ≥ 95% | 30/30 test case đã chạy | ✅ |
| Test tự động | ≥ 95% pass | 100% | ✅ |
| Độ phủ code logic cốt lõi | ≥ 85% | `services/kds.py` **99%**, `services/stock.py` **96%**, `services/inventory.py` **97%**, `routers/kds.py` 98%, `routers/ingredients.py` 100%, `routers/inventory.py` 100% | ✅ |
| Độ phủ toàn dự án | ≥ 75% | **76%** (backend) | ✅ |
| Luồng lỗi 400/401/403/404/409 | ≥ 90% | 404, 409, 422 có test; **401/403 chưa** (chờ JWT) | ⚠️ |
| Lỗi tồn đọng P1/P2 | 0 | 0 | ✅ |

Độ phủ đo bằng `pytest-cov` với `concurrency = greenlet` (bắt buộc cho SQLAlchemy async — không bật thì số đo sai, ví dụ `inventory.py` báo 44% thay vì 97%). Frontend chưa đo độ phủ (cả 4 hàm trong `kds-logic.js` đều có unit test).

## 4. Tỉ lệ các tầng test

| | Unit | Integration | E2E |
|---|---|---|---|
| `test-strategy.md` (Ny) | ~55% | ~30% | ~15% |
| Giáo trình §11.2 | 60–70% | 15–25% | 5–15% |
| Phần US-03/US-08 của Nhã | **29 (33%)** | **51 (58%)** | **8 (9%)** |

**Lệch: nặng integration.** Lý do: phần lớn quy tắc (trừ kho, khóa dòng, chuyển trạng thái kèm hoàn kho, chốt ca) nằm trong giao dịch DB nên test qua API + SQLite trong bộ nhớ mới chứng minh đúng hành vi; bộ test này vẫn chạy nhanh (cả backend ~5 s). Logic thuần đã được tách và unit test (`kds-logic.js`, quy tắc chuyển trạng thái, số phần còn). Không tách thêm code chỉ để tăng tỉ lệ unit (A-104).

## 5. Số đo hiệu năng cơ bản (giáo trình §15 bước 8)

| Chỉ số | Mục tiêu | Đo được (2026-10-08) | Đánh giá |
|---|---|---|---|
| Gửi bếp → thẻ hiện trên KDS (NFR-RO-01) | < 500 ms | **trung vị 217 ms**, lớn nhất 311 ms (5 mẫu: 311, 208, 215, 230, 217) | Đạt |
| Bếp báo hết → E-Menu khóa món (REQ-09) | < 1 s | **52 ms** | Đạt |
| 6 bàn tranh 2 phần cuối (Postgres) | Không bán vượt | 2 thành công / 4 bị 409, tồn = 0 | Đạt |
| Đơn gửi đúng lúc bếp báo hết (Postgres) | Đơn đến sau bị 409 | 409, tồn không đổi | Đạt (sau khi sửa BUG-US03-005) |

Mẫu chậm nhất luôn là đơn đầu tiên sau khi mở trang. Lần chạy 07/10 chỉ đo 1 mẫu (đúng đơn đầu) nên ra 635–710 ms và kết luận nhầm là chưa đạt — đã sửa cách đo. Đo trên máy local; **chưa đo dưới tải 50 bàn (k6/Locust)** như chiến lược §3.

## 6. Kiểm chứng test có ý nghĩa (mutation check)

| Test | Cách phá code | Kết quả khi phá |
|---|---|---|
| `test_opening_stock_not_double_counted_after_real_orders` | Đưa công thức tồn đầu ca về như cũ | Fail `(7, 3, 4) != (10, 3, 7)` |
| `tests/pg` — tranh suất cuối (2 test) | Bỏ `SELECT … FOR UPDATE` trong `services/stock.py` | Fail — 6/6 đơn qua (bán vượt) |
| `tests/pg` — đơn trùng lúc bếp báo hết | (Code trước khi sửa BUG-US03-005) | Fail `200 != 409` |
| E2E TC-OP-KDS-001 | (Code sau ADR-N14, trước khi sửa BUG-US03-004) | Fail — mẻ "4× Món" |

Sau khi khôi phục / sửa code, tất cả pass.

## 7. Chưa làm / còn rủi ro

- AC4 và các test 401/403 (chờ JWT).
- Edge case giáo trình §11.3 chưa có: trình đọc màn hình trên KDS; **phản ứng của giao diện** KDS khi server trả 5xx/429 (phía backend: lỗi 500 đã có xử lý + log + test — TC-OP-KDS-019).
- Chưa đo tải 50 bàn; E2E và test Postgres chưa chạy trong CI (CI chỉ chạy ruff, pytest, vitest).
- Test được viết **sau** code (giáo trình §10 bước 7 yêu cầu viết cùng task) — trừ test trừ kho (có spec trước) và các regression test.
- Smoke staging cần chạy lại sau khi bản online deploy bản có sửa BUG-US03-004/005.

## 8. Cách chạy lại

Chạy từ thư mục gốc repo. **Windows PowerShell 5.1 không hiểu `&&`** — gõ từng dòng (hoặc nối bằng `;`):

```powershell
cd backend
uv run pytest
uv run ruff check .
cd ..\frontend
npx vitest run
cd ..\testing\test_scripts
npm ci                                            # chỉ cần lần đầu
npx playwright test -c playwright.us03.config.ts
```

Git Bash / macOS / Linux: `cd backend && uv run pytest && uv run ruff check .` (tương tự cho các lệnh khác).
Postgres (cần Docker): xem đầu file `backend/tests/pg/test_race_last_portion.py`.
Độ phủ: `uv run --with pytest-cov pytest --cov=app` với file cấu hình có `[run] concurrency = greenlet,thread`.
