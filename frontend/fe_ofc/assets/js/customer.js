/* =====================================================================
   customer.js — Màn hình Khách hàng (Nhàn & Ny)
   US-01 (Nhàn): E-Menu (danh sách món + thanh phân loại) + Order Draft (giỏ hàng)
   ---------------------------------------------------------------------
   KẾT NỐI BACKEND (FastAPI + Supabase):
   - GET /menu → danh sách món (khóa món status = 'out_of_stock', REQ-09/BR-03).
   - Order Draft (thêm/sửa số lượng/ghi chú) vẫn quản lý ở client.
   - POST /orders → gửi bếp (đợt 1 tạo phiên + hóa đơn; đợt 2+ chèn thêm).
   - GET /orders/current?table_name=... → hóa đơn tạm tính cho US-09.
   - Mã bàn đọc từ URL ?table=... → sessionStorage → fallback 'Bàn 06'.
   Nghiệp vụ giữ nguyên:
   - BR-RO-02 / REQ-RO-09: món "Out of Stock" bị khóa ở E-Menu, không thêm được.
   - ADR-001: món OOS nằm trong draft → xám + nhãn "Món đã hết", khóa nút gửi.
   - BR-RO-03: chỉ gửi bếp sau Explicit Confirmation (modal xác nhận).
   US-02 (Ny): Trợ lý Voice AI (FAB micro, popup chat) sẽ bổ sung sau —
   các hàm render tách riêng để không ảnh hưởng phần này.
   ===================================================================== */

'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
/* Gán textContent an toàn — nếu phần tử không tồn tại trong HTML (bị xóa/tùy chọn)
 * thì bỏ qua thay vì văng TypeError làm hỏng cả luồng (A-N03, A-N17, A-N19) */
const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };

/* Escape chuỗi người dùng nhập (ghi chú món) trước khi nhúng vào HTML */
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ----- Gợi ý ghi chú nhanh (ADR-N01) — chạm để nối vào ô ghi chú ----- */
const NOTE_SUGGESTIONS = [
  'Không hành', 'Không rau', 'Ít cay', 'Nhiều cay',
  'Không đá', 'Ít ngọt', 'Chia đôi phần',
];

/* ----- Mã bàn: URL ?table=... → sessionStorage → mặc định 'Bàn 06' ----- */
const TABLE_KEY = 'current_table';
const tableName =
  new URLSearchParams(window.location.search).get('table')
  || sessionStorage.getItem(TABLE_KEY)
  || 'Bàn 06';
sessionStorage.setItem(TABLE_KEY, tableName);

/* ----- Thanh phân loại: nhóm động theo trường `category` (phanloai) từ API ----- */
const CAT_ORDER = ['Món chính', 'Set lẩu', 'Đồ uống'];   /* thứ tự nhóm ưu tiên */
const catSlug = label => 'cat-' + encodeURIComponent(label).replace(/%/g, '');

/* ----- State bản nháp (Order Draft — bản nháp DUY NHẤT của bàn) ----- */
let draft = [];            /* [{ id, qty, note }] */
let searchText = '';
let draftOpen = false;
let editingNoteIdx = null;   /* index món đang mở modal ghi chú, null = đóng */
let MENU = [];               /* danh sách món từ GET /menu */
let CATS = [];               /* nhóm phân loại suy ra từ MENU: [{ id, label }] */

/* ----- Truy vấn dữ liệu ----- */
const dishById = id => MENU.find(d => d.id === id);
const isOos = id => dishById(id)?.status === 'out_of_stock';
const draftUnits = () => draft.reduce((n, it) => n + it.qty, 0);
const draftTotal = () => draft.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);
const draftHasOos = () => draft.some(it => isOos(it.id));
/* Tổng số phần của 1 món đang nằm trong giỏ (gộp các dòng ghi chú khác nhau) */
const menuQty = id => draft.filter(it => it.id === id).reduce((n, it) => n + it.qty, 0);

/* Bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu */
const norm = t => String(t).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();

/* GET /menu → MENU + suy ra nhóm phân loại (thứ tự ưu tiên CAT_ORDER).
   ADR-N11: món listed = false (trangthaiban = false) → ẨN hẳn khỏi E-Menu;
   listed = true + hết tồn → vẫn hiện nhưng xám "Hết hàng" (card.oos). */
async function loadMenu() {
  MENU = (await apiFetch('/menu')).filter(d => d.listed !== false);
  const labels = [...new Set(MENU.map(d => d.category).filter(Boolean))];
  labels.sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
    return (ia === -1 ? CAT_ORDER.length : ia) - (ib === -1 ? CAT_ORDER.length : ib);
  });
  CATS = labels.map(label => ({ id: catSlug(label), label }));
  renderCategories();
  renderMenu();
}

/* ===================== RENDER ===================== */

function renderCategories() {
  $('#cat-row').innerHTML = `
    <button class="cat-chip active" data-cat="all">
      <i class="ph-bold ph-squares-four"></i> Tất cả
    </button>
    ${CATS.map(c => `
      <button class="cat-chip" data-cat="${c.id}">
        <i class="ph-bold ph-fork-knife"></i> ${esc(c.label)}
      </button>`).join('')}`;
}

/* Chip phân loại đang active (nền cam) — điều khiển bởi click + scroll-spy */
function setActiveChip(cat) {
  document.querySelectorAll('.cat-chip').forEach(ch =>
    ch.classList.toggle('active', ch.dataset.cat === cat));
}

function renderCard(d) {
  const oos = isOos(d.id);
  const q = menuQty(d.id);   /* ADR-N06: món đã trong giỏ → hiển thị bộ đếm − qty + */
  const thumb = d.image_url
    ? `<img class="menu-thumb-img" src="${esc(d.image_url)}" alt="${esc(d.name)}">`
    : '<i class="ph-duotone ph-fork-knife"></i>';
  return `
    <article class="menu-card ${oos ? 'oos' : ''}">
      <div class="menu-thumb">${thumb}</div>
      <div class="menu-info">
        <h3>${esc(d.name)}</h3>
        <p class="menu-price">${fmtVND(d.price)}</p>
        ${oos ? '<span class="badge-oos">Hết hàng</span>' : ''}
      </div>
      ${q === 0
        ? `<button class="btn-add" data-add="${d.id}" ${oos ? 'disabled' : ''}
            aria-label="Thêm ${d.name} vào đơn"
            title="${oos ? 'Món này hiện đã hết, vui lòng chọn món khác.' : 'Thêm vào Order Draft'}">
            <i class="ph-bold ph-plus"></i>
          </button>`
        : `<div class="qty-ctrl" aria-label="${d.name} đã có ${q} phần trong giỏ">
            <button data-dec-menu="${d.id}" aria-label="Giảm ${d.name}"><i class="ph-bold ph-minus"></i></button>
            <span class="qty-num">${q}</span>
            <button data-inc-menu="${d.id}" ${oos ? 'disabled' : ''} aria-label="Thêm ${d.name}"><i class="ph-bold ph-plus"></i></button>
          </div>`}
    </article>`;
}

/* ADR-N09: danh sách món chia nhóm theo phân loại (Món chính → Set lẩu → Đồ uống),
   mỗi nhóm có tiêu đề riêng; tìm kiếm lọc trong từng nhóm, nhóm trống thì ẩn */
function renderMenu() {
  const kw = norm(searchText);
  const match = d => !kw || norm(d.name).includes(kw);

  const sections = CATS.map(c => {
    const dishes = MENU.filter(d => d.category === c.label && match(d));
    if (!dishes.length) return '';
    return `
    <section class="cat-section" id="cat-section-${c.id}" data-cat="${c.id}">
      <h3 class="cat-heading">${esc(c.label)}</h3>
      <div class="menu-grid">${dishes.map(renderCard).join('')}</div>
    </section>`;
  }).join('');

  $('#menu-grid').innerHTML = sections || `
    <div class="menu-empty">
      <i class="ph-duotone ph-magnifying-glass"></i>
      <p>Không tìm thấy món phù hợp. Thử từ khóa khác nhé!</p>
    </div>`;
  updateActiveChip();
}

/* Hiệu ứng tải menu: khung thẻ món nhấp nháy (shimmer) trong lúc chờ GET /menu */
function renderMenuSkeleton() {
  $('#menu-grid').innerHTML = `
    <div class="menu-loading-note">
      <i class="ph-bold ph-circle-notch"></i> Đang tải thực đơn...
    </div>
    <div class="menu-grid">
      ${Array.from({ length: 6 }, () => `
        <div class="sk-card" aria-hidden="true">
          <div class="sk-thumb"></div>
          <div class="sk-lines">
            <div class="sk-line"></div>
            <div class="sk-line w60"></div>
          </div>
        </div>`).join('')}
    </div>`;
}

/* Scroll-spy: lướt đến nhóm nào thì chip phân loại đó active (nền cam) */
function updateActiveChip() {
  const sections = [...document.querySelectorAll('.cat-section')]
    .filter(s => s.offsetHeight > 0);           /* bỏ nhóm bị ẩn do tìm kiếm */
  const probe = 160;                             /* topbar + hàng tiêu đề */
  let active = 'all';
  for (const s of sections) {
    if (s.getBoundingClientRect().top <= probe) active = s.dataset.cat;
  }
  setActiveChip(active);
}
let spyTick = false;
window.addEventListener('scroll', () => {
  if (spyTick) return;
  spyTick = true;
  requestAnimationFrame(() => { spyTick = false; updateActiveChip(); });
}, { passive: true });

function renderStickyBar() {
  const units = draftUnits();
  /* draft-pill là tùy chọn — có thể bị bỏ khỏi HTML, không crash khi thiếu */
  const pill = $('#draft-pill');
  if (pill) pill.classList.toggle('has-items', units > 0);

  $('#sb-info').innerHTML = units
    ? `<b>${units} món trong bản nháp</b>
       <span>${fmtVND(draftTotal())}${draftHasOos()
         ? ' · <span class="sb-warn">có món hết hàng</span>' : ''}</span>`
    : '<span>Chưa có món nào trong bản nháp</span>';
  $('#btn-open-draft').innerHTML =
    `<i class="ph-duotone ph-shopping-cart"></i> Xem đơn${units ? ` (${units})` : ''}`;
  $('#btn-open-draft').disabled = false;
}

function renderDraft() {
  const body = $('#draft-body');
  const footer = $('#draft-footer');

  if (!draft.length) {
    body.innerHTML = `
      <div class="draft-empty">
        <i class="ph-duotone ph-shopping-cart"></i>
        <p>Bàn chưa chọn món. Hãy gọi món qua trợ lý hoặc chọn từ menu.</p>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  const hasOos = draftHasOos();
  body.innerHTML = `
    ${hasOos ? `
    <div class="adr-warn" role="alert">
      <i class="ph-fill ph-warning-circle"></i>
      <p>Dạ món ${esc(dishById(draft.find(it => isOos(it.id)).id).name)} vừa hết hàng, anh/chị vui lòng bỏ món khỏi danh sách để chốt đơn nhé!</p>
    </div>` : ''}
    ${draft.map((it, i) => {
      const d = dishById(it.id), oos = isOos(it.id);
      return `
      <div class="d-item ${oos ? 'oos' : ''}">
        <div class="d-info">
          <b>${d.name}</b>
          <button class="d-note ${it.note ? 'has-note' : ''}" data-note="${i}"
            aria-label="${it.note ? 'Sửa' : 'Thêm'} ghi chú cho ${d.name}">
            <i class="ph-bold ${it.note ? 'ph-note-pencil' : 'ph-plus'}"></i>
            ${it.note ? esc(it.note) : 'Ghi chú món'}
          </button>
          ${oos ? '<span class="badge-draft-oos">Món đã hết</span>' : ''}
        </div>
        <div class="d-price">${fmtVND(d.price)}</div>
        <div class="d-ctrl">
          <button data-dec="${i}" aria-label="Giảm ${d.name}"><i class="ph-bold ph-minus"></i></button>
          <span class="d-qty">${it.qty}</span>
          <button data-inc="${i}" ${oos ? 'disabled' : ''} aria-label="Thêm ${d.name}"><i class="ph-bold ph-plus"></i></button>
        </div>
      </div>`;
    }).join('')}`;

  footer.innerHTML = `
    <div class="d-total"><span>Tổng tạm tính</span><b>${fmtVND(draftTotal())}</b></div>
    <button class="btn-primary btn-send" data-open-confirm ${(!draftUnits() || hasOos) ? 'disabled' : ''}>
      ${hasOos
        ? '<i class="ph-duotone ph-lock-key"></i> Xác nhận gửi bếp — có món hết hàng'
        : `<i class="ph-duotone ph-bell-ringing"></i> Xác nhận gửi bếp`}
    </button>`;
}

/* ===================== HÀNH VI ===================== */

function addToDraft(id, qty = 1, note = '') {
  const found = draft.find(it => it.id === id && (it.note || '') === note);
  if (found) found.qty += qty;
  else draft.push({ id, qty, note });
  renderStickyBar();
}

function openDraft() {
  draftOpen = true;
  renderDraft();
  $('#draft-sheet').classList.add('open');
  $('#sheet-overlay').classList.add('active');
}
function closeDraft() {
  draftOpen = false;
  $('#draft-sheet').classList.remove('open');
  $('#sheet-overlay').classList.remove('active');
}

function openConfirm() {
  if (!draft.length || draftHasOos()) return;   /* ADR-001 — chặn thêm 1 lớp */
  $('#confirm-text').textContent =
    `Xác nhận gửi ${draftUnits()} món xuống bếp? Đơn sau khi gửi sẽ không thể tự hủy trên máy.`;
  /* confirm-total là tùy chọn (có thể bị bỏ khỏi HTML) */
  setText('#confirm-total', fmtVND(draftTotal()));
  $('#confirm-modal').style.display = 'grid';
}
function closeConfirm() { $('#confirm-modal').style.display = 'none'; }

async function sendToKitchen() {
  if (!draft.length || draftHasOos()) return;
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        table_name: tableName,
        items: draft.map(x => ({
          thucdon_id: x.id,       /* UUID món trong thucdon (Supabase) */
          soluong: x.qty,
          ghichu: x.note || null,
        })),
      }),
    });
  } catch (e) {
    closeConfirm();
    showApiError(e);
    return;
  }
  draft = [];
  closeConfirm();
  closeDraft();
  renderStickyBar();
  renderMenu();   /* ADR-N06: giỏ đã trống → bộ đếm trên thẻ món về lại nút "+" cho vòng gọi mới */
  /* success-code / success-total / success-table là tùy chọn — popup vẫn phải mở dù phần tử bị xóa */
  setText('#success-code', `Hóa đơn của ${tableName}`);
  setText('#success-total', fmtVND(draftTotal()));
  setText('#success-table', tableName);
  $('#success-modal').style.display = 'grid';
}

/* ----- US-09: Trang xem Hóa đơn tạm tính (ADR-N05) — dữ liệu GET /orders/current ----- */
const TRANGTHAI_LABEL = {
  cho_nau: 'Chờ nấu',
  dang_nau: 'Đang nấu',
  da_xong: 'Đã xong — chờ phục vụ',
  da_phuc_vu: 'Đã phục vụ',
};

function buildBillTable(bill) {
  const rows = bill.items.map(it => {
    const done = it.trangthai === 'da_phuc_vu';
    return `
      <tr>
        <td>${esc(it.tenmon || '')}${it.ghichu ? `<small>${esc(it.ghichu)}</small>` : ''}</td>
        <td class="num">${it.soluong}</td>
        <td class="num">${fmtVND(it.thanhtien)}</td>
        <td><span class="status-pill ${done ? 'st-served' : 'st-pending'}">
          ${TRANGTHAI_LABEL[it.trangthai] || it.trangthai}</span></td>
      </tr>`;
  }).join('');
  const totalQty = bill.items.reduce((n, it) => n + it.soluong, 0);
  return `
    <div class="bill">
      <table class="bill-table">
        <thead><tr><th>Món</th><th class="num">SL</th><th class="num">Thành tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="bill-foot">
        <span>Tổng số món: <b>${totalQty}</b></span>
        <span>Tổng thành tiền: <b>${fmtVND(bill.tongtien)}</b></span>
      </div>
    </div>`;
}

/* US-09 — tải hóa đơn tạm tính từ GET /orders/current, hiển thị trang hóa đơn */
let currentBill = null;   /* OrderCurrentOut từ API */

async function openBillView() {
  const body = $('#bill-body');
  body.innerHTML = `
    <div class="draft-empty">
      <i class="ph-duotone ph-spinner"></i>
      <p>Đang tải hóa đơn...</p>
    </div>`;
  $('#bill-view').hidden = false;
  try {
    currentBill = await apiFetch(
      `/orders/current?table_name=${encodeURIComponent(tableName)}`,
    );
  } catch (e) {
    currentBill = null;
    body.innerHTML = `
      <div class="draft-empty">
        <i class="ph-duotone ph-receipt"></i>
        <p>${e.status === 404
          ? 'Bàn chưa gọi món nào. Hãy chọn món từ E-Menu trước nhé!'
          : esc(e.message)}</p>
        ${e.status !== 404 ? '<button class="btn-primary" onclick="openBillView()">Thử lại</button>' : ''}
      </div>`;
    $('#btn-request-pay').disabled = true;
    return;
  }

  body.innerHTML = buildBillTable(currentBill);

  /* US-09 AC2/AC3: còn món chưa phục vụ → nút khóa + hộp cảnh báo vàng;
     tất cả 'da_phuc_vu' → bật nút xanh */
  const box = $('#bill-warn-box');
  if (box) box.remove();
  if (!currentBill.all_served) {
    $('#btn-request-pay').disabled = true;
    body.insertAdjacentHTML(
      'afterbegin',
      `<div class="adr-warn" style="margin-bottom:14px;">
        <i class="ph-fill ph-warning-circle"></i>
        <p>Vẫn còn món đang được chế biến/chờ bưng. Vui lòng đợi nhân viên phục vụ đủ món rồi yêu cầu thanh toán nhé!</p>
      </div>`,
    );
  } else {
    $('#btn-request-pay').disabled = false;
  }
}

/* AC2: còn món chờ → cảnh báo; AC3: đã phục vụ hết → hướng dẫn ra quầy +
   gửi tín hiệu thông báo thu ngân (hiện tại là toast; sau này qua WebSocket) */
function requestPayment() {
  if (!currentBill) return;
  const icon = $('#pay-icon'), title = $('#pay-title'), msg = $('#pay-msg');
  if (!currentBill.all_served) {
    icon.className = 'modal-icon warn';
    icon.innerHTML = '<i class="ph-fill ph-warning-circle"></i>';
    title.textContent = 'Chưa thể thanh toán';
    msg.textContent = 'Bạn còn món chờ phục vụ. Vui lòng đợi nhân viên bưng món ra đủ, kiểm tra lại hóa đơn rồi hãy yêu cầu thanh toán nhé. Nếu cần hỗ trợ gấp, xin gọi nhân viên!';
  } else {
    icon.className = 'modal-icon green';
    icon.innerHTML = '<i class="ph-bold ph-check"></i>';
    title.textContent = 'Đã gửi yêu cầu thanh toán';
    msg.textContent = 'Đã báo thu ngân chuẩn bị hóa đơn. Vui lòng đến quầy thu ngân để thanh toán. Xin cảm ơn!';
  }
  $('#pay-modal').style.display = 'grid';
}

/* ----- Ghi chú từng món (ADR-N01) ----- */
function openNoteEditor(idx) {
  const it = draft[idx];
  if (!it) return;
  editingNoteIdx = idx;
  $('#note-title').textContent = `Ghi chú — ${dishById(it.id).name}`;
  $('#note-input').value = it.note || '';
  renderNoteChips();
  $('#note-modal').style.display = 'grid';
}
function closeNoteEditor() {
  editingNoteIdx = null;
  $('#note-modal').style.display = 'none';
}
function renderNoteChips() {
  const current = $('#note-input').value.toLowerCase();
  $('#note-chips').innerHTML = NOTE_SUGGESTIONS.map(s => `
    <button type="button" class="note-chip ${current.includes(s.toLowerCase()) ? 'picked' : ''}"
      data-note-chip="${esc(s)}">
      ${current.includes(s.toLowerCase())
        ? '<i class="ph-bold ph-check"></i>' : '<i class="ph-bold ph-plus"></i>'} ${s}
    </button>`).join('');
}
/* Chạm chip → nối nội dung vào ô ghi chú (tránh trùng), chạm lại → bỏ khỏi ô */
function toggleNoteChip(text) {
  const input = $('#note-input');
  const parts = input.value.split(',').map(p => p.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const i = parts.findIndex(p => p.toLowerCase() === lower);
  if (i >= 0) parts.splice(i, 1); else parts.push(text);
  input.value = parts.join(', ');
  renderNoteChips();
}
function saveNote() {
  if (editingNoteIdx === null || !draft[editingNoteIdx]) return closeNoteEditor();
  draft[editingNoteIdx].note = $('#note-input').value.trim();
  closeNoteEditor();
  renderDraft();
}

/* ===================== SỰ KIỆN ===================== */

/* Chip phân loại = điều hướng: cuộn mượt tới nhóm; scroll-spy tự cập nhật active */
$('#cat-row').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  const cat = btn.dataset.cat;
  if (cat === 'all') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('cat-section-' + cat)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setActiveChip(cat);
});

$('#search-input').addEventListener('input', e => {
  searchText = e.target.value;
  renderMenu();
});

$('#menu-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  const incM = e.target.closest('[data-inc-menu]');
  const decM = e.target.closest('[data-dec-menu]');

  if (btn && !btn.disabled) {                    /* thêm lần đầu (ADR-N06) */
    addToDraft(btn.dataset.add);
  } else if (incM && !incM.disabled) {           /* tăng từ bộ đếm trên thẻ */
    addToDraft(incM.dataset.incMenu);
  } else if (decM) {                             /* giảm: ưu tiên dòng không ghi chú */
    const id = decM.dataset.decMenu;
    const lines = draft.map((it, i) => ({ it, i })).filter(x => x.it.id === id);
    const target = lines.find(x => !x.it.note) || lines[lines.length - 1];
    if (!target) return;
    target.it.qty -= 1;
    if (target.it.qty <= 0) draft.splice(target.i, 1);
  } else return;

  renderMenu();          /* cập nhật lại nút "+" ↔ bộ đếm */
  renderStickyBar();
  if (draftOpen) renderDraft();
});

$('#btn-open-draft').addEventListener('click', openDraft);
$('#btn-close-draft').addEventListener('click', closeDraft);
$('#sheet-overlay').addEventListener('click', closeDraft);

$('#draft-body').addEventListener('click', e => {
  const noteBtn = e.target.closest('[data-note]');
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  if (noteBtn) { openNoteEditor(+noteBtn.dataset.note); return; }
  if (inc && !inc.disabled) { draft[+inc.dataset.inc].qty += 1; }
  else if (dec) {
    const it = draft[+dec.dataset.dec];
    it.qty -= 1;
    if (it.qty <= 0) draft.splice(+dec.dataset.dec, 1);   /* giảm về 0 = gỡ món */
  }
  else return;
  renderDraft();
  renderStickyBar();
  renderMenu();   /* đồng bộ bộ đếm số lượng trên thẻ món (ADR-N06) */
});

/* Modal ghi chú món */
$('#note-chips').addEventListener('click', e => {
  const chip = e.target.closest('[data-note-chip]');
  if (chip) toggleNoteChip(chip.dataset.noteChip);
});
$('#btn-note-save').addEventListener('click', saveNote);
$('#btn-note-clear').addEventListener('click', () => {
  if (editingNoteIdx !== null && draft[editingNoteIdx]) draft[editingNoteIdx].note = '';
  closeNoteEditor();
  renderDraft();
});

$('#draft-footer').addEventListener('click', e => {
  if (e.target.closest('[data-open-confirm]')) openConfirm();
});
$('#btn-cancel-confirm').addEventListener('click', closeConfirm);
$('#btn-confirm-send').addEventListener('click', sendToKitchen);
$('#btn-close-success').addEventListener('click', () => {
  $('#success-modal').style.display = 'none';
});

/* ----- Trang hóa đơn + yêu cầu thanh toán ----- */
$('#btn-view-bill').addEventListener('click', openBillView);
$('#btn-close-bill').addEventListener('click', () => { $('#bill-view').hidden = true; });
$('#btn-request-pay').addEventListener('click', requestPayment);
$('#btn-pay-close').addEventListener('click', () => { $('#pay-modal').style.display = 'none'; });

/* Lỗi API (mất kết nối, món hết hàng...) → banner đỏ trên đầu danh sách */
function showApiError(e) {
  $('#menu-grid').insertAdjacentHTML(
    'afterbegin',
    `<div class="adr-warn" role="alert" style="margin:0 0 14px;">
      <i class="ph-fill ph-warning-circle"></i>
      <p>${esc(e.message || 'Có lỗi xảy ra. Vui lòng thử lại.')}</p>
    </div>`,
  );
}

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
