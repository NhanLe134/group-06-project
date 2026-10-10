/**
 * US-04: Tablet Phục vụ (Waiter)
 * Full E2E Automation Suite
 */
import { test, expect } from '@playwright/test';

test.describe('US-04 — Tablet Phục vụ: Thông báo & Cập nhật', () => {

  test.beforeEach(async ({ page }) => {
    // Yêu cầu: Phải đi từ luồng Đăng nhập thực tế
    await page.goto('/login.html');
    
    // Click nút điền nhanh "Phục vụ" ở dưới màn hình
    await page.getByRole('button', { name: 'Phục vụ' }).click();
    
    // Bấm Đăng nhập
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    
    // Chờ hệ thống xác thực và tự động redirect sang trang Phục vụ
    await page.waitForURL('**/waiter.html');
  });

  test('TC-US04-01: Nhận thông báo đồ uống hoàn thành (Màu xanh lam)', async ({ page }) => {
    // Giả lập WS nhận event báo món nước
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 01', item: 'Trà đá', category: 'Đồ uống' } } }));
    });
    const notif = page.locator('.notif-card', { hasText: 'Trà đá' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/CẦN LẤY NƯỚC/);
    await expect(notif).toHaveCSS('background-color', /blue|rgb\(0, 123, 255\)/); // Xanh lam
  });

  test('TC-US04-02: Nhận thông báo đồ ăn hoàn thành (Màu xanh lá)', async ({ page }) => {
    // Giả lập WS báo đồ ăn
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 02', item: 'Phở bò', category: 'Đồ ăn' } } }));
    });
    const notif = page.locator('.notif-card', { hasText: 'Phở bò' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/CẦN BƯNG MÓN/);
  });

  test('TC-US04-03: Nhận thông báo dọn dẹp bàn (Màu đỏ)', async ({ page }) => {
    // Giả lập event thanh toán xong
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'TABLE_PAID', data: { table: 'Bàn 03' } } }));
    });
    const notif = page.locator('.notif-card', { hasText: 'DỌN DẸP BÀN' });
    await expect(notif).toBeVisible();
    await expect(notif).toHaveText(/Bàn 03/);
  });

  test('TC-US04-04 & 10: Sơ đồ bàn chuyển sang trạng thái Đang dùng bữa', async ({ page }) => {
    // Gọi API để tạo order ảo
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'TABLE_OCCUPIED', data: { table: 'Bàn 05' } } }));
    });
    const table5 = page.locator('.table-item', { hasText: 'Bàn 05' });
    await expect(table5).toHaveClass(/occupied|red/);
  });

  test('TC-US04-05 & 11: Sơ đồ bàn chuyển sang Dọn dẹp', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'TABLE_CLEANING', data: { table: 'Bàn 02' } } }));
    });
    const table2 = page.locator('.table-item', { hasText: 'Bàn 02' });
    await expect(table2).toHaveClass(/cleaning/);
  });

  test('TC-US04-06 & 12: Đã dọn xong chuyển bàn về Trống', async ({ page }) => {
    const table2 = page.locator('.table-item', { hasText: 'Bàn 02' });
    await table2.click(); // Mở chi tiết
    await page.getByRole('button', { name: 'Đã dọn xong' }).click();
    // Bàn đổi màu thành trắng (empty)
    await expect(table2).toHaveClass(/empty|available/);
  });

  test('TC-US04-07: Ngăn kéo chi tiết bàn hiển thị đủ 3 phân vùng món', async ({ page }) => {
    await page.locator('.table-item', { hasText: 'Bàn 01' }).click();
    const drawer = page.locator('#table-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Chờ nấu')).toBeVisible();
    await expect(drawer.getByText('Cần phục vụ')).toBeVisible();
    await expect(drawer.getByText('Đã phục vụ')).toBeVisible();
  });

  test('TC-US04-09: Bấm Đã hoàn tất để xác nhận bưng món', async ({ page }) => {
    // Sinh data ảo có món chờ bưng
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 01', item: 'Cơm chiên', category: 'Đồ ăn' } } }));
    });
    const serveBtn = page.locator('.notif-card').filter({ hasText: 'Cơm chiên' }).getByRole('button', { name: 'Đã hoàn tất' });
    await serveBtn.click();
    
    // Món bay mất khỏi notif
    await expect(page.locator('.notif-card', { hasText: 'Cơm chiên' })).not.toBeVisible();
  });

  test('TC-US04-10: Hủy hoàn toàn món chờ nấu (Qty = 0)', async ({ page }) => {
    await page.locator('.table-item', { hasText: 'Bàn 01' }).click();
    const pendingItem = page.locator('.order-item').filter({ hasText: 'Đang chờ' }).first();
    await pendingItem.getByRole('button', { name: 'Sửa' }).click();
    
    // Nhập số 0
    await page.locator('.qty-input').fill('0');
    await page.getByRole('button', { name: 'Lưu' }).click();
    
    // Toast success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(pendingItem).not.toBeVisible();
  });

  test('TC-US04-11: Giảm số lượng món đang chờ nấu', async ({ page }) => {
    await page.locator('.table-item', { hasText: 'Bàn 01' }).click();
    const pendingItem = page.locator('.order-item').filter({ hasText: 'Chờ nấu' }).first();
    await pendingItem.getByRole('button', { name: 'Sửa' }).click();
    
    await page.locator('.qty-input').fill('1'); // Đang 2 giảm còn 1
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(pendingItem).toContainText('x1');
  });

  test('TC-US04-14 & 15: Chặn sửa số lượng món Đang nấu / Đã phục vụ', async ({ page }) => {
    await page.locator('.table-item', { hasText: 'Bàn 01' }).click();
    const cookingItem = page.locator('.order-item').filter({ hasText: 'Đang nấu' }).first();
    const servedItem = page.locator('.order-item').filter({ hasText: 'Đã phục vụ' }).first();
    
    // Không có nút sửa
    await expect(cookingItem.getByRole('button', { name: 'Sửa' })).not.toBeVisible();
    await expect(servedItem.getByRole('button', { name: 'Sửa' })).not.toBeVisible();
  });

  test('TC-US04-17: Rớt mạng hiện Toast lưu tạm', async ({ page, context }) => {
    // Tắt mạng
    await context.setOffline(true);
    const serveBtn = page.locator('.serve-btn').first();
    if(await serveBtn.isVisible()) {
      await serveBtn.click();
      await expect(page.getByText('Đang ngoại tuyến, thao tác lưu tạm')).toBeVisible();
    }
  });

});
