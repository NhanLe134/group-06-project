/* =====================================================================
   ThucDon.js — US-01: E-Menu (thực đơn, phân loại, tìm kiếm, tải menu)
   ---------------------------------------------------------------------
   Chứa:
   - loadMenu()          : gọi GET /menu, suy ra nhóm phân loại
   - renderCategories()  : hàng chip "Tất cả / Món chính..." (điều hướng)
   - renderMenu()        : danh sách món chia nhóm (ADR-N09)
   - renderCard()        : 1 thẻ món (+ / bộ đếm / Hết / ruy băng Bán chạy)
   - renderMenuSkeleton(): hiệu ứng tải menu
   - updateActiveChip()  : scroll-spy — lướt tới nhóm nào chip đó nền cam
   - Sự kiện: chip phân loại, ô tìm kiếm, click thẻ món (thêm/giảm món)
   Yêu cầu DuLieuChung.js load trước (dùng MENU, CATS, searchText, addToDraft...).
   ===================================================================== */

/* Thứ tự nhóm ưu tiên trên E-Menu; nhóm khác (nếu có) xếp sau */
const CAT_ORDER = ['Món chính', 'Set lẩu', 'Đồ uống'];
const catSlug = label => 'cat-' + encodeURIComponent(label).replace(/%/g, '');

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
  /* Badge bán chạy overlay góc ảnh — đặt trong h3 sẽ bị cắt bởi ellipsis tên món */
  const hotBadge = d.bestseller
    ? '<span class="badge-hot"><i class="ph-fill ph-fire"></i>Bán chạy</span>'
    : '';
  return `
    <article class="menu-card ${oos ? 'oos' : ''}">
      ${hotBadge}
      <div class="menu-thumb-wrap">
        <div class="menu-thumb">${thumb}</div>
      </div>
      <div class="menu-info">
        <h3 title="${esc(d.name)}">${esc(d.name)}</h3>
        <p class="menu-price">${fmtVND(d.price)}</p>
      </div>
      ${q === 0
        ? (oos
          ? '<span class="btn-soldout" title="Món này hiện đã hết, vui lòng chọn món khác.">Hết</span>'
          : `<button class="btn-add" data-add="${d.id}"
              aria-label="Thêm ${d.name} vào đơn" title="Thêm vào Order Draft">
              <i class="ph-bold ph-plus"></i>
            </button>`)
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

/* Thẻ món: "+" thêm lần đầu (ADR-N06) | bộ đếm − qty + tăng/giảm tại thẻ */
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
