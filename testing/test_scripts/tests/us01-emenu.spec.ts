/**
 * US-01: E-Menu & Order Draft — E2E (tầng E2E của testing pyramid, giáo trình §11.2)
 * Phụ trách: Nhàn
 * Test cases: testing/test_cases/test-cases-US01.md
 *   TC-GO-001 (AC1 thêm món), TC-GO-002 + TC-US01-003 (AC4 explicit confirmation + mã đơn),
 *   TC-US01-004 (AC5 offline banner + Thử lại), TC-US01-006 (AC6 bộ đếm − n +),
 *   TC-US01-011 (AC4 giỏ trống).
 * Viết lại 2026-10-09: chạy trên backend E2E riêng (không còn mock route như bản cũ).
 *
 * Chạy: npx playwright test -c playwright.us010509.config.ts
 */
import { KDS_DISHES as D, KDS_TABLES as T } from '../data/kds';
import { API, expect, test } from '../utils/localApi';

test.skip(!process.env.E2E_API_URL, 'Chạy bằng playwright.us010509.config.ts (backend E2E riêng)');

const DISH = D.PHO_BO; // món "Phở bò" — có công thức + nguyên liệu đủ trong dữ liệu E2E

function customerUrl(table: string): string {
  return `/pages/customer.html?table=${encodeURIComponent(table)}`;
}

test.describe('US-01 — E-Menu & Order Draft', () => {
  test('TC-GO-001 (AC1): thêm món → Draft có món với số lượng 1, chưa gửi bếp', async ({ page }) => {
    await page.goto(customerUrl(T.REALTIME));
    await page.locator('.menu-card', { hasText: DISH }).waitFor({ timeout: 15_000 });

    await page.locator('.menu-card', { hasText: DISH }).locator('[data-add]').click();
    await page.locator('#btn-open-draft').click();
    await expect(page.locator('#draft-sheet')).toContainText(DISH);
    // REQ-02/BR-01: Draft là client-side, chưa POST /orders → backend CHƯA có phiếu (404)
    const res = await page.request.get(`${API}/orders/current?table_name=${encodeURIComponent(T.REALTIME)}`);
    expect(res.status()).toBe(404);
  });

  test('TC-US01-006 (AC6): bấm "+" 2 lần → bộ đếm − 2 + trên thẻ', async ({ page }) => {
    await page.goto(customerUrl(T.REALTIME));
    const card = page.locator('.menu-card', { hasText: DISH });
    await card.waitFor({ timeout: 15_000 });
    await card.locator('[data-add]').click();
    await card.locator('[data-inc-menu]').click();
    await expect(card).toContainText('2');
  });

  test('TC-GO-002 (AC4): explicit confirmation → gửi bếp thành công, popup có "Mã đơn:", Draft làm trống', async ({ page }) => {
    await page.goto(customerUrl(T.REALTIME));
    const card = page.locator('.menu-card', { hasText: DISH });
    await card.waitFor({ timeout: 15_000 });
    await card.locator('[data-add]').click();

    await page.locator('#btn-open-draft').click();
    await page.locator('#draft-sheet').waitFor({ state: 'visible' });
    await page.locator('[data-open-confirm]').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
    await page.locator('#btn-confirm-send').click();

    await expect(page.locator('#success-modal')).toBeVisible();
    await expect(page.locator('#success-code')).toContainText('Mã đơn:'); // US-01 AC4 — hệ thống sinh mã đơn
    // Đơn thật sự nằm ở backend (ADR-N14): GET /orders/current trả về phiếu
    const res = await page.request.get(`${API}/orders/current?table_name=${encodeURIComponent(T.REALTIME)}`);
    expect(res.status()).toBe(200);
    const bill = await res.json();
    expect(bill.items.some((i: { tenmon: string }) => i.tenmon === DISH)).toBeTruthy();
  });

  test('TC-US01-004 (AC5): mất mạng → banner đỏ, menu GIỮ NGUYÊN; "Thử lại" → tải lại thành công', async ({ page }) => {
    await page.goto(customerUrl(T.OFFLINE));
    await page.locator('.menu-card').first().waitFor({ timeout: 15_000 });
    const cardsBefore = await page.locator('.menu-card').count();

    // Mất mạng trong phiên: khách kéo làm mới → loadMenu() lỗi → banner, menu GIỮ NGUYÊN
    let offline = true;
    await page.route('**/menu', async route => {
      if (offline) await route.abort('failed');
      else await route.continue();
    });
    await page.evaluate('loadMenu().catch(() => showNetBanner())').catch(() => {}); // banner mới là kết quả
    const banner = page.locator('#net-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Lỗi kết nối');
    await expect(banner).toContainText('danh sách món chưa thay đổi');
    // Menu KHÔNG bị xóa — đúng spec AC5
    expect(await page.locator('.menu-card').count()).toBe(cardsBefore);

    offline = false;
    await page.locator('#btn-net-retry').click();
    await expect(banner).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-US01-011 (AC4): giỏ trống → không mở modal gửi bếp', async ({ page }) => {
    await page.goto(customerUrl(T.OFFLINE_MISSED));
    await page.locator('.menu-card').first().waitFor({ timeout: 15_000 });
    await page.locator('#btn-open-draft').click();
    await page.locator('#draft-sheet').waitFor({ state: 'visible' });
    // Giỏ trống: nút gửi bếp không có trong footer (hoặc disabled) — openConfirm() chặn khi draft rỗng
    const sendBtn = page.locator('[data-open-confirm]');
    const goneOrDisabled = (await sendBtn.count()) === 0 || !(await sendBtn.first().isEnabled());
    expect(goneOrDisabled).toBeTruthy();
    await expect(page.locator('#confirm-modal')).toBeHidden();
  });
});
