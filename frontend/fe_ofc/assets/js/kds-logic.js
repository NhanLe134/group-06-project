/* =====================================================================
   kds-logic.js — Logic thuần (không DOM, không gọi API) của màn hình Bếp KDS (US-03).
   Tách khỏi kitchen.html để unit test được: frontend/tests/kds-logic.test.js.
   ===================================================================== */

'use strict';

/* REQ-08 — AI Batching
   Stand-in cho AI Service Endpoint (dự kiến POST /api/ai/batching):
   gom các món Chờ nấu cùng món đến từ ≥ 2 bàn khác nhau thành 1 mẻ.
   `isBlocked(dishId)` = bếp đã báo hết món → không gợi ý nấu. */
function aiBatching(items, isBlocked = () => false) {
  const groups = {};
  items.filter(it => it.status === 'PENDING' && !isBlocked(it.dishId)).forEach(it => {
    (groups[it.dishId] = groups[it.dishId] || []).push(it);
  });
  return Object.entries(groups)
    .filter(([, list]) => new Set(list.map(x => x.table)).size >= 2)
    .map(([dishId, list]) => ({
      dishId,
      items: list.sort((a, b) => a.placedTs - b.placedTs),
      totalQty: list.reduce((s, x) => s + x.qty, 0),
      tables: [...new Set(list.map(x => x.table))],
    }))
    .sort((a, b) => b.totalQty - a.totalQty);
}

/* Chữ trạng thái 1 món trong khung Tồn kho (story-spec-tru-kho-tu-dong.md Mục 3):
   món mua sẵn (có stock) "Còn N" theo số lượng; món chế biến theo nguyên liệu + công thức,
   chưa có công thức thì nhắc nhập. `d` là 1 phần tử của GET /menu. */
function stockLabel(d) {
  if (d.listed === false) return 'Hết hàng';
  if (d.status === 'out_of_stock') return d.stock != null ? 'Hết hàng' : 'Hết nguyên liệu';
  return d.portions != null ? `Còn ${d.portions}` : 'Chưa có công thức';
}

const FROM_API = { cho_nau: 'PENDING', dang_nau: 'COOKING', da_xong: 'READY' };

/* Đổi 1 KdsItem của GET /kds/items sang thẻ KDS.
   ADR-N14 (DB mới): món = `mon_id`, đợt gọi = `phieuban_id` (mã phiếu, vd. PB-20261008-0001).
   Vẫn đọc tên cũ `thucdon_id` / `hoadon_id` để không vỡ khi backend chưa cập nhật (BUG-US03-004). */
function fromApi(x) {
  const phieu = x.phieuban_id ?? x.hoadon_id ?? '';
  return {
    id: x.id,
    phieuId: phieu,
    orderCode: phieu,
    table: x.ban || 'Không rõ bàn',
    dishId: x.mon_id ?? x.thucdon_id,
    dishName: x.tenmon || 'Món đã xóa khỏi thực đơn',
    qty: x.soluong,
    note: x.ghichu || '',
    status: FROM_API[x.trangthai],
    placedTs: Date.parse(x.giogoimon),
  };
}
