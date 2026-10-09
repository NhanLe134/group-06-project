/**
 * US-05/US-09 — unit test logic thuần của màn Thu ngân (tầng Unit trong testing pyramid §11.2).
 * Test cases: testing/test_cases/test-cases-US01.md (TC-US01-006, TC-US01-009),
 *             testing/test_cases/test-cases-US09.md (TC-US09-007 — nhóm đợt gọi ADR-N13).
 *
 * cashier.js là script thường (nạp bằng <script> trong cashier.html), nên đọc file rồi chạy
 * trong 1 hàm với stub document — cùng kỹ thuật với kds-logic.test.js, không sửa file gốc.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const JS = resolve(__dirname, '../fe_ofc/assets/js');

/** Stub DOM đủ để cashier.js chạy qua phần khai báo top-level (addEventListener, toast...). */
const stubElement = () => ({
  addEventListener: () => {},
  appendChild: () => {},
  remove: () => {},
  classList: { add: () => {}, remove: () => {} },
  style: {},
  innerHTML: '',
  textContent: '',
  disabled: false,
  hidden: true,
});
const documentStub = {
  querySelector: () => stubElement(),
  createElement: () => stubElement(),
};

function loadCashier(names) {
  const src = readFileSync(resolve(JS, 'cashier.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  const run = new Function('document', `${src}\nreturn { ${names.join(', ')} };`);
  return run(documentStub);
}

const { getGroupedMainItems, getRoundGroupedItems } = loadCashier([
  'getGroupedMainItems',
  'getRoundGroupedItems',
]);

describe('getGroupedMainItems — Hóa đơn chính gộp món trùng (US-05)', () => {
  it('gộp các dòng cùng món: cộng số lượng, cộng thành tiền, giữ giá đơn', () => {
    const items = [
      { thucdon_id: 'MON1', tenmon: 'Phở bò', soluong: 1, giaban: 65000, thanhtien: 65000 },
      { thucdon_id: 'MON1', tenmon: 'Phở bò', soluong: 2, giaban: 65000, thanhtien: 130000 },
      { thucdon_id: 'MON2', tenmon: 'Trà đá', soluong: 1, giaban: 5000, thanhtien: 5000 },
    ];
    const grouped = getGroupedMainItems(items);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]).toMatchObject({ tenmon: 'Phở bò', soluong: 3, giaban: 65000, thanhtien: 195000 });
    expect(grouped[1]).toMatchObject({ tenmon: 'Trà đá', soluong: 1 });
  });

  it('fallback: thiếu thucdon_id thì gộp theo tên món', () => {
    const items = [
      { tenmon: 'Gỏi cuốn', soluong: 1, giaban: 20000, thanhtien: 20000 },
      { tenmon: 'Gỏi cuốn', soluong: 1, giaban: 20000, thanhtien: 20000 },
    ];
    expect(getGroupedMainItems(items)).toHaveLength(1);
    expect(getGroupedMainItems(items)[0].soluong).toBe(2);
  });

  it('danh sách rỗng → mảng rỗng (§11.3 empty)', () => {
    expect(getGroupedMainItems([])).toEqual([]);
    expect(getGroupedMainItems(undefined)).toEqual([]);
  });
});

describe('getRoundGroupedItems — Hóa đơn chi tiết nhóm theo đợt gọi (US-09 AC6, ADR-N13)', () => {
  it('nhóm món theo `dot`, tiêu đề có số thứ tự + giờ gọi + tổng số món', () => {
    const items = [
      { tenmon: 'Phở bò', soluong: 2, dot: 1, giogoimon: '2026-10-09T11:00:00Z', trangthai: 'da_phuc_vu' },
      { tenmon: 'Trà đá', soluong: 1, dot: 1, giogoimon: '2026-10-09T11:00:00Z', trangthai: 'da_phuc_vu' },
      { tenmon: 'Bò sốt tiêu đen', soluong: 1, dot: 2, giogoimon: '2026-10-09T11:30:00Z', trangthai: 'cho_nau' },
    ];
    const rounds = getRoundGroupedItems(items);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].roundIndex).toBe(1);
    expect(rounds[0].items).toHaveLength(2);
    expect(rounds[0].totalQty).toBe(3);
    expect(rounds[0].timeStr).toBeTruthy();
    expect(rounds[1].roundIndex).toBe(2);
    expect(rounds[1].totalQty).toBe(1);
  });

  it('món không có `dot` (API cũ) vẫn nhóm được theo giogoimon', () => {
    const items = [
      { tenmon: 'A', soluong: 1, giogoimon: '2026-10-09T11:00:00Z' },
      { tenmon: 'B', soluong: 1, giogoimon: '2026-10-09T11:00:00Z' },
      { tenmon: 'C', soluong: 1, giogoimon: '2026-10-09T12:00:00Z' },
    ];
    const rounds = getRoundGroupedItems(items);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].items.map(x => x.tenmon)).toEqual(['A', 'B']);
  });

  it('danh sách rỗng → không có nhóm (§11.3 empty)', () => {
    expect(getRoundGroupedItems([])).toEqual([]);
    expect(getRoundGroupedItems(null)).toEqual([]);
  });
});
