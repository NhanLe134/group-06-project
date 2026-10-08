/**
 * US-08: Kiểm kê tồn kho & Đóng ca — E2E
 * Phụ trách: Nhã
 * Test cases: testing/test_cases/test-cases-US08.md
 *   TC-MA-004 (AC1–AC3), TC-MA-INV-002 (AC4 thiếu lý do), TC-MA-INV-003 (AC5 PIN), TC-MA-005 (số âm).
 * API thật: /inventory/shifts (vault/06-Engineering/api-contract.md Mục 7).
 *
 * Chạy: npx playwright test -c playwright.us03.config.ts   (backend E2E riêng, KHÔNG đụng Supabase)
 */
import { E2E_PINS, KDS_DISHES as D } from '../data/kds';
import { API, expect, test } from '../utils/localApi';

test.skip(!process.env.E2E_API_URL, 'Chạy bằng playwright.us03.config.ts (backend E2E riêng)');

const LOSS_MSG = 'Vui lòng nhập lý do hao hụt trước khi chốt ca';

test.describe('US-08 — Kiểm kê tồn kho & Đóng ca', () => {
  test('TC-MA-004 + TC-MA-INV-002/003: hao hụt bắt buộc lý do, PIN Quản lý, chốt ca khóa phiếu',
    async ({ page, request }) => {
      await page.goto('/pages/manager.html');
      await page.locator('[data-tab="tab-inventory"]').click();
      await page.locator('#inv-create-btn').click();

      // AC1: phiếu gồm các món mua sẵn, hiện A (đầu ca), B (đã bán), C (lý thuyết)
      const rows = page.locator('#inv-lines-table tbody tr[data-dish]');
      await expect(rows).toHaveCount(2);
      const tra = rows.filter({ hasText: D.TRA_DA });
      const coca = rows.filter({ hasText: D.COCA });
      const cTra = Number(await tra.getAttribute('data-c'));
      await coca.locator('.inv-input').fill(String(await coca.getAttribute('data-c')));

      // AC2: nhập thiếu 1 → dòng tô màu hao hụt
      await tra.locator('.inv-input').fill(String(cTra - 1));
      await expect(tra).toHaveClass(/inv-row-loss/);

      // AC4: bỏ trống lý do → lỗi đỏ ngay dòng đó, KHÔNG gọi API chốt ca
      const closeCalls: string[] = [];
      page.on('request', r => { if (r.url().includes('/close')) closeCalls.push(r.url()); });
      const closeBtn = page.locator('#inv-detail-actions button', { hasText: 'Đóng ca' });
      await closeBtn.click();
      await expect(tra.locator('.inv-field-error')).toHaveText(LOSS_MSG);
      await expect(page.locator('#inv-pin-modal')).toBeHidden();
      expect(closeCalls).toHaveLength(0);

      // AC5: có lý do → hỏi PIN Quản lý; PIN Thu ngân bị từ chối
      await tra.locator('.inv-reason').fill('Vỡ 1 chai');
      await closeBtn.click();
      await expect(page.locator('#inv-pin-modal')).toBeVisible();
      await expect(page.locator('#inv-pin-modal')).toContainText('Cần quyền Quản lý');
      await page.locator('#inv-pin-input').fill(E2E_PINS.CASHIER);
      await page.locator('#inv-pin-submit').click();
      await expect(page.locator('#inv-pin-error')).not.toBeEmpty();

      // AC3: PIN đúng → phiếu chốt, chỉ xem; tồn thực tế thành tồn đầu ca sau
      await page.locator('#inv-pin-input').fill(E2E_PINS.MANAGER);
      await page.locator('#inv-pin-submit').click();
      await expect(page.locator('#inv-pin-modal')).toBeHidden();
      await expect(page.locator('#inv-lines-table .inv-input')).toHaveCount(0);

      const [shift] = await (await request.get(`${API}/inventory/shifts`)).json();
      expect([shift.trangthai, shift.nguoichot]).toEqual(['da_chot', 'Quản lý E2E']);
      const menu = await (await request.get(`${API}/menu`)).json();
      expect(menu.find((m: { name: string }) => m.name === D.TRA_DA).stock).toBe(cTra - 1);
    });

  test('TC-MA-005: nhập tồn thực tế âm → báo lỗi, không cho chốt ca', async ({ page }) => {
    await page.goto('/pages/manager.html');
    await page.locator('[data-tab="tab-inventory"]').click();
    await page.locator('#inv-create-btn').click();
    const row = page.locator('#inv-lines-table tbody tr[data-dish]').first();

    await row.locator('.inv-input').fill('-5');
    await page.locator('#inv-detail-actions button', { hasText: 'Đóng ca' }).click();

    await expect(row.locator('.inv-field-error')).toHaveText('Tồn thực tế phải là số nguyên ≥ 0');
    await expect(page.locator('#inv-pin-modal')).toBeHidden();
  });
});
