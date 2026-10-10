/**
 * US-04: Tablet Phục vụ (Waiter)
 * Full E2E Automation Suite with REAL API INJECTION
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('US-04 — Tablet Phục vụ: Thông báo & Cập nhật', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.getByRole('button', { name: 'Phục vụ' }).click();
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL('**/waiter.html');
  });

  test('TC-US04-01: Nhận thông báo đồ uống hoàn thành (Màu xanh lam)', async ({ page, request }) => {
    // 1. Lấy UUID món Trà đá (Đồ uống tự động nấu xong)
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    const traDa = menu.find((m: any) => m.name.includes('Trà đá'));
    
    // 2. Bơm data order qua API thật
    await request.post(`${API_BASE}/orders`, {
      data: {
        table_name: 'Bàn 04',
        items: [{ thucdon_id: traDa.id, soluong: 1 }]
      }
    });

    // 3. Backend nảy WebSockets thật, Waiter phải bắt được
    const notif = page.locator('.notif-card', { hasText: 'Trà đá' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/CẦN LẤY NƯỚC/);
    await expect(notif).toHaveCSS('background-color', /blue|rgb\(0, 123, 255\)/);
  });

  test('TC-US04-02: Nhận thông báo đồ ăn hoàn thành (Màu xanh lá)', async ({ page, request }) => {
    // Lấy UUID Phở bò
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    const phoBo = menu.find((m: any) => m.name.includes('Phở bò'));

    // Gọi món Phở bò
    const orderRes = await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 05', items: [{ thucdon_id: phoBo.id, soluong: 1 }] }
    });
    
    // Tìm item_id của món vừa gọi trong KDS
    const kdsRes = await request.get(`${API_BASE}/kds/items`);
    const kdsItems = await kdsRes.json();
    const myItem = kdsItems.find((i: any) => i.ban === 'Bàn 05' && i.tenmon === phoBo.name);

    // KDS API: Cập nhật món -> da_xong
    await request.patch(`${API_BASE}/kds/items/${myItem.id}/status`, {
      data: { trangthai: 'da_xong' }
    });

    // Chờ popup màu xanh lá nhảy lên
    const notif = page.locator('.notif-card', { hasText: 'Phở bò' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/CẦN BƯNG MÓN/);
  });

  test('TC-US04-03: Nhận thông báo dọn dẹp bàn (Màu đỏ)', async ({ page, request }) => {
    // Tạo 1 order cho Bàn 06 để có bill
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 06', items: [{ thucdon_id: menu[0].id, soluong: 1 }] }
    });

    // Bấm thanh toán (Thu ngân API)
    // Đầu tiên cần phải có bill để trả tiền, api close table
    const kdsRes = await request.get(`${API_BASE}/kds/items`);
    const kdsItems = await kdsRes.json();
    const myItem = kdsItems.find((i: any) => i.ban === 'Bàn 06');
    // Phải xong -> phục vụ xong mới đc thanh toán
    await request.patch(`${API_BASE}/kds/items/${myItem.id}/status`, { data: { trangthai: 'da_xong' } });
    await page.locator('.notif-card', { hasText: 'Bàn 06' }).getByRole('button', { name: 'Đã hoàn tất' }).click();

    // Thu ngân chốt thanh toán
    // /tables/{ban_id}/close
    const tablesRes = await request.get(`${API_BASE}/cashier/tables`);
    const tables = await tablesRes.json();
    const table6 = tables.find((t: any) => t.tenban === 'Bàn 06');
    await request.post(`${API_BASE}/tables/${table6.id}/close`);

    const notif = page.locator('.notif-card', { hasText: 'DỌN DẸP BÀN' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/Bàn 06/);
  });

  test('TC-US04-10: Hủy hoàn toàn món chờ nấu (Qty = 0)', async ({ page, request }) => {
    const menuRes = await request.get(`${API_BASE}/api/menu`);
    const menu = await menuRes.json();
    await request.post(`${API_BASE}/orders`, {
      data: { table_name: 'Bàn 04', items: [{ thucdon_id: menu[0].id, soluong: 1 }] }
    });

    await page.locator('.table-item', { hasText: 'Bàn 04' }).click();
    const pendingItem = page.locator('.order-item').filter({ hasText: 'Đang chờ' }).first();
    await pendingItem.getByRole('button', { name: 'Sửa' }).click();
    
    // Nhập số 0
    await page.locator('.qty-input').fill('0');
    await page.getByRole('button', { name: 'Lưu' }).click();
    
    // Toast success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(pendingItem).not.toBeVisible();
  });

  test('TC-US04-17: Rớt mạng hiện Toast lưu tạm', async ({ page, context }) => {
    // Tắt mạng
    await context.setOffline(true);
    const serveBtn = page.locator('.serve-btn').first();
    // Tạo 1 thẻ ảo để có nút bấm
    await page.evaluate(() => {
      document.body.innerHTML += `<button class="serve-btn">Đã hoàn tất</button>`;
    });
    
    await page.locator('.serve-btn').first().click();
    await expect(page.getByText('Đang ngoại tuyến')).toBeVisible();
  });

});
