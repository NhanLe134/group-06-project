/**
 * US-05: Split Bill (Chia hóa đơn)
 * Phụ trách: *(thành viên)*
 * Test cases: TC-GO-011, TC-GO-012
 */
import { test, expect } from '@playwright/test';

test.describe('US-05 — Split Bill', () => {

  // TC-GO-011
  test('chia đều 300,000đ cho 3 người → 3 mã QR mỗi mã 100,000đ', async ({ request }) => {
    const res = await request.post('/api/v1/bills/split', {
      data: { bill_total: 300_000, split_count: 3 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(3);
    expect(body.items[0].amount).toBe(100_000);
  });

  // TC-GO-012
  test('split_count = 0 → HTTP 400 Bad Request (Negative)', async ({ request }) => {
    const res = await request.post('/api/v1/bills/split', {
      data: { bill_total: 100_000, split_count: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test('split_count âm → HTTP 400 Bad Request (Negative)', async ({ request }) => {
    const res = await request.post('/api/v1/bills/split', {
      data: { bill_total: 100_000, split_count: -3 },
    });
    expect(res.status()).toBe(400);
  });

  test('split_count chuỗi ký tự → HTTP 422 Unprocessable (Negative)', async ({ request }) => {
    const res = await request.post('/api/v1/bills/split', {
      data: { bill_total: 100_000, split_count: 'abc' },
    });
    expect([400, 422]).toContain(res.status());
  });
});
