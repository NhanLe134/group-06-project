/**
 * US-03 KDS — unit test logic thuần của frontend (tầng Unit trong testing pyramid §11.2).
 * Test cases: testing/test_cases/test-cases-US03.md (TC-OP-KDS-001, -002, -014, -017, -018; BUG-US03-002, -003, -004).
 *
 * kds-logic.js / realtime.js là script thường (nạp bằng <script> trong trang), nên ở đây đọc file
 * rồi chạy trong 1 hàm để lấy các hàm cần test — không phải sửa file sang ES module.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const JS = resolve(__dirname, '../fe_ofc/assets/js');

function loadScript(file, names, globals = {}) {
  const src = readFileSync(resolve(JS, file), 'utf8');
  const params = Object.keys(globals);
  // eslint-disable-next-line no-new-func
  const run = new Function(...params, `${src}\nreturn { ${names.join(', ')} };`);
  return run(...params.map(k => globals[k]));
}

const { aiBatching, stockLabel, fromApi } = loadScript('kds-logic.js', ['aiBatching', 'stockLabel', 'fromApi']);

const item = (id, dishId, table, qty = 1, placedTs = 0, status = 'PENDING') =>
  ({ id, dishId, table, qty, placedTs, status });

describe('aiBatching — REQ-08 / US-03 AC1', () => {
  it('TC-OP-KDS-001: gom cùng món từ ≥ 2 bàn thành 1 mẻ, cộng đủ số suất, xếp theo giờ gọi', () => {
    const batches = aiBatching([
      item('a', 'PHO', 'Bàn 02', 1, 20),
      item('b', 'PHO', 'Bàn 01', 2, 10),
    ]);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ dishId: 'PHO', totalQty: 3, tables: ['Bàn 01', 'Bàn 02'] });
    expect(batches[0].items.map(x => x.id)).toEqual(['b', 'a']);   // FIFO trong mẻ
  });

  it('TC-OP-KDS-001: nhiều mẻ thì mẻ nhiều suất hơn đứng trước', () => {
    const batches = aiBatching([
      item('a', 'COM', 'Bàn 01'), item('b', 'COM', 'Bàn 02'),
      item('c', 'PHO', 'Bàn 01', 3), item('d', 'PHO', 'Bàn 03', 2),
    ]);
    expect(batches.map(b => [b.dishId, b.totalQty])).toEqual([['PHO', 5], ['COM', 2]]);
  });

  it('TC-OP-KDS-002: không gom món của cùng 1 bàn, món không ở Chờ nấu, món bếp đã báo hết', () => {
    expect(aiBatching([item('a', 'PHO', 'Bàn 01'), item('b', 'PHO', 'Bàn 01', 2)])).toEqual([]);
    expect(aiBatching([item('a', 'PHO', 'Bàn 01'), item('b', 'PHO', 'Bàn 02', 1, 0, 'COOKING')])).toEqual([]);
    const blocked = id => id === 'PHO';
    expect(aiBatching([item('a', 'PHO', 'Bàn 01'), item('b', 'PHO', 'Bàn 02')], blocked)).toEqual([]);
  });

  it('TC-OP-KDS-002: danh sách rỗng → không có mẻ nào', () => {
    expect(aiBatching([])).toEqual([]);
  });
});

describe('stockLabel — khung Tồn kho (story-spec-tru-kho-tu-dong.md Mục 3)', () => {
  it('TC-OP-KDS-014: món mua sẵn hiện số lượng, món chế biến hiện số phần theo nguyên liệu', () => {
    expect(stockLabel({ status: 'available', stock: 24, portions: 24 })).toBe('Còn 24');
    expect(stockLabel({ status: 'available', stock: null, portions: 20 })).toBe('Còn 20');
    expect(stockLabel({ status: 'available', stock: null, portions: null })).toBe('Chưa có công thức');
  });

  it('TC-OP-KDS-014: hết hàng — báo tay / hết số lượng / hết nguyên liệu', () => {
    expect(stockLabel({ listed: false, status: 'out_of_stock', stock: 5, portions: 5 })).toBe('Hết hàng');
    expect(stockLabel({ status: 'out_of_stock', stock: 0, portions: 0 })).toBe('Hết hàng');
    expect(stockLabel({ status: 'out_of_stock', stock: null, portions: 0 })).toBe('Hết nguyên liệu');
  });
});

describe('wsBaseFrom — realtime.js (TC-OP-KDS-017, regression BUG-US03-003)', () => {
  const { wsBaseFrom } = loadScript('realtime.js', ['wsBaseFrom'], {
    window: { APP_CONFIG: {} },
    location: { protocol: 'http:', hostname: 'localhost' },
  });

  it('bản deploy https → wss tới đúng server Render, không dùng cổng 8000 của máy', () => {
    expect(wsBaseFrom('https://group06-restaurant-api.onrender.com/', { protocol: 'https:', hostname: 'smart-orderding.vercel.app' }))
      .toBe('wss://group06-restaurant-api.onrender.com');
  });

  it('dev local http → ws; thiếu config.js thì dùng hostname:8000', () => {
    expect(wsBaseFrom('http://localhost:8000', {})).toBe('ws://localhost:8000');
    expect(wsBaseFrom(undefined, { protocol: 'http:', hostname: '192.168.1.5' })).toBe('ws://192.168.1.5:8000');
  });
});

describe('fromApi — đổi dữ liệu GET /kds/items sang thẻ KDS (TC-OP-KDS-018, regression BUG-US03-004)', () => {
  const base = { id: 'CTP-1', ban: 'Bàn 01', tenmon: 'Phở bò', soluong: 2, ghichu: null,
    trangthai: 'dang_nau', giogoimon: '2026-10-08T03:00:00+00:00' };

  it('đọc tên trường của DB mới (ADR-N14): mon_id, phieuban_id', () => {
    const card = fromApi({ ...base, mon_id: 'MON001', phieuban_id: 'PB-20261008-0001' });
    expect(card).toMatchObject({ dishId: 'MON001', orderCode: 'PB-20261008-0001', status: 'COOKING', qty: 2 });
  });

  it('2 món khác nhau KHÔNG bị gom chung 1 mẻ (lỗi cũ: mọi món mất mã → "4× Món")', () => {
    const cards = [
      fromApi({ ...base, id: 'a', ban: 'Bàn 01', mon_id: 'PHO', trangthai: 'cho_nau' }),
      fromApi({ ...base, id: 'b', ban: 'Bàn 02', mon_id: 'COM', trangthai: 'cho_nau' }),
    ];
    expect(aiBatching(cards)).toEqual([]);
  });

  it('vẫn đọc được tên trường cũ (thucdon_id, hoadon_id)', () => {
    expect(fromApi({ ...base, thucdon_id: 'MON002', hoadon_id: 'HD-1' }))
      .toMatchObject({ dishId: 'MON002', orderCode: 'HD-1' });
  });
});

