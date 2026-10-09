/**
 * US-01/05/09 — Smoke test trên URL staging thật (giáo trình §12 bước 1), CHỈ ĐỌC dữ liệu.
 * Phụ trách: Nhàn. Mẫu: us03-smoke.spec.ts (Nhã).
 *
 * Chạy: npx playwright test -c playwright.us010509.config.ts --project=staging-smoke
 * Lưu ý: Render free có thể ngủ → lần gọi đầu chậm (timeout 90 s).
 */
import { expect, test } from '@playwright/test';

const STAGING_API = process.env.STAGING_API_URL || 'https://group06-restaurant-api.onrender.com';

test.describe('US-01/05/09 — Smoke trên staging (chỉ đọc)', () => {
  test.setTimeout(90_000);

  test('backend staging sống và trả thực đơn + danh sách bàn', async ({ request }) => {
    const health = await request.get(`${STAGING_API}/health`, { timeout: 60_000 });
    expect(health.status()).toBe(200);

    const menu = await request.get(`${STAGING_API}/menu`, { timeout: 60_000 });
    expect(menu.status()).toBe(200);
    const items = await menu.json();
    expect(Array.isArray(items) && items.length).toBeTruthy();

    const tables = await request.get(`${STAGING_API}/cashier/tables`, { timeout: 60_000 });
    expect(tables.status()).toBe(200);
    expect(Array.isArray(await tables.json())).toBeTruthy();
  });

  test('E-Menu staging mở được và render món (US-01)', async ({ page }) => {
    await page.goto('/pages/customer.html?table=B%C3%A0n%2006');
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 60_000 });
  });

  test('Màn Thu ngân staging mở được và có danh sách bàn (US-05)', async ({ page }) => {
    await page.goto('/pages/cashier.html');
    await expect(page.locator('.tc-card').first()).toBeVisible({ timeout: 60_000 });
  });
});
