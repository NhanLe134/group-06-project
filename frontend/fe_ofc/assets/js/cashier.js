/* =====================================================================
   cashier.js — Màn hình Thu ngân (US-05) — kết nối Backend FastAPI
   ---------------------------------------------------------------------
   API (theo yêu cầu nối FE ↔ Backend/Supabase):
   - GET  /cashier/tables            → danh sách bàn + hóa đơn đang mở
   - GET  /orders/current?table_name → chi tiết món đợt 1, đợt 2 của bàn
   - POST /tables/{ban_id}/pay-qr → tạo QR cho các phiếu chưa tính tiền
   - POST /tables/{ban_id}/close → tạo hoadon + bàn về chờ dọn
   - POST /tables/{phienban_id}/close → hoadon 'da_thanh_toan', bàn về 'trong'
   QR trả về từ backend (SePay VietQR, ADR-N15).
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
let billViewMode = 'main'; /* 'main' = Hóa đơn chính (gộp món), 'detail' = Hóa đơn chi tiết (tách phiếu/trạng thái) */

const TRANGTHAI_LABEL = {
  cho_nau: 'Chờ nấu',
  dang_nau: 'Đang nấu',
  da_xong: 'Đã xong — chờ phục vụ',
  da_phuc_vu: 'Đã phục vụ',
};

/* ----- Hàm gộp món trùng nhau cho Hóa đơn chính ----- */
function getGroupedMainItems(items) {
  const map = new Map();
  (items || []).forEach(it => {
    const key = it.thucdon_id || it.tenmon;
    const gia = it.giaban || (it.soluong > 0 ? Math.round(it.thanhtien / it.soluong) : 0);
    if (!map.has(key)) {
      map.set(key, {
        tenmon: it.tenmon,
        soluong: 0,
        giaban: gia,
        thanhtien: 0,
      });
    }
    const entry = map.get(key);
    entry.soluong += it.soluong;
    entry.thanhtien += it.thanhtien;
  });
  return Array.from(map.values());
}

/* ----- Hàm nhóm món theo đợt gọi cho Hóa đơn chi tiết ----- */
function getRoundGroupedItems(items) {
  if (!items || !items.length) return [];

  const map = new Map();
  items.forEach(it => {
    let key;
    if (it.dot !== undefined && it.dot !== null) {
      key = `dot_${it.dot}`;
    } else if (it.giogoimon) {
      key = new Date(it.giogoimon).toISOString().slice(0, 16);
    } else {
      key = 'default';
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });

  const rounds = [];
  let index = 1;
  for (const [, roundItems] of map.entries()) {
    const firstWithTime = roundItems.find(x => x.giogoimon);
    const timeStr = firstWithTime?.giogoimon
      ? new Date(firstWithTime.giogoimon).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';
    const roundDot = roundItems[0]?.dot ?? index;
    const totalQty = roundItems.reduce((sum, item) => sum + item.soluong, 0);

    rounds.push({
      roundIndex: roundDot,
      timeStr,
      totalQty,
      items: roundItems,
    });
    index++;
  }
  return rounds;
}

/* ===================== TOAST ===================== */
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

  $('#table-list').innerHTML = tables.length ? tables.map(t => {
    /* Chỉ 3 trạng thái bàn (ADR-N14): đang phục vụ / sẵn sàng / chờ dọn */
    let pill, pillCls, cardCls;
    if (t.trangthai === '3') {
      pill = 'Chờ dọn'; pillCls = 'pill-amber'; cardCls = 'tc-amber';
    } else if (t.trangthai === '2') {
      pill = 'Đang phục vụ'; pillCls = 'pill-red-line'; cardCls = 'tc-red';
    } else {
      pill = 'Sẵn sàng'; pillCls = 'pill-green'; cardCls = 'tc-green';
    }
    const gio = t.gio_vao
      ? new Date(t.gio_vao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';
    return `
    <button class="tc-card ${cardCls} ${t.id === selectedId ? 'active' : ''}" data-table="${t.id}">
      <div class="tc-top">
        <span class="tc-name">${esc(t.tenban)}</span>
        <span class="tc-pill ${pillCls}">${pill}</span>
      </div>
      ${t.trangthai === '2' ? `
      <div class="tc-chips">
        <span class="tc-chip"><i class="ph-bold ph-clock"></i> ${gio}</span>
        <span class="tc-chip"><i class="ph-fill ph-money"></i> ${fmtVND(t.tongtien)}</span>
      </div>` : ''}
    </button>`;
  }).join('')
    : '<div class="table-empty">Chưa có phiên bàn nào.<br>Hãy để khách gọi món trước.</div>';
}

/* ===================== CHI TIẾT HÓA ĐƠN + THANH TOÁN ===================== */
async function openTable(id) {
  if (selectedId !== id) {
    billViewMode = 'main'; /* Chuyển bàn mới -> mặc định về Hóa đơn chính */
  }
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

  const headHTML = `
    <div class="detail-head">
      <div>
        <h2>${esc(t.tenban)} <span class="status-pill ${t.trangthai === '2' ? 'st-occupied' : 'st-empty'}">
          ${t.trangthai === '2' ? 'Đang ăn' : 'Trống'}</span></h2>
      </div>
    </div>`;
  panel.innerHTML = headHTML + `
    <div class="draft-empty"><i class="ph-duotone ph-spinner"></i><p>Đang tải hóa đơn...</p></div>`;

  /* Chi tiết món đợt 1, đợt 2 từ GET /orders/current */
  try {
    bill = await apiFetch(
      `/orders/current?table_name=${encodeURIComponent(t.tenban)}`,
    );
  } catch (e) {
    bill = null;
    panel.innerHTML = headHTML + `
      <div class="detail-empty">
        <i class="ph-duotone ph-armchair"></i>
        <p>${e.status === 404 ? `${esc(t.tenban)} đang trống hoặc chưa gọi món.` : esc(e.message)}</p>
      </div>`;
    return;
  }

  renderDetailPanel();
}

function renderDetailPanel() {
  const panel = $('#detail-panel');
  if (!bill) return;

  const isMainMode = billViewMode === 'main';
  const groupedItems = getGroupedMainItems(bill.items);
  const roundGroups = getRoundGroupedItems(bill.items);
  const unfinishedItems = (bill.items || []).filter(
    it => it.trangthai !== 'da_phuc_vu' && it.trangthai !== 'da_huy',
  );

  panel.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${esc(bill.table_name)} <span class="status-pill st-occupied">${isMainMode ? 'Đang ăn' : 'Chi tiết phiếu'}</span></h2>
      </div>
      <button class="btn-view-toggle" id="btn-toggle-bill-view">
        ${isMainMode
          ? '<i class="ph-bold ph-list-magnifying-glass"></i> Xem chi tiết phiếu'
          : '<i class="ph-bold ph-arrow-left"></i> Hóa đơn gốc'}
      </button>
    </div>

    <div class="bill">
      <table class="bill-table">
        ${isMainMode ? `
        <thead>
          <tr>
            <th>Món</th>
            <th class="num">SL</th>
            <th class="num">Đơn giá</th>
            <th class="num">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${groupedItems.map(it => `
          <tr>
            <td><b>${esc(it.tenmon || '')}</b></td>
            <td class="num"><b>${it.soluong}</b></td>
            <td class="num">${fmtVND(it.giaban)}</td>
            <td class="num">${fmtVND(it.thanhtien)}</td>
          </tr>`).join('')}
        </tbody>
        ` : `
        <thead>
          <tr>
            <th>MÓN</th>
            <th class="num">SL</th>
            <th class="num">THÀNH TIỀN</th>
            <th>TRẠNG THÁI</th>
          </tr>
        </thead>
        <tbody>
          ${roundGroups.map(r => `
          <tr class="round-head">
            <td colspan="4">
              <i class="ph-duotone ph-shopping-bag"></i> ĐỢT ${r.roundIndex} ${r.timeStr ? `— GỌI LÚC ${r.timeStr} · ` : '· '}${r.totalQty} MÓN
            </td>
          </tr>
          ${r.items.map(it => `
          <tr>
            <td>
              <b>${esc(it.tenmon || '')}</b>
              ${it.ghichu ? `<small style="display:block;color:var(--color-text-muted);">${esc(it.ghichu)}</small>` : ''}
            </td>
            <td class="num"><b>${it.soluong}</b></td>
            <td class="num"><b>${fmtVND(it.thanhtien)}</b></td>
            <td>
              <span class="status-pill ${it.trangthai === 'da_phuc_vu' ? 'st-served' : 'st-pending'}">
                ${TRANGTHAI_LABEL[it.trangthai] || it.trangthai}
              </span>
            </td>
          </tr>`).join('')}
          `).join('')}
        </tbody>
        `}
      </table>
      <div class="bill-foot">
        <span>${isMainMode ? 'Tổng số phần món:' : 'Tổng số món:'} <b style="${isMainMode ? '' : 'color: #EA580C;'}">${isMainMode ? groupedItems.reduce((n, it) => n + it.soluong, 0) : bill.items.reduce((n, it) => n + it.soluong, 0)}</b></span>
        <span>Tổng thành tiền: <b class="bill-total" style="${isMainMode ? '' : 'color: #EA580C;'}">${fmtVND(bill.tongtien)}</b></span>
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

  /* US-05: Chỉ tạo mã thanh toán khi tất cả các món đã hoàn thành ('da_phuc_vu' hoặc 'da_huy') */
  const unfinishedItems = (bill.items || []).filter(
    it => it.trangthai !== 'da_phuc_vu' && it.trangthai !== 'da_huy',
  );
  if (unfinishedItems.length > 0) {
    toast('Chưa thể tạo mã thanh toán',
      `Bàn ${bill.table_name} còn ${unfinishedItems.length} món chưa hoàn thành. Cần phục vụ xong tất cả các món trước khi tạo mã QR thanh toán.`, true);
    return;
  }

  run(async () => {
    qr = await apiFetch(`/tables/${selectedId}/pay-qr`, { method: 'POST' });
    renderDetailPanel();
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
    openTable(tables[0]?.id ?? null);
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
  else if (e.target.closest('#btn-toggle-bill-view')) {
    billViewMode = billViewMode === 'main' ? 'detail' : 'main';
    renderDetailPanel();
  }
});

/* ===================== REALTIME WEBSOCKET (SEPAY AUTO PAY) ===================== */
function initRealtimePayment() {
  const host = window.APP_CONFIG?.API_BASE_URL
    ? window.APP_CONFIG.API_BASE_URL.replace(/^http/, 'ws')
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8000`;

  try {
    const ws = new WebSocket(`${host}/ws/${encodeURIComponent('cashier:tables')}`);
    ws.onmessage = async e => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'PAYMENT_SUCCESS') {
          const { table_name, tongtien, gateway } = msg.payload || {};
          toast('Thanh toán SePay thành công!',
            `Bàn ${table_name || ''} đã chuyển khoản ${fmtVND(tongtien)} qua ${gateway || 'SePay'}. Hệ thống đã tự động đóng bàn.`, false);
          qr = null;
          bill = null;
          selectedId = null;
          await loadTables();
          openTable(tables[0]?.id ?? null);
        }
      } catch (err) {
        console.warn('Invalid WS payload:', err);
      }
    };
  } catch (err) {
    console.warn('Cannot connect payment WS:', err);
  }
}

/* ===================== KHỞI TẠO ===================== */
run(async () => {
  await loadTables();
  initRealtimePayment();
  /* Vào màn là mở sẵn hóa đơn bàn đầu tiên (Bàn 01) — panel phải không trống */
  openTable(tables[0]?.id ?? null);
});
