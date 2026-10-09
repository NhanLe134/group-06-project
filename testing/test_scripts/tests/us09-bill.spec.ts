/**
 * US-09: Khách xem Hóa đơn tạm tính — E2E (file mới — trước đây US-09 chưa có spec)
 * Phụ trách: Nhàn
 * Test cases: testing/test_cases/test-cases-US09.md
 *   TC-US09-001 (AC1 mở hóa đơn), TC-US09-007 (AC6 nhóm đợt gọi — ADR-N13),
 *   TC-US09-003 (AC2 khóa nút khi còn món), TC-US09-004 (AC3 đủ phục vụ → ra quầy).
 * Chạy: npx playwright test -c playwright.us010509.config.ts
 */
import { KDS_DISHES as D, KDS_TABLES as T } from '../data/kds';
import { API, expect, menuId, test } from '../utils/localApi';

test.skip(!process.env.E2E_API_URL, 'Chạy bằng playwright.us010509.config.ts (backend E2E riêng)');

async function sendRound(request: import('@playwright/test').APIRequestContext, table: string, dish: string, qty = 1) {
  const res = await request.post(`${API}/orders`, {
    data: { table_name: table, items: [{ thucdon_id: await menuId(request, dish), soluong: qty }] },
  });
  expect(res.ok()).toBeTruthy();
}

async function serveAllItems(request: import('@playwright/test').APIRequestContext, table: string) {
  const current = await request.get(`${API}/orders/current?table_name=${encodeURIComponent(table)}`);
  const bill = await current.json();
  for (const it of bill.items as { id: string; trangthai: string }[]) {
    if (it.trangthai !== 'da_xong' && it.trangthai !== 'da_phuc_vu') {
      const done = await request.patch(`${API}/kds/items/${it.id}/status`, { data: { trangthai: 'da_xong' } });
      expect(done.ok()).toBeTruthy();
    }
    if (it.trangthai !== 'da_phuc_vu') {
      const served = await request.patch(`${API}/waiter/items/${it.id}/serve`);
      expect(served.ok()).toBeTruthy();
    }
  }
}

test.describe('US-09 — Hóa đơn tạm tính', () => {
  test('TC-US09-001 + 007 (AC1/AC6): 2 đợt gọi → 2 nhóm "Đợt N", nút thanh toán khóa khi còn món', async ({ page, request }) => {
    const TABLE = T.BATCH_A; // Bàn E2E-02A
    // 2 đợt gọi cách nhau > 1 giây để khác mốc giogoimon (ADR-N13: cùng giây = chung đợt)
    await sendRound(request, TABLE, D.PHO_BO, 2);
    await page.waitForTimeout(1_100);
    await sendRound(request, TABLE, D.TRA_DA, 1);

    await page.goto(`/pages/customer.html?table=${encodeURIComponent(TABLE)}`);
    await page.locator('#btn-view-bill').waitFor({ timeout: 15_000 });
    await page.locator('#btn-view-bill').click();

    const billBody = page.locator('#bill-body');
    await expect(billBody).toContainText(D.PHO_BO, { timeout: 15_000 });
    // AC6: tiêu đề nhóm đợt
    await expect(billBody).toContainText('Đợt 1');
    await expect(billBody).toContainText('Đợt 2');
    // AC2: còn món chưa phục vụ → nút khóa sẵn + hộp cảnh báo vàng
    await expect(page.locator('#btn-request-pay')).toBeDisabled();
    await expect(page.locator('#bill-body .adr-warn')).toBeVisible();
  });

  test('TC-US09-004 (AC3): phục vụ đủ → nút mở khóa, bấm → hướng dẫn ra quầy', async ({ page, request }) => {
    const TABLE = T.BATCH_B; // Bàn E2E-02B
    await sendRound(request, TABLE, D.PHO_BO, 1);
    await serveAllItems(request, TABLE);

    await page.goto(`/pages/customer.html?table=${encodeURIComponent(TABLE)}`);
    await page.locator('#btn-view-bill').waitFor({ timeout: 15_000 });
    await page.locator('#btn-view-bill').click();
    await expect(page.locator('#bill-body')).toContainText(D.PHO_BO, { timeout: 15_000 });

    await expect(page.locator('#btn-request-pay')).toBeEnabled();
    await page.locator('#btn-request-pay').click();
    await expect(page.locator('#pay-modal')).toBeVisible();
    await expect(page.locator('#pay-modal')).toContainText('Vui lòng đến quầy thu ngân để thanh toán');
  });

  test('TC-US09-006 (AC5): bàn chưa có đơn → hóa đơn rỗng, nút Disabled', async ({ page }) => {
    await page.goto(`/pages/customer.html?table=${encodeURIComponent(T.OFFLINE)}`);
    await page.locator('#btn-view-bill').waitFor({ timeout: 15_000 });
    await page.locator('#btn-view-bill').click();
    await expect(page.locator('#bill-body')).toContainText('chưa gọi món', { timeout: 15_000 });
    await expect(page.locator('#btn-request-pay')).toBeDisabled();
  });
});
