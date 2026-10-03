/* =====================================================================
   cashier.js — Màn hình Thu ngân (US-05: Thanh toán toàn bộ qua QR)
   ---------------------------------------------------------------------
   Nghiệp vụ theo US-05 (đã cập nhật theo ADR-N08 — bỏ chia bill):
   - AC1: Tạo mã thanh toán → 1 mã QR tương ứng tổng hóa đơn (REQ-04).
   - AC2 (cũ AC4): Xác nhận đã nhận tiền → trạng thái paid + thông báo
     thành công (mock thay webhook cổng thanh toán).
   - AC3 (cũ AC5): Cổng thanh toán lỗi → toast vàng "Không thể khởi tạo
     mã QR thanh toán. Vui lòng kiểm tra lại mạng hoặc thử lại", giữ
     nguyên hóa đơn (mô phỏng bằng công tắc).
   - Nút "Đóng bàn" chỉ hiển thị khi toàn bộ đã thanh toán (ADR-N08).
   Chia bill (REQ-03) đã cắt khỏi phạm vi — xem ADR-N08 trong
   vault/08-Decisions/decision_log_Nhan.md.
   QR hiện tại là mock (qrserver.com) — khi có backend sẽ thay bằng QR
   động MoMo/VNPAY Sandbox theo REQ-04/BR-RO-06.
   ===================================================================== */

'use strict';

const $ = (sel, el = document) => el.querySelector(sel);

/* Gán textContent an toàn — phần tử tùy chọn bị xóa khỏi HTML thì bỏ qua */
const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };

/* ----- Dữ liệu mock bàn + hóa đơn (khi có backend: GET /orders?tableId=...) ----- */
const TABLES = [
  { id: 'B02', name: 'Bàn 02', status: 'empty', guests: '' },
  { id: 'B03', name: 'Bàn 03', status: 'occupied', guests: 'Chị Hồng + bạn',
    order: { code: '#B03-002', items: [{ id: 'M06', qty: 1 }, { id: 'M05', qty: 2 }], paid: false } },
  { id: 'B05', name: 'Bàn 05', status: 'empty', guests: '' },
  { id: 'B06', name: 'Bàn 06', status: 'occupied', guests: 'Anh Tuấn + gia đình 4 người',
    order: { code: '#B06-001', items: [{ id: 'M01', qty: 2 }, { id: 'M03', qty: 1 }, { id: 'M05', qty: 4 }], paid: false } },
];

let selectedTable = 'B06';   /* bàn đang mở chi tiết */
let payers = [];             /* [{ label, amount, paid }] — người chia + trạng thái */
let qrCreated = false;       /* đã tạo mã QR cho lần hiện tại chưa */

const dishById = id => CATALOG.find(d => d.id === id);
const orderTotal = o => o.items.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);

/* ===================== TOAST (AC4/AC5) ===================== */
function toast(title, body, warn = false) {
  const box = document.createElement('div');
  box.className = 'toast' + (warn ? ' toast-warn' : ' toast-ok');
  box.innerHTML = `
    <p class="toast-title"><i class="ph-fill ${warn ? 'ph-warning-circle' : 'ph-check-circle'}"></i> ${title}</p>
    <p class="toast-body">${body}</p>`;
  $('#toast-container').appendChild(box);
  setTimeout(() => box.remove(), 4500);
}

/* ===================== DANH SÁCH BÀN ===================== */
function renderTableList() {
  const occupied = TABLES.filter(t => t.status === 'occupied').length;
  setText('#occupied-count', occupied);

  $('#table-list').innerHTML = TABLES.map(t => {
    const total = t.order ? orderTotal(t.order) : 0;
    return `
    <button class="table-item ${t.id === selectedTable ? 'active' : ''} ${t.status}"
      data-table="${t.id}">
      <span class="ti-name">${t.name}</span>
      <span class="ti-info">
        ${t.status === 'occupied'
          ? `<span class="status-pill st-occupied">Đang ăn</span>
             <b class="ti-total">${fmtVND(total)}</b>`
          : '<span class="status-pill st-empty">Trống</span>'}
      </span>
      <i class="ph-bold ph-caret-right ti-arrow"></i>
    </button>`;
  }).join('');
}

/* ===================== CHI TIẾT HÓA ĐƠN + THANH TOÁN ===================== */
function renderDetail() {
  const panel = $('#detail-panel');
  const t = TABLES.find(x => x.id === selectedTable);

  /* Bàn trống */
  if (!t || t.status !== 'occupied' || !t.order) {
    panel.innerHTML = `
      <div class="detail-empty">
        <i class="ph-duotone ph-armchair"></i>
        <p>${t ? `${t.name} đang trống. Chọn bàn đang ăn để xem hóa đơn.` : 'Chọn một bàn để xem chi tiết.'}</p>
      </div>`;
    return;
  }

  const total = orderTotal(t.order);
  const allPaid = payers.length > 0 && payers.every(p => p.paid);
  const canClose = allPaid;

  panel.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${t.name} <span class="status-pill st-occupied">Đang ăn</span></h2>
        <p>${t.guests} · Đơn <b>${t.order.code}</b></p>
      </div>
    </div>

    <div class="bill">
      <table class="bill-table">
        <thead><tr><th>Món</th><th class="num">SL</th><th class="num">Thành tiền</th></tr></thead>
        <tbody>
          ${t.order.items.map(it => {
            const d = dishById(it.id);
            return `<tr>
              <td>${d.name}</td>
              <td class="num">${it.qty}</td>
              <td class="num">${fmtVND(d.price * it.qty)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div class="bill-foot">
        <span>Tổng số món: <b>${t.order.items.reduce((n, it) => n + it.qty, 0)}</b></span>
        <span>Tổng thành tiền: <b class="bill-total">${fmtVND(total)}</b></span>
      </div>
    </div>

    ${t.order.paid ? `
    <div class="paid-banner">
      <i class="ph-fill ph-check-circle"></i>
      <div>
        <b>Đã thanh toán — hoàn tất</b>
        <p>Bàn đã đóng an toàn. Cảm ơn quý khách!</p>
      </div>
    </div>` : `
    <div class="pay-box">
      <h4><i class="ph-duotone ph-credit-card"></i> Thanh toán (US-05)</h4>
      <p class="pay-hint">${qrCreated ? 'Mã thanh toán đã được tạo — quét QR để thanh toán.' : 'Thanh toán toàn bộ hóa đơn qua mã QR.'}</p>
      ${!qrCreated ? `
      <button class="btn-primary btn-create" id="btn-create-qr">
        <i class="ph-duotone ph-qr-code"></i> Tạo mã thanh toán
      </button>` : ''}

      <div id="qr-area">${qrCreated ? renderPayers() : ''}</div>

      ${canClose ? `
      <button class="btn-close-table" id="btn-close-table">
        <i class="ph-duotone ph-broom"></i> Đóng bàn (Close)
      </button>` : ''}
    </div>`}
  `;
}

/* Danh sách người thanh toán + QR (AC2: làm tròn dư tự động) */
function renderPayers() {
  return `<div class="payer-list">${payers.map((p, i) => `
    <div class="payer-card ${p.paid ? 'paid' : ''}">
      <div class="payer-head">
        <b><i class="ph-bold ph-user"></i> ${p.label}</b>
        <span class="payer-amount">${fmtVND(p.amount)}</span>
        <span class="status-pill ${p.paid ? 'st-ready' : 'st-pending'}">${p.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
      </div>
      <div class="payer-body">
        <img class="qr-img" alt="Mã QR ${p.label}"
          src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent('SMARTORDER|PAY|' + selectedTable + '|' + p.amount)}"
          onerror="this.outerHTML='<div class=\\'qr-fallback\\'><i class=\\'ph-duotone ph-qr-code\\'></i><span>Không tải được QR</span></div>'">
        ${p.paid
          ? '<div class="pay-done"><i class="ph-fill ph-check-circle"></i> Đã xác nhận thanh toán</div>'
          : `<button class="btn-confirm-pay" data-pay="${i}">
               <i class="ph-bold ph-hand-coins"></i> Xác nhận đã nhận tiền
             </button>`}
      </div>
    </div>`).join('')}</div>
    ${payers.every(p => p.paid) ? `
    <div class="paid-banner">
      <i class="ph-fill ph-check-circle"></i>
      <div><b>Thanh toán thành công! Cảm ơn quý khách</b>
      <p>Toàn bộ hóa đơn đã được thanh toán — có thể đóng bàn.</p></div>
    </div>` : ''}`;
}

/* ===================== HÀNH VI ===================== */
function createQR() {
  const t = TABLES.find(x => x.id === selectedTable);
  const total = orderTotal(t.order);
  payers = [{ label: 'Toàn bộ hóa đơn', amount: total, paid: false }];

  /* AC5 — mô phỏng cổng thanh toán lỗi: toast vàng + giữ nguyên hóa đơn */
  if ($('#err-sim').checked) {
    toast('Không thể khởi tạo mã QR thanh toán.',
      'Vui lòng kiểm tra lại mạng hoặc thử lại. Hóa đơn của bạn vẫn được giữ nguyên.', true);
    return;
  }

  qrCreated = true;
  renderDetail();
  toast('Đã tạo mã thanh toán', `Quét QR để thanh toán ${fmtVND(total)}.`);
}

function confirmPay(idx) {
  if (!payers[idx] || payers[idx].paid) return;
  payers[idx].paid = true;
  renderDetail();
  const done = payers.every(p => p.paid);
  toast(done ? 'Thanh toán thành công! Cảm ơn quý khách'
             : 'Đã xác nhận thanh toán.',
    done ? `Có thể đóng bàn ${selectedTable}.`
         : 'Cổng thanh toán xác nhận (mock webhook).');
}

function closeTable() {
  const t = TABLES.find(x => x.id === selectedTable);
  if (!t || !t.order || !payers.every(p => p.paid)) return;   /* chỉ đóng khi đã đủ tiền */
  t.status = 'empty';
  t.guests = '';
  t.order = null;
  payers = [];
  qrCreated = false;
  renderTableList();
  renderDetail();
  toast('Đã đóng bàn ' + t.name, 'Bàn trở về trạng thái trống, sẵn sàng đón khách mới.');
}

/* ===================== SỰ KIỆN ===================== */
$('#table-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-table]');
  if (!btn) return;
  selectedTable = btn.dataset.table;
  payers = [];
  qrCreated = false;
  renderTableList();
  renderDetail();
});

$('#detail-panel').addEventListener('click', e => {
  if (e.target.closest('#btn-create-qr')) createQR();
  else if (e.target.closest('[data-pay]')) confirmPay(Number(e.target.closest('[data-pay]').dataset.pay));
  else if (e.target.closest('#btn-close-table')) closeTable();
});

/* Đổi chế độ thanh toán → bật/tắt ô số người, xóa QR cũ */
$('#detail-panel').addEventListener('change', e => {
  if (e.target.name === 'pay-mode') {
    payers = [];
    qrCreated = false;
    renderDetail();
  }
});

/* ===================== KHỞI TẠO ===================== */
renderTableList();
renderDetail();
