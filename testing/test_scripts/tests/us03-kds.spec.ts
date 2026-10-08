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
import { KDS_DISHES as D, KDS_INGREDIENTS, KDS_TABLES as T } from '../data/kds';
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
      // Đo 5 lần (1 lần đo dao động 288–710 ms giữa các lần chạy) → báo trung vị và lớn nhất
      const cards = kds.column('PENDING').getByText(T.REALTIME);
      const samples: number[] = [];
      for (let i = 0; i < 5; i++) {
        const before = await cards.count();
        expect((await sendToKitchen(request, T.REALTIME, D.BANH_FLAN)).ok()).toBeTruthy();
        const sent = Date.now();
        await expect(cards).toHaveCount(before + 1, { timeout: 3_000 });
        samples.push(Date.now() - sent);
      }
      const sorted = [...samples].sort((a, b) => a - b);
      const median = sorted[2];
      testInfo.annotations.push(
        { type: 'latency_ms samples (NFR-RO-01 < 500 ms)', description: samples.join(', ') },
        { type: 'latency_ms median', description: String(median) },
        { type: 'latency_ms max', description: String(sorted[4]) },
      );
      expect(median).toBeLessThan(1_000); // ngưỡng chặn hồi quy; đạt/không đạt NFR ghi ở test case
      await expect(page.locator('.toast').filter({ hasText: `Đơn mới — ${T.REALTIME}` }).first())
        .toBeVisible();
    });

  test('TC-OP-KDS-001 (AC1): 2 bàn cùng gọi Phở → mẻ "3× Phở bò" nhãn "Gợi ý nấu chung", đứng đầu cột',
    async ({ request }) => {
      await sendToKitchen(request, T.BATCH_A, D.PHO_BO, 2);
      await sendToKitchen(request, T.BATCH_B, D.PHO_BO, 1);

      const batch = kds.batch(D.PHO_BO);
      await expect(batch).toContainText('Gợi ý nấu chung');
      await expect(batch).toContainText('3×');
      await expect(batch).toContainText(T.BATCH_A);
      await expect(batch).toContainText(T.BATCH_B);
      await expect(kds.column('PENDING').locator('section.batch, article.kcard').first())
        .toContainText(D.PHO_BO);
    });

  test('TC-OP-KDS-004 (AC2): bấm "Xong" → DB đổi da_xong, màn Phục vụ nhận thông báo món xong',
    async ({ page, request }) => {
      const waiter = await openPage(page, '/pages/waiter.html');
      await waiter.waitForTimeout(1_000); // chờ WebSocket của trang Phục vụ kết nối
      await sendToKitchen(request, T.READY, D.GOI_CUON);
      const card = kds.card(T.READY);
      await expect(card).toBeVisible();

      await card.getByRole('button', { name: 'Xong' }).click();

      await expect(kds.column('READY').getByText(T.READY)).toBeVisible();
      await expect.poll(async () => (await kdsItem(request, T.READY, D.GOI_CUON))?.trangthai)
        .toBe('da_xong');
      await expect(waiter.locator('.notif-card').filter({ hasText: T.READY }))
        .toContainText(D.GOI_CUON);
    });

  test('TC-OP-003 (AC3): Bếp báo hết "Salad cá ngừ" → E-Menu của khách gỡ món < 1 s, không F5',
    async ({ page, request }, testInfo) => {
      const emenu = await openPage(page, `/pages/customer.html?table=${T.OOS}`);
      const salad = emenu.locator('.menu-card').filter({ hasText: D.SALAD });
      await expect(salad).toBeVisible();
      await emenu.waitForTimeout(1_000); // chờ WebSocket của E-Menu kết nối

      await kds.markOutOfStock(D.SALAD);
      const clicked = Date.now();

      // ADR-N11 (US-01): món bếp báo hết (trangthaiban = false) bị ẩn khỏi E-Menu
      await expect(salad).toHaveCount(0, { timeout: 3_000 });
      testInfo.annotations.push({ type: 'oos_sync_ms (REQ-09 < 1 s)', description: String(Date.now() - clicked) });
      expect(Date.now() - clicked).toBeLessThan(1_000);
      await expect(kds.stockRow(D.SALAD)).toContainText('Hết hàng');

      const id = (await (await request.get(`${API}/menu`)).json())
        .find((m: { name: string }) => m.name === D.SALAD).id;
      await request.post(`${API}/menu/items/${id}/in-stock`); // trả dữ liệu về như cũ
    });

  test('TC-OP-KDS-010 (AC3 tự động): hết nguyên liệu → E-Menu xám "Hết hàng", món đã gửi vẫn nấu được',
    async ({ page, request }) => {
      const ingredients = await (await request.get(`${API}/inventory/ingredients`)).json();
      const bo = ingredients.find((i: { name: string }) => i.name === KDS_INGREDIENTS.THIT_BO);
      await request.put(`${API}/inventory/ingredients/${bo.id}`, { data: { stock: 0.3 } });
      const emenu = await openPage(page, `/pages/customer.html?table=${T.NO_INGREDIENT}`);
      await expect(emenu.locator('.menu-card').filter({ hasText: D.PHO_BO })).toBeVisible();
      await emenu.waitForTimeout(1_000);

      await sendToKitchen(request, T.NO_INGREDIENT, D.PHO_BO); // còn 0.1 kg < 0.2 kg/phần

      // E-Menu (US-01, Nhàn) hiện nhãn "Hết" trên thẻ xám
      await expect(emenu.locator('.menu-card.oos').filter({ hasText: D.PHO_BO })).toContainText('Hết');
      await kds.openStockPanel();
      await expect(kds.stockRow(D.PHO_BO)).toContainText('Hết nguyên liệu');
      const row = kds.card(T.NO_INGREDIENT);
      await row.getByRole('button', { name: 'Nấu' }).click();
      await expect.poll(async () => (await kdsItem(request, T.NO_INGREDIENT, D.PHO_BO))?.trangthai)
        .toBe('dang_nau');

      await request.put(`${API}/inventory/ingredients/${bo.id}`, { data: { stock: 10 } });
    });

  test('TC-OP-004 (AC5): mất mạng → "Offline: Đang lưu cục bộ", có mạng lại tự đồng bộ + nhận bù đơn bị nhỡ',
    async ({ page, request }) => {
      await sendToKitchen(request, T.OFFLINE, D.CHE);
      const card = kds.card(T.OFFLINE);
      await expect(card).toBeVisible();

      await page.context().setOffline(true);
      await card.getByRole('button', { name: 'Xong' }).click();

      await expect(kds.offlineBanner).toBeVisible();
      await expect(kds.offlineBanner).toContainText('Offline: Đang lưu cục bộ');
      await expect(kds.column('READY').getByText(T.OFFLINE)).toBeVisible(); // màn hình không treo
      expect((await kdsItem(request, T.OFFLINE, D.CHE)).trangthai).toBe('cho_nau');

      // Khách gửi đơn mới trong lúc KDS đang mất mạng (TC-OP-004 gốc: "nhận bù ticket bị nhỡ")
      expect((await sendToKitchen(request, T.OFFLINE_MISSED, D.BANH_FLAN)).ok()).toBeTruthy();
      await page.waitForTimeout(1_000);
      await expect(kds.column('PENDING').getByText(T.OFFLINE_MISSED)).toHaveCount(0);

      await page.context().setOffline(false);

      await expect.poll(async () => (await kdsItem(request, T.OFFLINE, D.CHE))?.trangthai,
        { timeout: 15_000 }).toBe('da_xong');
      await expect(kds.offlineBanner).toBeHidden();
      await expect(kds.column('PENDING').getByText(T.OFFLINE_MISSED)).toBeVisible({ timeout: 15_000 });
    });

  test('TC-OP-KDS-011 (AC4): tài khoản Phục vụ vào KDS bị chặn 403', async () => {
    test.skip(true, 'Chờ story Auth/JWT (AI_USAGE_LOG A-84) — chưa có đăng nhập để kiểm tra');
  });

  test('TC-OP-002: thẻ quá 15 phút chớp đỏ & đẩy lên đầu', async () => {
    test.skip(true, 'Chưa làm: REQ-08 có nhưng không nằm trong 5 AC của US-03 — chờ PO quyết');
  });
});
