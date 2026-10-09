/* =====================================================================
   customer.js — FILE CHÍNH (entry) của màn hình Khách hàng (Nhàn)
   =====================================================================
   KHÔNG chứa logic — chỉ KHỞI TẠO. Code đã tách theo tính năng:

   FILE                          | TÍNH NĂNG                       | US
   ------------------------------|---------------------------------|--------
   DuLieuChung.js                | Trạng thái chung + hàm tiện ích | —
   ThucDon.js                    | E-Menu: thực đơn, phân loại,    | US-01
                                 | tìm kiếm, scroll-spy            |
   GioHang.js                    | Giỏ nháp (Order Draft)          | US-01
   GhiChuMon.js                  | Ghi chú từng món (ADR-N01)      | US-01
   GuiBep.js                     | Xác nhận gửi bếp (BR-01/03)     | US-01
   HoaDon.js                     | Hóa đơn tạm tính + yêu cầu      | US-09
                                 | thanh toán (ADR-N05/N13)
   ---------------------------------------------------------------------
   THỨ TỰ LOAD (customer.html): DuLieuChung → ThucDon → GioHang →
   GhiChuMon → GuiBep → HoaDon → customer.js (file này chạy CUỐI).

   KẾT NỐI BACKEND (FastAPI + Supabase):
   - GET  /menu                              → thực đơn E-Menu
   - POST /orders                            → gửi bếp (đa đợt — ADR-N14)
   - GET  /orders/current?table_name=...     → hóa đơn tạm tính (US-09)
   - Mã bàn đọc từ URL ?table=... → sessionStorage → fallback 'Bàn 06'

   US-02 (Ny): Trợ lý Voice AI (voice.js) chạy song song, không đụng file này.
   ===================================================================== */

'use strict';

/* ===================== KHỞI TẠO ===================== */
/* Hiển thị mã bàn: URL ?table=... → sessionStorage → 'Bàn 06' */
setText('#table-name', tableName);
setText('#bill-view-table', tableName);
setText('#success-table', tableName);
{
  const chip = $('#table-chip');
  if (chip) chip.innerHTML = `<i class="ph-duotone ph-map-pin"></i> ${esc(tableName)}`;
}
renderCategories();
renderStickyBar();
renderMenuSkeleton();
loadMenu().catch(e => {
  $('#menu-grid').innerHTML = `
    <div class="menu-empty">
      <i class="ph-duotone ph-wifi-slash"></i>
      <p>${esc(e.message)}</p>
      <button class="btn-primary" style="margin-top:12px;" onclick="loadMenu()">Tải lại thực đơn</button>
    </div>`;
});

/* US-03 AC3: Bếp/Quản lý báo Hết hàng / Còn hàng → tải lại menu ngay, không cần F5.
   Món hết hàng đang nằm trong bản nháp sẽ hiện cảnh báo và khóa nút gửi bếp. */
if (typeof subscribeChannel === 'function') {
  subscribeChannel('menu:oos', msg => {
    if (msg.event !== 'ITEM_OOS_BROADCAST') return;
    loadMenu()
      .then(() => { renderStickyBar(); renderDraft(); })
      .catch(() => { /* giữ menu hiện tại nếu tải lại lỗi */ });
  });
}
