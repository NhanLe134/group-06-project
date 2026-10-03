/* =====================================================================
   customer.js — Màn hình Khách hàng (Nhàn & Ny)
   US-01 (Nhàn): E-Menu (danh sách món + thanh phân loại) + Order Draft (giỏ hàng)
   ---------------------------------------------------------------------
   Nghiệp vụ chép từ prototype (frontend/prototype/js/app.js):
   - BR-RO-01: giá chỉ đọc từ CATALOG (mock-data.js) — hiển thị qua fmtVND().
   - BR-RO-02 / REQ-RO-09: món "Out of Stock" bị khóa ở E-Menu, không thêm được.
   - ADR-001: món OOS nằm trong draft → xám + nhãn "Món đã hết", khóa nút gửi.
   - BR-RO-03: chỉ gửi bếp sau Explicit Confirmation (modal xác nhận).
   US-02 (Ny): Trợ lý Voice AI (FAB micro, popup chat) sẽ bổ sung sau —
   các hàm render tách riêng để không ảnh hưởng phần này.
   ===================================================================== */

'use strict';

const $ = (sel, el = document) => el.querySelector(sel);

/* Escape chuỗi người dùng nhập (ghi chú món) trước khi nhúng vào HTML */
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ----- Gợi ý ghi chú nhanh (ADR-N01) — chạm để nối vào ô ghi chú ----- */
const NOTE_SUGGESTIONS = [
  'Không hành', 'Không rau', 'Ít cay', 'Nhiều cay',
  'Không đá', 'Ít ngọt', 'Chia đôi phần',
];

/* ----- Thanh phân loại (US-01): phân nhóm CATALOG theo id món ----- */
const CATEGORY_MAP = {
  M01: 'main', M02: 'main', M03: 'main', M04: 'main',
  M05: 'drink', M06: 'set',
};
const CATEGORIES = [
  { id: 'all',   label: 'Tất cả',    icon: 'ph-squares-four' },
  { id: 'main',  label: 'Món chính', icon: 'ph-bowl-food' },
  { id: 'drink', label: 'Đồ uống',   icon: 'ph-brandy' },
  { id: 'set',   label: 'Set lẩu',   icon: 'ph-users-three' },
];

/* ----- State bản nháp (Order Draft — bản nháp DUY NHẤT của bàn) ----- */
let draft = [];            /* [{ id, qty, note }] */
let activeCat = 'all';
let searchText = '';
let draftOpen = false;
let orderSeq = 1;
let editingNoteIdx = null;   /* index món đang mở modal ghi chú, null = đóng */

/* ----- Truy vấn dữ liệu ----- */
const dishById = id => CATALOG.find(d => d.id === id);
const isOos = id => dishById(id).status === 'Out of Stock';
const draftUnits = () => draft.reduce((n, it) => n + it.qty, 0);
const draftTotal = () => draft.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);
const draftHasOos = () => draft.some(it => isOos(it.id));

/* Bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu */
const norm = t => String(t).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();

/* ===================== RENDER ===================== */

function renderCategories() {
  $('#cat-row').innerHTML = CATEGORIES.map(c => `
    <button class="cat-chip ${c.id === activeCat ? 'active' : ''}" data-cat="${c.id}">
      <i class="ph-bold ${c.icon}"></i> ${c.label}
    </button>`).join('');
}

function renderMenu() {
  const kw = norm(searchText);
  const dishes = CATALOG.filter(d => {
    const inCat = activeCat === 'all' || CATEGORY_MAP[d.id] === activeCat;
    const inSearch = !kw || norm(d.name).includes(kw);
    return inCat && inSearch;
  });

  $('#menu-grid').innerHTML = dishes.length ? dishes.map(d => {
    const oos = isOos(d.id);
    return `
    <article class="menu-card ${oos ? 'oos' : ''}">
      <div class="menu-thumb">${d.emoji}</div>
      <div class="menu-info">
        <h3>${d.name}${d.bestseller
          ? ' <span class="badge-hot"><i class="ph-fill ph-fire"></i>Bán chạy</span>' : ''}</h3>
        <p class="menu-price">${fmtVND(d.price)}</p>
        ${oos ? '<span class="badge-oos">Hết hàng</span>' : ''}
      </div>
      <button class="btn-add" data-add="${d.id}" ${oos ? 'disabled' : ''}
        aria-label="Thêm ${d.name} vào đơn"
        title="${oos ? 'Món này hiện đã hết, vui lòng chọn món khác.' : 'Thêm vào Order Draft'}">
        <i class="ph-bold ph-plus"></i>
      </button>
    </article>`;
  }).join('') : `
    <div class="menu-empty">
      <i class="ph-duotone ph-magnifying-glass"></i>
      <p>Không tìm thấy món phù hợp. Thử từ khóa khác nhé!</p>
    </div>`;
}

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
        <p>${COPY.EMPTY}</p>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  const hasOos = draftHasOos();
  body.innerHTML = `
    ${hasOos ? `
    <div class="adr-warn" role="alert">
      <i class="ph-fill ph-warning-circle"></i>
      <p>${COPY.ADR001(dishById(draft.find(it => isOos(it.id)).id).name)}</p>
    </div>` : ''}
    ${draft.map((it, i) => {
      const d = dishById(it.id), oos = isOos(it.id);
      return `
      <div class="d-item ${oos ? 'oos' : ''}">
        <div class="d-info">
          <b>${it.qty}× ${d.name}</b>
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
          <button class="d-remove" data-remove="${i}" aria-label="Gỡ ${d.name}"><i class="ph-duotone ph-trash"></i></button>
        </div>
      </div>`;
    }).join('')}`;

  footer.innerHTML = `
    <div class="d-total"><span>Tổng tạm tính</span><b>${fmtVND(draftTotal())}</b></div>
    <button class="btn-primary btn-send" data-open-confirm ${(!draftUnits() || hasOos) ? 'disabled' : ''}>
      ${hasOos
        ? '<i class="ph-duotone ph-lock-key"></i> Xác nhận gửi bếp — có món hết hàng'
        : `<i class="ph-duotone ph-bell-ringing"></i> Xác nhận gửi bếp · ${fmtVND(draftTotal())}`}
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
  $('#confirm-total').textContent = fmtVND(draftTotal());
  $('#confirm-modal').style.display = 'grid';
}
function closeConfirm() { $('#confirm-modal').style.display = 'none'; }

function sendToKitchen() {
  if (!draft.length || draftHasOos()) return;
  const code = `#${TABLE_INFO.code}-${String(orderSeq).padStart(3, '0')}`;
  const total = draftTotal();
  orderSeq += 1;
  draft = [];
  closeConfirm();
  closeDraft();
  renderStickyBar();
  $('#success-code').textContent = code;
  $('#success-total').textContent = fmtVND(total);
  $('#success-modal').style.display = 'grid';
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

$('#cat-row').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderCategories();
  renderMenu();
});

$('#search-input').addEventListener('input', e => {
  searchText = e.target.value;
  renderMenu();
});

$('#menu-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  if (!btn || btn.disabled) return;
  addToDraft(btn.dataset.add);
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
  const rem = e.target.closest('[data-remove]');
  if (noteBtn) { openNoteEditor(+noteBtn.dataset.note); return; }
  if (inc && !inc.disabled) { draft[+inc.dataset.inc].qty += 1; }
  else if (dec) {
    const it = draft[+dec.dataset.dec];
    it.qty -= 1;
    if (it.qty <= 0) draft.splice(+dec.dataset.dec, 1);
  }
  else if (rem) { draft.splice(+rem.dataset.remove, 1); }
  else return;
  renderDraft();
  renderStickyBar();
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

/* ===================== KHỞI TẠO ===================== */
renderCategories();
renderMenu();
renderStickyBar();
