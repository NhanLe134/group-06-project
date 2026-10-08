# Test Scripts — Page Object Model (POM)

Thư mục này chứa toàn bộ automation test scripts theo chuẩn **Page Object Model (POM)** dùng [Playwright](https://playwright.dev/).

## Cấu trúc thư mục

```
test_scripts/
├── data/        # Test data dùng chung (fixtures, mock menus, users…)
├── pages/       # Page Object classes — mỗi màn hình 1 file
├── tests/       # Test files — mỗi người phụ trách 1 US → 1 file
├── utils/       # Helper functions, custom assertions, API helpers
└── reports/     # Output báo cáo test (HTML, JSON) — git-ignored
```

## Phân công

| File test | User Story | Phụ trách |
|---|---|---|
| `tests/us01-emenu.spec.ts` | US-01: E-Menu & Order Draft | Nhàn |
| `tests/us02-voice.spec.ts` | US-02: AI Voice Ordering | Ny |
| `tests/us03-kds.spec.ts`, `tests/us03-smoke.spec.ts` | US-03: KDS Bếp | Nhã |
| `tests/us04-waiter.spec.ts` | US-04: Tablet Phục vụ | *(thành viên)* |
| `tests/us05-splitbill.spec.ts` | US-05: Split Bill | *(thành viên)* |
| `tests/us06-dashboard.spec.ts` | US-06: Dashboard Doanh thu | *(thành viên)* |
| `tests/us07-cms.spec.ts` | US-07: CMS Quản lý Menu | *(thành viên)* |
| `tests/us08-inventory.spec.ts` | US-08: Kiểm kê Tồn kho | Nhã |

## Cách chạy

```bash
# Cài dependencies (lần đầu)
cd testing/test_scripts
npm install
npx playwright install
#hoặc 
npx playwright install chromium

# Chạy toàn bộ
npx playwright test

# Chạy 1 file cụ thể
npx playwright test tests/us01-emenu.spec.ts
 # hoặc
npx playwright test tests/us07-create_cms.spec.ts --headed --reporter=list --project=chromium
# Chạy với UI mode (debug)
npx playwright test --ui

# Xem báo cáo HTML
npx playwright show-report reports/html
```

## US-03 / US-08 — chạy trên backend E2E riêng (Nhã)

Test US-03/US-08 có thao tác GHI (gửi bếp, đổi trạng thái, trừ kho, chốt ca) nên **không chạy trên bản Vercel/Supabase**. Dùng cấu hình riêng, Playwright tự bật backend SQLite tạm (`backend/scripts/e2e_server.py`) và web tĩnh, dùng trình duyệt Edge có sẵn:

```bash
npx playwright test -c playwright.us03.config.ts                          # E2E local
npx playwright test -c playwright.us03.config.ts --project=staging-smoke  # smoke chỉ đọc trên staging
```

Chạy bằng `playwright.config.ts` chung thì các test này tự `skip`. Test case: `testing/test_cases/test-cases-US03.md`, `US08.md`; kết quả: `testing/reports/US-03/`.

