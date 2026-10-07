/**
 * US-06: Dashboard Doanh thu Real-time
 * Phụ trách: *(thành viên)*
 * Test cases: TC-MA-001
 */
import { test, expect } from '@playwright/test';

test.describe('US-06 — Dashboard Doanh thu', () => {

  // TC-MA-001
  test('thanh toán thành công → doanh thu tự cộng thêm không cần F5', async () => {
    test.skip(true, 'Manual/E2E — cần WebSocket broadcast từ backend');
  });
});
