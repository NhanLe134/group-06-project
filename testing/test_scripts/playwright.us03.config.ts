import { defineConfig } from '@playwright/test';

/**
 * Cấu hình E2E cho US-03 (KDS) và US-08 (Kiểm kê) — Owner: Nhã.
 *
 * Khác playwright.config.ts chung (chạy trên bản Vercel): các test ở đây TẠO ĐƠN, ĐỔI TRẠNG THÁI,
 * TRỪ KHO… nên chạy trên backend E2E riêng (SQLite tạm, backend/scripts/e2e_server.py),
 * không đụng Supabase dùng chung. Playwright tự bật 2 server dưới đây rồi tắt khi xong.
 *
 *   npx playwright test -c playwright.us03.config.ts                 # E2E local
 *   npx playwright test -c playwright.us03.config.ts --project=staging-smoke   # chỉ đọc, trên URL thật
 */
const API_PORT = 8765;
const WEB_PORT = 5511;
process.env.E2E_API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: './tests',
  outputDir: './reports/us03/results',
  workers: 1, // các test dùng chung 1 database E2E → chạy tuần tự
  timeout: 45_000,
  reporter: [
    ['list'],
    ['json', { outputFile: './reports/us03/results.json' }],
    ['html', { outputFolder: './reports/us03/html', open: 'never' }],
  ],
  use: {
    channel: 'msedge', // dùng Edge có sẵn trên Windows, không cần tải trình duyệt
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'local-e2e',
      testMatch: /us0[38]-.*\.spec\.ts/,
      testIgnore: /smoke/,
      use: { baseURL: `http://127.0.0.1:${WEB_PORT}` },
    },
    {
      name: 'staging-smoke',
      testMatch: /us03-smoke\.spec\.ts/,
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
    },
    {
      command: `python -m http.server ${WEB_PORT} --bind 127.0.0.1`,
      cwd: '../../frontend/fe_ofc',
      url: `http://127.0.0.1:${WEB_PORT}/pages/kitchen.html`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
