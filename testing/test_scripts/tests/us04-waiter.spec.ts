/**
 * US-04: Tablet Phục vụ (Waiter)
 * Phụ trách: *(thành viên)*
 * Test cases: TC-OP-006, TC-OP-007, TC-OP-008, TC-OP-009
 */
import { test, expect } from '@playwright/test';
import { USERS, WRONG_PIN } from '../data/users';

test.describe('US-04 — Tablet Phục vụ', () => {

  // TC-OP-006
  test('Tablet phát âm "Ting Ting" khi món Done (REQ-07)', async () => {
    test.skip(true, 'Manual/E2E — cần kiểm tra âm thanh trên thiết bị thật');
  });

  // TC-OP-007
  test('bấm "Đã phục vụ" → Table Map đổi màu (REQ-06)', async () => {
    test.skip(true, 'Manual/E2E — cần màn hình Table Map');
  });

  // TC-OP-008
  test('hủy món với PIN đúng → thành công HTTP 200 (BR-02)', async ({ request }) => {
    // TODO: POST /orders/void với PIN đúng → expect 200
    test.skip(true, 'Cần backend và seed order');
  });

  // TC-OP-009
  test('hủy món với PIN sai → HTTP 401/403 (BR-02 Negative)', async ({ request }) => {
    // TODO: POST /orders/void với PIN = WRONG_PIN → expect 401 hoặc 403
    test.skip(true, 'Cần backend và seed order');
  });
});
