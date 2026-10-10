/**
 * US-11: Quản lý khu vực bàn (Zone Filtering)
 * Full E2E Automation Suite with REAL API INJECTION
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('US-11 — Quản lý khu vực bàn', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.getByRole('button', { name: 'Phục vụ' }).click();
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL('**/waiter.html');
  });

  test('TC-US11-01: Mặc định hiển thị Tất cả khu vực', async ({ page }) => {
    const filterSelect = page.locator('#zone-filter');
    await expect(filterSelect).toHaveValue('all');
    
    // Bàn 03 (Khu A) và Bàn 06 (Khu B) đều phải hiện
    await expect(page.locator('.table-item', { hasText: 'Bàn 03' })).toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 06' })).toBeVisible();
  });

  test('TC-US11-02: Lọc Khu A sẽ ẩn các Bàn thuộc Khu B', async ({ page }) => {
    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu A');
    
    await expect(page.locator('.table-item', { hasText: 'Bàn 03' })).toBeVisible();
    
    // Bàn 04, 05, 06 (Khu B) phải bị ẩn
    await expect(page.locator('.table-item', { hasText: 'Bàn 04' })).not.toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 06' })).not.toBeVisible();
  });

  test('TC-US11-03: Chặn thông báo của Khu vực không thuộc ca trực', async ({ page, request }) => {
    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu A'); // Waiter chỉ nhận order Khu A
    
    // Bắn API gửi 1 món cho Bàn 04 (Khu B)
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    const phoBo = menu.find((m: any) => m.name.includes('Phở bò'));

    await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 04', items: [{ thucdon_id: phoBo.id, soluong: 1 }] }
    });

    const kdsRes = await request.get(`${API_BASE}/kds/items`);
    const kdsItems = await kdsRes.json();
    const myItem = kdsItems.find((i: any) => i.ban === 'Bàn 04' && i.tenmon === phoBo.name);

    // KDS báo xong
    await request.patch(`${API_BASE}/kds/items/${myItem.id}/status`, { data: { trangthai: 'da_xong' } });

    // Chờ 11s để đảm bảo batching chạy xong
    await page.waitForTimeout(11000);

    // Không được có popup nào của Bàn 04 hiện lên vì đang filter Khu A
    await expect(page.locator('.notif-card', { hasText: 'Bàn 04' })).not.toBeVisible();
  });

  test('TC-US11-04: Đổi khu vực qua lại không làm mất trạng thái bàn', async ({ page, request }) => {
    // 1. Dùng API tạo order cho Bàn 03 (để bàn đổi sang màu Đỏ - đang dùng bữa)
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 03', items: [{ thucdon_id: menu[0].id, soluong: 1 }] }
    });
    
    // Check bàn 03 hiện màu đỏ
    const table3 = page.locator('.table-item', { hasText: 'Bàn 03' });
    await expect(table3).toHaveClass(/occupied/); // class màu đỏ trong code

    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu B');
    await expect(table3).not.toBeVisible();
    
    // Đổi lại Khu A
    await filterSelect.selectOption('Khu A');
    await expect(table3).toBeVisible();
    await expect(table3).toHaveClass(/occupied/); // Vẫn phải giữ trạng thái có khách
  });

});
