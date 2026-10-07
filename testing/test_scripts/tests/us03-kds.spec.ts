/**
 * US-03: KDS Bếp
 * Phụ trách: *(thành viên)*
 * Test cases: TC-OP-001, TC-OP-002, TC-OP-003, TC-OP-004, TC-OP-005
 *
 * TODO: Thay thế mock data bằng API thật khi backend sẵn sàng.
 */
import { test, expect } from '@playwright/test';
import { KdsPage } from '../pages/KdsPage';

test.describe('US-03 — KDS Bếp', () => {
  let kds: KdsPage;

  test.beforeEach(async ({ page }) => {
    kds = new KdsPage(page);
    await kds.goto();
  });

  // TC-OP-001
  test('ticket xuất hiện trên KDS sau khi khách chốt đơn (WebSocket)', async ({ page }) => {
    // TODO: Gửi order qua API → chờ WebSocket event → kiểm tra ticket xuất hiện < 1s
    test.skip(true, 'Cần backend WebSocket thật để test');
  });

  // TC-OP-002
  test('ticket > 15 phút chớp đỏ và đẩy lên đầu', async () => {
    // TODO: Mock timer để trigger overdue state
    test.skip(true, 'Cần mock timer hoặc fast-forward time');
  });

  // TC-OP-003
  test('bấm OOS → món bị khóa trên E-Menu trong < 1s (BR-03)', async () => {
    // TODO: Test cross-page WebSocket broadcast
    test.skip(true, 'Cần multi-page test với 2 browser contexts');
  });

  // TC-OP-004
  test('KDS offline → hiện badge, reconnect nhận bù ticket', async () => {
    test.skip(true, 'Manual/E2E — cần môi trường staging');
  });

  // TC-OP-005
  test('race condition: 2 request đồng thời chốt suất cuối → 1 request bị 409', async ({ request }) => {
    // TODO: Dùng apiHelper để gửi 2 request song song
    test.skip(true, 'Cần backend và seed data');
  });
});
