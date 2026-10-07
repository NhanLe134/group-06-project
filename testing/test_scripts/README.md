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
| `tests/us03-kds.spec.ts` | US-03: KDS Bếp | *(thành viên)* |
| `tests/us04-waiter.spec.ts` | US-04: Tablet Phục vụ | *(thành viên)* |
| `tests/us05-splitbill.spec.ts` | US-05: Split Bill | *(thành viên)* |
| `tests/us06-dashboard.spec.ts` | US-06: Dashboard Doanh thu | *(thành viên)* |
| `tests/us07-cms.spec.ts` | US-07: CMS Quản lý Menu | *(thành viên)* |
| `tests/us08-inventory.spec.ts` | US-08: Kiểm kê Tồn kho | *(thành viên)* |

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
