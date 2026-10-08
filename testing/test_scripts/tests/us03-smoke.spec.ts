/**
 * US-03 — Smoke test trên URL staging thật (giáo trình §12 bước 1), CHỈ ĐỌC dữ liệu.
 * Phụ trách: Nhã. Test case: TC-OP-KDS-016 (testing/test_cases/test-cases-US03.md).
 *
 * Chạy: npx playwright test -c playwright.us03.config.ts --project=staging-smoke
 * Đổi URL: STAGING_URL=... STAGING_API_URL=...
 * Lưu ý: Render free có thể ngủ → lần gọi đầu chậm (timeout 60 s).
 */
import { expect, test } from '@playwright/test';

const STAGING_API = process.env.STAGING_API_URL || 'https://group06-restaurant-api.onrender.com';

test.describe('US-03 — Smoke trên staging (chỉ đọc)', () => {
  test.setTimeout(90_000);

  test('backend staging sống và trả thực đơn', async ({ request }) => {
    const health = await request.get(`${STAGING_API}/health`, { timeout: 60_000 });
    expect(health.status()).toBe(200);
    const menu = await request.get(`${STAGING_API}/menu`, { timeout: 60_000 });
    expect(menu.status()).toBe(200);
    const items = await menu.json();
    expect(Array.isArray(items) && items.length).toBeTruthy();
    expect(items[0]).toHaveProperty('portions'); // API có trường số phần còn (bản mới nhất)
  });

  test('màn hình KDS staging mở được và kết nối Realtime', async ({ page }) => {
    await page.goto('/pages/kitchen.html');
    await expect(page.locator('.kds-head h2')).toHaveText(/Bếp KDS/, { timeout: 60_000 });
    await expect(page.locator('#conn')).toContainText('Realtime', { timeout: 60_000 });
  });
});
