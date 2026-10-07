/**
 * US-03: KDS Bếp — E2E (tầng E2E của testing pyramid, giáo trình §11.2)
 * Phụ trách: Nhã
 * Test cases: testing/test_cases/test-cases-US03.md
 *   TC-OP-001, TC-OP-KDS-013 (AC1 realtime + độ trễ), TC-OP-KDS-001 (AC1 AI gom mẻ),
 *   TC-OP-KDS-004 (AC2 + màn Phục vụ), TC-OP-003 (AC3 báo hết), TC-OP-KDS-010 (AC3 hết nguyên liệu),
 *   TC-OP-004 (AC5 offline), TC-OP-KDS-011 (AC4 — chờ JWT), TC-OP-002 (chưa làm).
 * TC-OP-005 (tranh chấp suất cuối) cần Postgres thật → backend/tests/pg/test_race_last_portion.py.
 *
 * Chạy: npx playwright test -c playwright.us03.config.ts   (backend E2E riêng, KHÔNG đụng Supabase)
 */
import { KdsPage } from '../pages/KdsPage';
import { API, expect, kdsItem, openPage, sendToKitchen, test } from '../utils/localApi';

test.skip(!process.env.E2E_API_URL, 'Chạy bằng playwright.us03.config.ts (backend E2E riêng)');

test.describe('US-03 — KDS Bếp', () => {
  let kds: KdsPage;

  test.beforeEach(async ({ page }) => {
    kds = new KdsPage(page);
    await kds.goto();
    await expect(kds.connection).toContainText('Realtime');
  });

  test('TC-OP-001 + TC-OP-KDS-013 (AC1): đơn mới hiện ngay trên KDS, không F5, có báo "Đơn mới"',
    async ({ page, request }, testInfo) => {
      expect((await sendToKitchen(request, 'Bàn E2E-01', 'Bánh flan')).ok()).toBeTruthy();
      const sent = Date.now();

      await expect(kds.column('PENDING').getByText('Bàn E2E-01')).toBeVisible({ timeout: 3_000 });
      const ms = Date.now() - sent;
      testInfo.annotations.push({ type: 'latency_ms (NFR-RO-01 < 500 ms)', description: String(ms) });
      expect(ms).toBeLessThan(1_000);
      await expect(page.locator('.toast').filter({ hasText: 'Đơn mới — Bàn E2E-01' })).toBeVisible();
    });

  test('TC-OP-KDS-001 (AC1): 2 bàn cùng gọi Phở → mẻ "3× Phở bò" nhãn "Gợi ý nấu chung", đứng đầu cột',
    async ({ request }) => {
      await sendToKitchen(request, 'Bàn E2E-02A', 'Phở bò', 2);
      await sendToKitchen(request, 'Bàn E2E-02B', 'Phở bò', 1);

      const batch = kds.batch('Phở bò');
      await expect(batch).toContainText('Gợi ý nấu chung');
      await expect(batch).toContainText('3×');
      await expect(batch).toContainText('Bàn E2E-02A');
      await expect(batch).toContainText('Bàn E2E-02B');
      await expect(kds.column('PENDING').locator('section.batch, article.kcard').first())
        .toContainText('Phở bò');
    });

  test('TC-OP-KDS-004 (AC2): bấm "Xong" → DB đổi da_xong, màn Phục vụ nhận thông báo món xong',
    async ({ page, request }) => {
      const waiter = await openPage(page, '/pages/waiter.html');
      await waiter.waitForTimeout(1_000); // chờ WebSocket của trang Phục vụ kết nối
      await sendToKitchen(request, 'Bàn E2E-03', 'Gỏi cuốn');
      const card = kds.card('Bàn E2E-03');
      await expect(card).toBeVisible();

      await card.getByRole('button', { name: 'Xong' }).click();

      await expect(kds.column('READY').getByText('Bàn E2E-03')).toBeVisible();
      await expect.poll(async () => (await kdsItem(request, 'Bàn E2E-03', 'Gỏi cuốn'))?.trangthai)
        .toBe('da_xong');
      await expect(waiter.locator('.notif-card').filter({ hasText: 'Bàn E2E-03' }))
        .toContainText('Gỏi cuốn');
    });

  test('TC-OP-003 (AC3): Bếp báo hết "Salad cá ngừ" → E-Menu của khách gỡ món < 1 s, không F5',
    async ({ page, request }, testInfo) => {
      const emenu = await openPage(page, '/pages/customer.html?table=Bàn E2E-04');
      const salad = emenu.locator('.menu-card').filter({ hasText: 'Salad cá ngừ' });
      await expect(salad).toBeVisible();
      await emenu.waitForTimeout(1_000); // chờ WebSocket của E-Menu kết nối

      await kds.markOutOfStock('Salad cá ngừ');
      const clicked = Date.now();

      // ADR-N11 (US-01): món bếp báo hết (trangthaiban = false) bị ẩn khỏi E-Menu
      await expect(salad).toHaveCount(0, { timeout: 3_000 });
      testInfo.annotations.push({ type: 'oos_sync_ms (REQ-09 < 1 s)', description: String(Date.now() - clicked) });
      expect(Date.now() - clicked).toBeLessThan(1_000);
      await expect(kds.stockRow('Salad cá ngừ')).toContainText('Hết hàng');

      const id = (await (await request.get(`${API}/menu`)).json())
        .find((m: { name: string }) => m.name === 'Salad cá ngừ').id;
      await request.post(`${API}/menu/items/${id}/in-stock`); // trả dữ liệu về như cũ
    });

  test('TC-OP-KDS-010 (AC3 tự động): hết nguyên liệu → E-Menu xám "Hết hàng", món đã gửi vẫn nấu được',
    async ({ page, request }) => {
      const ingredients = await (await request.get(`${API}/inventory/ingredients`)).json();
      const bo = ingredients.find((i: { name: string }) => i.name === 'Thịt bò');
      await request.put(`${API}/inventory/ingredients/${bo.id}`, { data: { stock: 0.3 } });
      const emenu = await openPage(page, '/pages/customer.html?table=Bàn E2E-05');
      await expect(emenu.locator('.menu-card').filter({ hasText: 'Phở bò' })).toBeVisible();
      await emenu.waitForTimeout(1_000);

      await sendToKitchen(request, 'Bàn E2E-05', 'Phở bò'); // còn 0.1 kg < 0.2 kg/phần

      await expect(emenu.locator('.menu-card.oos').filter({ hasText: 'Phở bò' })).toContainText('Hết hàng');
      await kds.openStockPanel();
      await expect(kds.stockRow('Phở bò')).toContainText('Hết nguyên liệu');
      const row = kds.card('Bàn E2E-05');
      await row.getByRole('button', { name: 'Nấu' }).click();
      await expect.poll(async () => (await kdsItem(request, 'Bàn E2E-05', 'Phở bò'))?.trangthai)
        .toBe('dang_nau');

      await request.put(`${API}/inventory/ingredients/${bo.id}`, { data: { stock: 10 } });
    });

  test('TC-OP-004 (AC5): mất mạng → "Offline: Đang lưu cục bộ", có mạng lại tự đồng bộ lên server',
    async ({ page, request }) => {
      await sendToKitchen(request, 'Bàn E2E-06', 'Chè đậu đen');
      const card = kds.card('Bàn E2E-06');
      await expect(card).toBeVisible();

      await page.context().setOffline(true);
      await card.getByRole('button', { name: 'Xong' }).click();

      await expect(kds.offlineBanner).toBeVisible();
      await expect(kds.offlineBanner).toContainText('Offline: Đang lưu cục bộ');
      await expect(kds.column('READY').getByText('Bàn E2E-06')).toBeVisible(); // màn hình không treo
      expect((await kdsItem(request, 'Bàn E2E-06', 'Chè đậu đen')).trangthai).toBe('cho_nau');

      await page.context().setOffline(false);

      await expect.poll(async () => (await kdsItem(request, 'Bàn E2E-06', 'Chè đậu đen'))?.trangthai,
        { timeout: 15_000 }).toBe('da_xong');
      await expect(kds.offlineBanner).toBeHidden();
    });

  test('TC-OP-KDS-011 (AC4): tài khoản Phục vụ vào KDS bị chặn 403', async () => {
    test.skip(true, 'Chờ story Auth/JWT (AI_USAGE_LOG A-84) — chưa có đăng nhập để kiểm tra');
  });

  test('TC-OP-002: thẻ quá 15 phút chớp đỏ & đẩy lên đầu', async () => {
    test.skip(true, 'Chưa làm: REQ-08 có nhưng không nằm trong 5 AC của US-03 — chờ PO quyết');
  });
});
