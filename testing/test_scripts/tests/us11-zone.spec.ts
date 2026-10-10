/**
 * US-11: Quản lý khu vực bàn (Zone Filtering)
 * Full E2E Automation Suite
 */
import { test, expect } from '@playwright/test';

test.describe('US-11 — Quản lý khu vực bàn', () => {

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

  test('TC-US11-01: Mặc định hiển thị Tất cả khu vực', async ({ page }) => {
    const filterSelect = page.locator('#zone-filter');
    await expect(filterSelect).toHaveValue('all');
    
    // Bàn 01 (Khu A) và Bàn 06 (Khu B) đều phải hiện
    await expect(page.locator('.table-item', { hasText: 'Bàn 01' })).toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 06' })).toBeVisible();
  });

  test('TC-US11-02: Lọc Khu A sẽ ẩn các Bàn thuộc Khu B', async ({ page }) => {
    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu A');
    
    await expect(page.locator('.table-item', { hasText: 'Bàn 01' })).toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 02' })).toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 03' })).toBeVisible();
    
    // Bàn 04, 05, 06 phải bị ẩn
    await expect(page.locator('.table-item', { hasText: 'Bàn 04' })).not.toBeVisible();
    await expect(page.locator('.table-item', { hasText: 'Bàn 06' })).not.toBeVisible();
  });

  test('TC-US11-03: Chặn thông báo của Khu vực không thuộc ca trực', async ({ page }) => {
    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu A');
    
    // Bắn event KDS của Bàn 04 (Khu B)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'ITEM_READY', data: { table: 'Bàn 04', item: 'Gà nướng', category: 'Đồ ăn', zone: 'Khu B' } } }));
    });

    // Chờ 11s để đảm bảo batching chạy xong
    await page.waitForTimeout(11000);

    // Không được có popup nào của Bàn 04
    await expect(page.locator('.notif-card', { hasText: 'Bàn 04' })).not.toBeVisible();
  });

  test('TC-US11-04: Đổi khu vực qua lại không làm mất trạng thái bàn', async ({ page }) => {
    // 1. Cho Bàn 01 đỏ lên (có khách)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: { type: 'TABLE_OCCUPIED', data: { table: 'Bàn 01' } } }));
    });
    
    const filterSelect = page.locator('#zone-filter');
    await filterSelect.selectOption('Khu B');
    await expect(page.locator('.table-item', { hasText: 'Bàn 01' })).not.toBeVisible();
    
    // Đổi lại Khu A
    await filterSelect.selectOption('Khu A');
    const table1 = page.locator('.table-item', { hasText: 'Bàn 01' });
    await expect(table1).toBeVisible();
    await expect(table1).toHaveClass(/occupied|red/); // Vẫn phải giữ trạng thái có khách
  });

});
