import { defineConfig } from '@playwright/test';

/**
 * Cấu hình E2E cho US-01 (E-Menu), US-05 (Thu ngân SePay) và US-09 (Hóa đơn) — Owner: Nhàn.
 *
 * Cùng cơ chế với playwright.us03.config.ts (Nhã): các test TẠO ĐƠN, ĐỔI TRẠNG THÁI, CHẤT QR,
 * ĐÓNG BÀN nên chạy trên backend E2E riêng (SQLite tạm, backend/scripts/e2e_server.py),
 * không đụng Supabase dùng chung. Playwright tự bật 2 server rồi tắt khi xong.
 *
 *   npx playwright test -c playwright.us010509.config.ts                 # E2E local
 *   npx playwright test -c playwright.us010509.config.ts --project=staging-smoke   # chỉ đọc, URL thật
 */
const API_PORT = 8766;
const WEB_PORT = 5513;
process.env.E2E_API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: './tests',
  outputDir: './reports/us010509/results',
  workers: 1, // các test dùng chung 1 database E2E → chạy tuần tự
  timeout: 45_000,
  reporter: [
    ['list'],
    ['json', { outputFile: './reports/us010509/results.json' }],
  ],
  use: {
    channel: 'msedge', // dùng Edge có sẵn trên Windows, không cần tải trình duyệt
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'local-e2e',
      testMatch: /us0[159]-.*\.spec\.ts/,
      testIgnore: /smoke/,
      use: { baseURL: `http://127.0.0.1:${WEB_PORT}` },
    },
    {
      name: 'staging-smoke',
      testMatch: /us010509-smoke\.spec\.ts/,
      use: { baseURL: process.env.STAGING_URL || 'https://smart-orderding.vercel.app' },
    },
  ],
  webServer: [
    {
      command: `uv run python -m scripts.e2e_server ${API_PORT}`,
      cwd: '../../backend',
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { DEMO_MODE: 'true' }, // US-05 AC6: cho phép POST /sepay/demo-sim mô phỏng thanh toán
    },
    {
      command: `python -m http.server ${WEB_PORT} --bind 127.0.0.1`,
      cwd: '../../frontend/fe_ofc',
      url: `http://127.0.0.1:${WEB_PORT}/pages/customer.html`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
