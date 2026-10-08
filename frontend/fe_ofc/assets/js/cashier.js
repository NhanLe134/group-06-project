/* =====================================================================
   cashier.js — Màn hình Thu ngân (US-05) — kết nối Backend FastAPI
   ---------------------------------------------------------------------
   API (theo yêu cầu nối FE ↔ Backend/Supabase):
   - GET  /cashier/tables            → danh sách bàn + hóa đơn đang mở
   - GET  /orders/current?table_name → chi tiết món đợt 1, đợt 2 của bàn
   - POST /tables/{ban_id}/pay-qr → tạo QR cho các phiếu chưa tính tiền
   - POST /tables/{ban_id}/close → tạo hoadon + bàn về chờ dọn
   - POST /tables/{phienban_id}/close → hoadon 'da_thanh_toan', bàn về 'trong'
   QR trả về từ backend (mock qrserver.com; sau này thay bằng MoMo/VNPAY).
   Công tắc "Mô phỏng lỗi cổng thanh toán" giữ lại cho AC5.
   ===================================================================== */

'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ----- State ----- */
let tables = [];          /* TableOut[] từ GET /cashier/tables */
let selectedId = null;    /* phienban id đang mở chi tiết */
let bill = null;          /* OrderCurrentOut của bàn đang chọn */
let qr = null;            /* PayQrOut sau khi tạo QR */

const TRANGTHAI_LABEL = {
  cho_nau: 'Chờ nấu',
  dang_nau: 'Đang nấu',
  da_xong: 'Đã xong — chờ phục vụ',
  da_phuc_vu: 'Đã phục vụ',
};

/* ===================== TOAST (AC4/AC5) ===================== */
function toast(title, body, warn = false) {
  const box = document.createElement('div');
  box.className = 'toast ' + (warn ? 'toast-warn' : 'toast-ok');
  box.innerHTML = `
    <p class="toast-title"><i class="ph-fill ${warn ? 'ph-warning-circle' : 'ph-check-circle'}"></i> ${esc(title)}</p>
    <p class="toast-body">${esc(body)}</p>`;
  $('#toast-container').appendChild(box);
  setTimeout(() => box.remove(), 4500);
}

async function run(fn) {
  try {
    await fn();
  } catch (e) {
    toast('Có lỗi xảy ra', e.message || 'Vui lòng thử lại.', true);
  }
}

/* ===================== DANH SÁCH BÀN ===================== */
async function loadTables() {
  tables = await apiFetch('/cashier/tables');
  renderTableList();
}

function renderTableList() {
  const occupied = tables.filter(t => t.trangthai === '2');
  $('#occupied-count').textContent = occupied.length;

  $('#table-list').innerHTML = tables.length ? tables.map(t => `
    <button class="table-item ${t.id === selectedId ? 'active' : ''} ${t.trangthai === '2' ? '' : 'empty'}"
      data-table="${t.id}">
      <span class="ti-name">${esc(t.tenban)}</span>
      <span class="ti-info">
        ${t.trangthai === '2'
          ? `<span class="status-pill st-occupied">Đang ăn</span>
             <b class="ti-total">${fmtVND(t.tongtien)}</b>`
          : '<span class="status-pill st-empty">Trống</span>'}
      </span>
      <i class="ph-bold ph-caret-right ti-arrow"></i>
    </button>`).join('')
    : '<div class="table-empty">Chưa có phiên bàn nào.<br>Hãy để khách gọi món trước.</div>';
}

/* ===================== CHI TIẾT HÓA ĐƠN + THANH TOÁN ===================== */
async function openTable(id) {
  selectedId = id;
  qr = null;
  bill = null;
  renderTableList();
  const panel = $('#detail-panel');
  const t = tables.find(x => x.id === id);
  if (!t) {
    panel.innerHTML = `
      <div class="detail-empty">
        <i class="ph-duotone ph-armchair"></i>
        <p>Chọn một bàn để xem chi tiết hóa đơn.</p>
      </div>`;
    return;
  }

  panel.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${esc(t.tenban)} <span class="status-pill ${t.trangthai === '2' ? 'st-occupied' : 'st-empty'}">
          ${t.trangthai === '2' ? 'Đang ăn' : 'Trống'}</span></h2>
      </div>
    </div>
    <div class="draft-empty"><i class="ph-duotone ph-spinner"></i><p>Đang tải hóa đơn...</p></div>`;

  /* Chi tiết món đợt 1, đợt 2 từ GET /orders/current */
  try {
    bill = await apiFetch(
      `/orders/current?table_name=${encodeURIComponent(t.tenban)}`,
    );
  } catch (e) {
    bill = null;
    panel.insertAdjacentHTML('beforeend', `
      <div class="detail-empty">
        <i class="ph-duotone ph-armchair"></i>
        <p>${e.status === 404 ? `${esc(t.tenban)} đang trống hoặc chưa gọi món.` : esc(e.message)}</p>
      </div>`);
    return;
  }

  const allServed = bill.all_served;
  panel.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${esc(bill.table_name)} <span class="status-pill st-occupied">Đang ăn</span></h2>
        <p>Hóa đơn <b>${bill.hoadon_id.slice(0, 8)}</b>…</p>
      </div>
    </div>

    <div class="bill">
      <table class="bill-table">
        <thead><tr><th>Món</th><th class="num">SL</th><th class="num">Thành tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${bill.items.map(it => `
          <tr>
            <td>${esc(it.tenmon || '')}${it.ghichu ? `<small>${esc(it.ghichu)}</small>` : ''}</td>
            <td class="num">${it.soluong}</td>
            <td class="num">${fmtVND(it.thanhtien)}</td>
            <td><span class="status-pill ${it.trangthai === 'da_phuc_vu' ? 'st-served' : 'st-pending'}">
              ${TRANGTHAI_LABEL[it.trangthai] || it.trangthai}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="bill-foot">
        <span>Tổng số món: <b>${bill.items.reduce((n, it) => n + it.soluong, 0)}</b></span>
        <span>Tổng thành tiền: <b class="bill-total">${fmtVND(bill.tongtien)}</b></span>
      </div>
    </div>

    <div class="pay-box">
      <h4><i class="ph-duotone ph-credit-card"></i> Thanh toán (US-05)</h4>
      <p class="pay-hint">Thanh toán toàn bộ hóa đơn qua mã QR.</p>
      ${qr ? `
      <div class="payer-card">
        <div class="payer-head">
          <b><i class="ph-bold ph-user"></i> ${esc(bill.table_name)}</b>
          <span class="payer-amount">${fmtVND(qr.amount)}</span>
        </div>
        <div class="payer-body">
          <img class="qr-img" alt="Mã QR thanh toán" src="${esc(qr.qr_url)}">
        </div>
      </div>
      <button class="btn-confirm-pay" id="btn-confirm-pay" style="margin-top:14px; width:100%;">
        <i class="ph-bold ph-hand-coins"></i> Xác nhận đã nhận tiền &amp; Đóng bàn
      </button>` : `
      <button class="btn-primary btn-create" id="btn-create-qr">
        <i class="ph-duotone ph-qr-code"></i> Tạo mã thanh toán
      </button>`}
    </div>`;
}

/* ===================== HÀNH VI ===================== */
function createQR() {
  if (!bill) return;

  /* AC5 — mô phỏng cổng thanh toán lỗi: toast vàng + giữ nguyên hóa đơn */
  if ($('#err-sim').checked) {
    toast('Không thể khởi tạo mã QR thanh toán.',
      'Vui lòng kiểm tra lại mạng hoặc thử lại. Hóa đơn của bạn vẫn được giữ nguyên.', true);
    return;
  }
  run(async () => {
    qr = await apiFetch(`/tables/${selectedId}/pay-qr`, { method: 'POST' });
    await openTable(selectedId);   /* render lại với QR + nút xác nhận */
  });
}

/* Xác nhận đã nhận tiền & Đóng bàn: hoadon 'da_thanh_toan', phienban về 'trong' */
function confirmAndClose() {
  if (!bill) return;
  run(async () => {
    const result = await apiFetch(`/tables/${selectedId}/close`, { method: 'POST' });
    toast('Thanh toán thành công! Cảm ơn quý khách',
      `${result.message} Tổng tiền: ${fmtVND(result.tongtien)}.`);
    qr = null;
    bill = null;
    selectedId = null;
    await loadTables();
    await openTable(tables[0]?.id ?? null);
  });
}

/* ===================== SỰ KIỆN ===================== */
$('#table-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-table]');
  if (!btn) return;
  run(() => openTable(btn.dataset.table));
});

$('#detail-panel').addEventListener('click', e => {
  if (e.target.closest('#btn-create-qr')) createQR();
  else if (e.target.closest('#btn-confirm-pay')) confirmAndClose();
});

/* ===================== KHỞI TẠO ===================== */
run(loadTables);
