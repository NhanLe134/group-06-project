/**
 * US-10: Smart Batching (Gom nhóm thông báo Waiter)
 * Full E2E Automation Suite
 */
import { test, expect } from '@playwright/test';

test.describe('US-10 — Smart Batching', () => {

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

  test('TC-US10-01: Gom âm thanh và popup trong vòng 10s', async ({ page }) => {
    // Bắn 3 event liên tiếp cho Bàn 01
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 01', item: 'Món 1', category: 'Đồ ăn' } } }));
      setTimeout(() => window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 01', item: 'Món 2', category: 'Đồ ăn' } } })), 2000);
      setTimeout(() => window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 01', item: 'Món 3', category: 'Đồ ăn' } } })), 5000);
    });

    // Chờ 11s để batching chạy xong
    await page.waitForTimeout(11000);
    const popups = await page.locator('.notif-card', { hasText: 'Bàn 01' }).count();
    
    // Gom thành 1 popup duy nhất
    expect(popups).toBe(1);
    await expect(page.locator('.notif-card', { hasText: 'Bàn 01' })).toContainText('3 món');
  });

  test('TC-US10-02: Tách thông báo nếu khoảng cách > 10s', async ({ page }) => {
    // Bắn 2 event cách nhau 12s
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 02', item: 'Món A', category: 'Đồ ăn' } } }));
    });
    // Chờ batching 10s của món A kết thúc
    await page.waitForTimeout(11000);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 02', item: 'Món B', category: 'Đồ ăn' } } }));
    });
    // Chờ batching 10s của món B kết thúc
    await page.waitForTimeout(11000);

    const popups = await page.locator('.notif-card', { hasText: 'Bàn 02' }).count();
    // Phải là 2 thẻ rời rạc
    expect(popups).toBeGreaterThanOrEqual(2);
  });

  test('TC-US10-03: Gợi ý gom mâm (CÙNG TÊN, CÙNG ZONE)', async ({ page }) => {
    // Trực tiếp móc vào hàm UI hoặc bắn event
    await page.evaluate(() => {
      // Giả lập Dữ liệu Bàn 01, Bàn 02 (Khu A) đều có Phở bò da_xong
      // Waiter.js sẽ auto scan danh sách.
      window.dispatchEvent(new CustomEvent('test-inject-tray', { 
        detail: { items: [{ table: 'Bàn 01', item: 'Phở bò', zone: 'Khu A' }, { table: 'Bàn 02', item: 'Phở bò', zone: 'Khu A' }] }
      }));
    });
    const trayCard = page.locator('.tray-card'); // class gợi ý gom mâm
    await expect(trayCard).toBeVisible();
    await expect(trayCard).toContainText('Phở bò');
    await expect(trayCard).toContainText('Bàn 01, Bàn 02');
  });

  test('TC-US10-04: KHÔNG gom mâm nếu KHÁC KHU VỰC', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-inject-tray', { 
        detail: { items: [{ table: 'Bàn 01', item: 'Phở bò', zone: 'Khu A' }, { table: 'Bàn 04', item: 'Phở bò', zone: 'Khu B' }] }
      }));
    });
    const trayCard = page.locator('.tray-card');
    await expect(trayCard).not.toBeVisible();
  });

  test('TC-US10-07: Bấm Lấy xong trên mâm gộp', async ({ page }) => {
    // Inject tray
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-inject-tray', { 
        detail: { items: [{ table: 'Bàn 01', item: 'Phở bò', zone: 'Khu A' }, { table: 'Bàn 02', item: 'Phở bò', zone: 'Khu A' }] }
      }));
    });
    await page.locator('.tray-card').getByRole('button', { name: 'Lấy xong' }).click();
    await expect(page.locator('.tray-card')).not.toBeVisible();
  });

});
