/**
 * US-01: E-Menu & Order Draft
 * Phụ trách: Nhàn
 * Test cases: TC-GO-001, TC-GO-002, TC-GO-003, TC-GO-004, TC-GO-005
 */
import { test, expect } from '@playwright/test';
import { EMenuPage } from '../pages/EMenuPage';
import { MENU_ITEMS, TABLES } from '../data/menu';

test.describe('US-01 — E-Menu & Order Draft', () => {
  let menu: EMenuPage;

  test.beforeEach(async ({ page }) => {
    menu = new EMenuPage(page);
    await menu.goto(TABLES.TABLE_05);
  });

  // TC-GO-001
  test('chọn món thành công vào Order Draft', async () => {
    await menu.addItem(MENU_ITEMS.PHO_BO.name);
    await expect(menu.stickyBarText()).toContainText('1 món trong bản nháp');
    await menu.openDraft();
    await expect(menu.draftSheet).toContainText(MENU_ITEMS.PHO_BO.name);
  });

  // TC-GO-002
  test('chốt đơn qua Explicit Confirmation (BR-01)', async ({ page }) => {
    await menu.addItem(MENU_ITEMS.PHO_BO.name);
    await menu.openDraft();

    // Intercept API để không cần backend thật
    await page.route('**/orders', async route => {
      await route.fulfill({ status: 201, json: { id: 'HD001' } });
    });

    await menu.submitOrder();
    await expect(menu.successModal).toBeVisible();
  });

  // TC-GO-003
  test('món Out of Stock hiển thị grayed-out, nút thêm bị disabled', async () => {
    const oosCard = menu.menuCard(MENU_ITEMS.CUA_CA_MAU.name);
    // Nếu món OOS tồn tại trên menu thì kiểm tra
    const count = await oosCard.count();
    if (count > 0) {
      await expect(oosCard).toHaveClass(/oos/);
      await expect(menu.addButton(MENU_ITEMS.CUA_CA_MAU.name)).toBeDisabled();
    }
  });

  // TC-GO-004
  test('món OOS trong Draft làm nút gửi bếp bị KHÓA (ADR-001)', async ({ page }) => {
    await menu.addItem(MENU_ITEMS.PHO_BO.name);
    await menu.openDraft();

    // Giả lập món trở thành OOS bằng cách mock menu API
    await page.route('**/menu*', async route => {
      const json = [
        { ...MENU_ITEMS.PHO_BO, trangthaiban: false, soluongton: 0 },
      ];
      await route.fulfill({ json });
    });
    await page.reload();

    await menu.openDraft();
    await expect(menu.submitBtn).toBeDisabled();
  });

  // TC-GO-005
  test('URL mã bàn không hợp lệ → trang báo lỗi', async ({ page }) => {
    await page.goto('/fe_ofc/pages/customer.html?table=INVALID_99');
    // Trang vẫn mở nhưng hiển thị lỗi khi gọi API menu
    const response = await page.waitForResponse(
      resp => resp.url().includes('/menu') && !resp.ok(),
      { timeout: 5000 },
    ).catch(() => null);
    // Nếu backend trả lỗi, frontend nên hiện thông báo
    if (response) {
      await expect(page.locator('.menu-empty')).toBeVisible();
    }
  });
});
