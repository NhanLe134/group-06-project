/* =====================================================================
   DuLieuChung.js — TRẠNG THÁI + HÀM DÙNG CHUNG của màn hình Khách hàng
   ---------------------------------------------------------------------
   File này ĐƯỢC LOAD ĐẦU TIÊN (trước ThucDon/GioHang/GuiBep/HoaDon).
   Chứa: biến trạng thái chung + hàm tiện ích — các file khác ĐỌC/GHI vào
   đây nhưng KHÔNG được khai báo lại (sẽ lỗi "already declared").

   Ai cần gì thì vào đâu (xem CODE_MAP.md):
   - draft (giỏ hàng)     → GioHang.js quản lý
   - MENU (thực đơn)      → ThucDon.js tải từ GET /menu
   - tableName (bàn hiện tại) → đọc từ URL ?table= / sessionStorage
   ===================================================================== */

'use strict';

/* ---------- Tiện ích DOM & chuỗi ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
/* Gán textContent an toàn — nếu phần tử không tồn tại trong HTML (bị xóa/tùy chọn)
 * thì bỏ qua thay vì văng TypeError làm hỏng cả luồng (A-N03, A-N17, A-N19) */
const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };

/* Escape chuỗi người dùng nhập (ghi chú món) trước khi nhúng vào HTML */
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu */
const norm = t => String(t).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();

/* ---------- Mã bàn: URL ?table=... → sessionStorage → mặc định 'Bàn 06' ---------- */
const TABLE_KEY = 'current_table';
const tableName =
  new URLSearchParams(window.location.search).get('table')
  || sessionStorage.getItem(TABLE_KEY)
  || 'Bàn 06';
sessionStorage.setItem(TABLE_KEY, tableName);

/* ---------- TRẠNG THÁI CHUNG (mọi file khác đọc/ghi các biến này) ---------- */
let draft = [];            /* Giỏ nháp: [{ id, qty, note }] — bản nháp DUY NHẤT của bàn */
let searchText = '';       /* Từ khóa tìm kiếm món (ThucDon.js dùng) */
let draftOpen = false;     /* Order Draft sheet đang mở? */
let editingNoteIdx = null; /* Index món đang mở modal ghi chú (GhiChuMon.js) */
let MENU = [];             /* Danh sách món từ GET /menu (ThucDon.js tải) */
let CATS = [];             /* Nhóm phân loại suy ra từ MENU: [{ id, label }] */

/* ---------- Truy vấn dữ liệu ---------- */
const dishById = id => MENU.find(d => d.id === id);
const isOos = id => dishById(id)?.status === 'out_of_stock';
const draftUnits = () => draft.reduce((n, it) => n + it.qty, 0);
const draftTotal = () => draft.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);
const draftHasOos = () => draft.some(it => isOos(it.id));
/* Tổng số phần của 1 món đang nằm trong giỏ (gộp các dòng ghi chú khác nhau) */
const menuQty = id => draft.filter(it => it.id === id).reduce((n, it) => n + it.qty, 0);

/* ---------- Lỗi API → banner đỏ trên đầu danh sách ---------- */
function showApiError(e) {
  $('#menu-grid').insertAdjacentHTML(
    'afterbegin',
    `<div class="adr-warn" role="alert" style="margin:0 0 14px;">
      <i class="ph-fill ph-warning-circle"></i>
      <p>${esc(e.message || 'Có lỗi xảy ra. Vui lòng thử lại.')}</p>
    </div>`,
  );
}
