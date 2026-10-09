/* =====================================================================
   GioHang.js — Order Draft (giỏ nháp) + Sticky Bar
   ---------------------------------------------------------------------
   Chứa:
   - renderStickyBar() : thanh đáy trang — số món + tổng tạm tính + nút "Xem đơn"
   - renderDraft()     : nội dung bottom-sheet giỏ (món, số lượng, ghi chú, tổng)
   - addToDraft()      : thêm/tăng món (được ThucDon.js gọi khi bấm + / bộ đếm)
   - openDraft/closeDraft
   - Sự kiện: nút mở/đóng giỏ, tăng/giảm trong giỏ
   Nghiệp vụ: ADR-001 (món hết hàng → xám + khóa nút gửi), ADR-N06 (bộ đếm thẻ).
   Ghi chú món nằm ở GhiChuMon.js; gửi bếp nằm ở GuiBep.js.
   ===================================================================== */

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

/* ===================== SỰ KIỆN ===================== */

$('#btn-open-draft').addEventListener('click', openDraft);
$('#btn-close-draft').addEventListener('click', closeDraft);
$('#sheet-overlay').addEventListener('click', closeDraft);

/* Trong giỏ: sửa ghi chú (GhiChuMon.js mở modal) / tăng / giảm (về 0 = gỡ món) */
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
