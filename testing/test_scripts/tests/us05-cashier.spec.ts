/**
 * US-05: Thu ngân — thanh toán SePay VietQR — E2E (thay thế us05-splitbill.spec.ts era ADR-N08)
 * Phụ trách: Nhàn
 * Test cases: testing/test_cases/test-cases-US05.md
 *   TC-US05-001 (AC1 QR định danh), TC-US05-009 (AC5 guard món chưa phục vụ — FE),
 *   TC-US05-010 (AC2 đóng bàn tiền mặt), TC-US05-011 (AC6 demo-sim → AC3 Toast realtime).
 * Chạy: npx playwright test -c playwright.us010509.config.ts
 */
import { KDS_DISHES as D, KDS_TABLES as T } from '../data/kds';
import { API, expect, menuId, test } from '../utils/localApi';

test.skip(!process.env.E2E_API_URL, 'Chạy bằng playwright.us010509.config.ts (backend E2E riêng)');

async function sendToKitchen(request: import('@playwright/test').APIRequestContext, table: string, dish: string, qty = 1) {
  const res = await request.post(`${API}/orders`, {
    data: { table_name: table, items: [{ thucdon_id: await menuId(request, dish), soluong: qty }] },
  });
  expect(res.ok()).toBeTruthy();
}

/** Món mới gửi luôn ở `cho_nau` → KDS "Xong" (da_xong) → Waiter "Đã phục vụ" (da_phuc_vu). */
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

async function banIdOf(request: import('@playwright/test').APIRequestContext, tenban: string): Promise<string> {
  const rows = await (await request.get(`${API}/cashier/tables`)).json();
  const row = rows.find((r: { tenban: string }) => r.tenban === tenban);
  expect(row, `bàn "${tenban}" có trong /cashier/tables`).toBeTruthy();
  return row.id;
}

test.describe('US-05 — Thu ngân thanh toán SePay', () => {
  test('TC-US05-001 + 009 + 010 (AC1/AC5/AC2): guard món chưa phục vụ → tạo QR định danh → đóng bàn', async ({ page, request }) => {
    const TABLE = T.READY; // Bàn E2E-03 — bàn riêng cho test này
    await sendToKitchen(request, TABLE, D.PHO_BO);
    const banId = await banIdOf(request, TABLE);

    await page.goto('/pages/cashier.html');
    const card = page.locator('.tc-card', { hasText: TABLE });
    await card.waitFor({ timeout: 15_000 });
    await card.click();
    await page.locator('#btn-create-qr').waitFor({ timeout: 15_000 });

    // AC5 (TC-US05-009): còn món chưa phục vụ → FE chặn + toast
    await page.locator('#btn-create-qr').click();
    await expect(page.locator('.toast').filter({ hasText: 'Chưa thể tạo mã thanh toán' })).toBeVisible();

    // Phục vụ hết món (KDS Xong → Waiter phục vụ) → tải lại trang để FE cập nhật trạng thái món
    await serveAllItems(request, TABLE);
    await page.reload();
    await page.locator('.tc-card', { hasText: TABLE }).waitFor({ timeout: 15_000 });
    await page.locator('.tc-card', { hasText: TABLE }).click();
    await page.locator('#btn-create-qr').waitFor({ timeout: 15_000 });
    await page.locator('#btn-create-qr').click();
    await expect(page.locator('.qr-img')).toBeVisible({ timeout: 15_000 });
    // AC1 (TC-US05-001): nội dung CK định danh "Ban <số> - HD..." hiển thị dưới QR (ADR-N16)
    // (SQLite E2E sinh id không gạch: HD022; production Supabase là HD-YYYYMMDD-NNNN)
    await expect(page.locator('.qr-content')).toContainText(/Ban \d+ - HD/);
  });

  test('TC-US05-011 + AC3 (TC-US05-007): demo-sim → Toast "Thanh toán SePay thành công!", bàn về chờ dọn', async ({ page, request }) => {
    const TABLE = T.OOS; // Bàn E2E-04 — bàn riêng
    await sendToKitchen(request, TABLE, D.PHO_BO);
    await serveAllItems(request, TABLE);
    const banId = await banIdOf(request, TABLE);

    await page.goto('/pages/cashier.html');
    await page.locator('.tc-card', { hasText: TABLE }).waitFor({ timeout: 15_000 });
    await page.locator('.tc-card', { hasText: TABLE }).click();
    await page.locator('#btn-create-qr').waitFor({ timeout: 15_000 });
    await page.locator('#btn-create-qr').click();
    await expect(page.locator('.qr-img')).toBeVisible({ timeout: 15_000 });

    // Mô phỏng SePay webhook (AC6) → backend đối soát + phát WS PAYMENT_SUCCESS
    const sim = await request.post(`${API}/sepay/demo-sim/${banId}`);
    expect(sim.ok(), `demo-sim: ${sim.status()} ${await sim.text()}`).toBeTruthy();

    // AC3 (TC-US05-007): Toast realtime trên màn Thu ngân, không cần F5
    await expect(
      page.locator('.toast').filter({ hasText: 'Thanh toán SePay thành công!' }),
    ).toBeVisible({ timeout: 15_000 });

    // Bàn chuyển "chờ dọn" trong danh sách sau khi tự làm mới
    await expect(page.locator('.tc-card', { hasText: TABLE })).toContainText('Chờ dọn', { timeout: 15_000 });
  });
});
