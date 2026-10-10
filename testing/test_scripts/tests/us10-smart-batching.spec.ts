/**
 * US-10: Smart Batching (Gom nhóm thông báo Waiter)
 * Full E2E Automation Suite with REAL API INJECTION
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('US-10 — Smart Batching', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.getByRole('button', { name: 'Phục vụ' }).click();
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL('**/waiter.html');
  });

  test('TC-US10-01: Gom âm thanh và popup trong vòng 10s', async ({ page, request }) => {
    // Gọi API lấy UUID thực đơn
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    const phoBo = menu.find((m: any) => m.name.includes('Phở bò'));
    
    // Gửi bếp 3 tô Phở bò cho Bàn 04 (Khu B)
    await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 04', items: [{ thucdon_id: phoBo.id, soluong: 3 }] }
    });

    const kdsRes = await request.get(`${API_BASE}/kds/items`);
    const kdsItems = await kdsRes.json();
    const myItems = kdsItems.filter((i: any) => i.ban === 'Bàn 04');

    // Bếp báo xong món liên tục
    for (const item of myItems) {
      await request.patch(`${API_BASE}/kds/items/${item.id}/status`, { data: { trangthai: 'da_xong' } });
      await page.waitForTimeout(1000); // Cách nhau 1s
    }

    // Chờ 11s để batching chạy xong
    await page.waitForTimeout(11000);
    const popups = await page.locator('.notif-card', { hasText: 'Bàn 04' }).count();
    
    // Gom thành 1 popup duy nhất
    expect(popups).toBe(1);
    await expect(page.locator('.notif-card', { hasText: 'Bàn 04' })).toContainText('3 món');
  });

  test('TC-US10-03 & TC-US10-07: Gợi ý gom mâm và Lấy xong (CÙNG TÊN, CÙNG ZONE)', async ({ page, request }) => {
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    const phoBo = menu.find((m: any) => m.name.includes('Phở bò'));
    
    // Gọi món cho 2 bàn cùng Khu B (Bàn 04, Bàn 05)
    await request.post(`${API_BASE}/orders`, { data: { table_name: 'Bàn 04', items: [{ thucdon_id: phoBo.id, soluong: 1 }] }});
    await request.post(`${API_BASE}/orders`, { data: { table_name: 'Bàn 05', items: [{ thucdon_id: phoBo.id, soluong: 1 }] }});

    const kdsRes = await request.get(`${API_BASE}/kds/items`);
    const kdsItems = await kdsRes.json();
    const myItems = kdsItems.filter((i: any) => (i.ban === 'Bàn 04' || i.ban === 'Bàn 05') && i.tenmon === phoBo.name);

    for (const item of myItems) {
      await request.patch(`${API_BASE}/kds/items/${item.id}/status`, { data: { trangthai: 'da_xong' } });
    }

    // Chờ batching 11s
    await page.waitForTimeout(11000);

    const trayCard = page.locator('.tray-card'); // class gợi ý gom mâm
    await expect(trayCard).toBeVisible();
    await expect(trayCard).toContainText('Phở bò');
    await expect(trayCard).toContainText('Bàn 04, Bàn 05');

    // TC-US10-07: Lấy xong mâm
    await trayCard.getByRole('button', { name: 'Lấy xong' }).click();
    await expect(trayCard).not.toBeVisible();
  });

});
