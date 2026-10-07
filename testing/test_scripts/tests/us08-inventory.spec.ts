/**
 * US-08: Kiểm kê Tồn kho (Inventory Reconciliation)
 * Phụ trách: *(thành viên)*
 * Test cases: TC-MA-004, TC-MA-005
 */
import { test, expect } from '@playwright/test';

test.describe('US-08 — Inventory Reconciliation', () => {

  // TC-MA-004
  test('nhập tồn thực tế 5kg vs lý thuyết 6kg → chênh lệch -1kg hiển thị đỏ', async ({ request }) => {
    const res = await request.post('/api/v1/inventory/reconcile', {
      data: {
        item_name: 'Thịt Bò',
        theoretical: 6.0,
        actual: 5.0,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.delta).toBe(-1.0);
  });

  // TC-MA-005
  test('tồn kho thực tế nhập số âm → HTTP 400 (Negative)', async ({ request }) => {
    const res = await request.post('/api/v1/inventory/reconcile', {
      data: {
        item_name: 'Thịt Bò',
        theoretical: 6.0,
        actual: -5.0,
      },
    });
    expect(res.status()).toBe(400);
  });
});
