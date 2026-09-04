/* =====================================================================
   Group 06 — Smart Restaurant Ordering (Prototype Output #10)
   app.js — State, NLU giả lập, 4 flows A–D, 3 vai (Khách / Bếp KDS / Waiter)
   ---------------------------------------------------------------------
   LUẬN LUỬC NGHIỆP VỤ ĐƯỢC CÀI ĐẶT:
   - BR-RO-01: giá chỉ đọc từ CATALOG (data.js) — không sinh/sửa giá.
   - BR-RO-03 + REQ-RO-02: mọi input (chạm / giọng nói / gõ chữ) đều quy về
     Order Draft, chỉ gửi bếp sau Explicit Confirmation.
   - BR-RO-04: câu lệnh khớp nhiều món → bắt buộc Clarification, không tự chọn.
   - BR-RO-02 + REQ-RO-09: món Out of Stock bị khóa ở E-Menu, không cho thêm
     vào draft; AI chủ động đề xuất món thay thế.
   - ADR-001: món OOS đang nằm trong draft → xám + nhãn đỏ "Món đã hết",
     khóa nút "Xác nhận gửi bếp" đến khi gỡ món; AI nhắc đúng câu trong vault.
   - BR-RO-05: không có nút hủy cho đơn đã gửi (phía khách).
   - REQ-RO-07/08: beep khi món xong (Waiter); ticket KDS đỏ khi chờ quá 15 phút.
   Chạy: mở thẳng index.html (file://) — không cần server, không build.
   ===================================================================== */

'use strict';

/* ===================== Tiện ích ===================== */
const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtVND = n => n.toLocaleString('vi-VN') + '₫';
const pad2 = n => String(n).padStart(2, '0');
const fmtDur = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
};
const fmtTime = ts => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
function norm(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}
/* Ghi chú: [̀-ͯ] là dải ký tự dấu thanh Unicode (̀–ͯ) để bỏ dấu tiếng Việt. */

/* ===================== Âm thanh (WebAudio — không file mp3) ===================== */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* bỏ qua */ } }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(pattern) {
  ensureAudio();
  if (!audioCtx) return;
  let t = audioCtx.currentTime + 0.01;
  pattern.forEach(([f, d]) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + d + 0.03);
    t += d + 0.07;
  });
}
const SOUNDS = {
  tap:       [[520, 0.06]],
  success:   [[784, 0.14], [1046, 0.24]],
  ready:     [[880, 0.10], [880, 0.10], [1174, 0.28]],  /* REQ-RO-07: món nấu xong */
  newTicket: [[660, 0.12]],
};

/* ===================== State ===================== */
function freshState() {
  return {
    role: null,          /* null | 'customer' | 'kitchen' | 'waiter' (Screen 0) */
    ui: 'idle',          /* idle|listening|processing|ambiguous|out-of-stock|
                            order-draft|confirm|success|network-error|empty   */
    draft: [],           /* [{ id, qty, note }] — bản nháp DUY NHẤT (chạm + giọng nói) */
    orders: [],          /* [{ code, items, status, placedTs, startedTs, readyTs, servedTs }] */
    orderSeq: 1,
    overrides: {},       /* delta tồn kho do Bếp báo (REQ-RO-09), mặc định mirror catalog */
    chat: [],            /* log trợ lý AI: { from:'user'|'ai', text, chips? } */
    ambiguity: null,     /* { qty, candidates:[id], segment } */
    transcript: '', interim: '',
    networkDown: false,  /* công tắc mô phỏng lỗi mạng (demo) */
    lastFailed: null,    /* { type:'voice'|'send', payload } để nút Thử lại */
    lastOos: null,       /* { id, suggestions:[id] } cho alert Flow C */
    voiceOpen: false, draftOpen: false,
    successOrder: null,
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return Object.assign(freshState(), JSON.parse(raw));
  } catch (e) { return null; }
}
function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      role: S.role, draft: S.draft, orders: S.orders, orderSeq: S.orderSeq,
      overrides: S.overrides, chat: S.chat.slice(-60), networkDown: S.networkDown,
    }));
  } catch (e) { /* chế độ riêng tư: bỏ qua */ }
}
let S = loadState() || freshState();

/* ===================== Truy vấn dữ liệu (BR-RO-01: chỉ đọc CATALOG) ===================== */
const dishById = id => CATALOG.find(d => d.id === id);
const statusOf = id => S.overrides[id] || (dishById(id) ? dishById(id).status : 'Available');
const isOos = id => statusOf(id) === 'Out of Stock';
const draftUnits  = () => S.draft.reduce((n, it) => n + it.qty, 0);
const draftTotal  = () => S.draft.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);
const draftHasOos = () => S.draft.some(it => isOos(it.id));
const orderTotal  = o => o.items.reduce((n, it) => n + it.qty * dishById(it.id).price, 0);
const isOverdue   = o => (o.status === 'pending' || o.status === 'cooking') && (Date.now() - o.placedTs) >= OVERDUE_MS;

/* ===================== NLU giả lập (khớp từ khóa trên CATALOG) ===================== */
function parseUtterance(raw) {
  const text = String(raw).trim();
  const res = { adds: [], ambiguities: [], oos: [], notFound: [], done: false };
  /* Lệnh thoại điều hướng (ADR-002): "Đã chọn món xong" → đóng trợ lý, mở Order Draft */
  if (norm(text).includes('chon mon xong')) { res.done = true; return res; }
  const segs = text.split(/\s*(?:,|\svà\s|\svới\s)\s*/i).map(s => s.trim()).filter(Boolean);

  segs.forEach(seg => {
    let n = norm(seg).replace(/^(cho|them|lay|order)\s+/, '');
    let qty = 1;
    const mQty = n.match(/^(\d+|mot|hai|ba|bon|nam|sau)\b\s*/);
    if (mQty) { qty = QUANTITY_WORDS[mQty[1]] || parseInt(mQty[1], 10) || 1; n = n.slice(mQty[0].length); }

    const scored = CATALOG.map(d => {
      let score = 0;
      d.kwStrong.forEach(k => { if (n.includes(k)) score += k.split(' ').length * 2; });
      d.kwWeak.forEach(k => { if (n.includes(k)) score += 1; });
      return { d, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    if (!scored.length) { res.notFound.push(seg); return; }

    const top = scored[0];
    const tied = scored.filter(x => x.score === top.score);
    if (tied.length === 1) { resolveSeg(res, top.d, qty, seg); return; }

    /* BR-RO-04 — nhiều món cùng điểm: liệt kê món có tên BẮT ĐẦU bằng từ khóa chung
       ("bò" → Bò xào cần + Bò sốt tiêu đen, không tính Phở bò tái lăn) */
    const weakHits = tied.map(x => x.d.kwWeak.filter(k => n.includes(k)));
    const shared = weakHits.reduce((acc, cur) => acc.filter(k => cur.includes(k)), weakHits[0] || []);
    const candidates = tied.map(x => x.d)
      .filter(d => shared.some(k => norm(d.name).split(' ')[0] === k));
    if (candidates.length > 1) {
      res.ambiguities.push({ qty, candidates: candidates.map(d => d.id), segment: seg });
    } else {
      resolveSeg(res, top.d, qty, seg);
    }
  });
  return res;
}
function resolveSeg(res, dish, qty, seg) {
  if (isOos(dish.id)) {
    /* BR-RO-02: không cho món hết hàng vào draft; AI đề xuất thay thế */
    res.oos.push({ id: dish.id, qty, suggestions: suggestFor(dish) });
  } else {
    res.adds.push({ id: dish.id, qty, note: extractNote(seg) });
  }
}
function extractNote(seg) {
  const notes = [];
  const re = /không\s+([\p{L}]+)/gu;
  let m;
  while ((m = re.exec(String(seg).toLowerCase()))) notes.push('Không ' + m[1]);
  return notes.join(', ');
}
function suggestFor(dish) {
  const hits = [...dish.kwStrong, ...dish.kwWeak];
  return CATALOG.filter(d =>
    d.id !== dish.id && !isOos(d.id) &&
    [...d.kwStrong, ...d.kwWeak].some(k => hits.includes(k)));
}
function ambiguityQuestion(a) {
  const ds = a.candidates.map(dishById);
  const first = ds[0].name.split(' ')[0];
  const same = ds.every(d => norm(d.name).split(' ')[0] === norm(first));
  const list = ds.map(d => `${d.name} (${fmtVND(d.price)})`).join(' và ');
  return `Quán có ${ds.length} món ${same ? first.toLowerCase() : 'phù hợp'}: ${list}. Bạn muốn chọn món nào?`;
}

/* ===================== Hành vi ===================== */
function aiSay(text, chips) {
  S.chat.push({ from: 'ai', text, chips: chips || null });
  if (S.chat.length > 60) S.chat.splice(0, S.chat.length - 60);
}
function addToDraft({ id, qty, note = '' }) {
  const f = S.draft.find(it => it.id === id && (it.note || '') === (note || ''));
  if (f) f.qty += qty; else S.draft.push({ id, qty, note });
  beep(SOUNDS.tap);
}
function closeAllPanels() {
  S.voiceOpen = false; S.draftOpen = false; S.ambiguity = null;
  if (['order-draft', 'empty', 'out-of-stock'].includes(S.ui)) S.ui = 'idle';
}

/* ----- Luồng giọng nói / gõ chữ (FLOW A) ----- */
function runVoiceText(text) {
  if (S.networkDown) return failNetwork('voice', text);
  S.voiceOpen = true;
  S.transcript = text; S.interim = text;
  S.ui = 'listening';
  render();
  setTimeout(() => {
    S.ui = 'processing'; render();
    setTimeout(() => { applyParse(parseUtterance(text)); render(); persist(); }, 1100);
  }, 700);
}
function applyParse(parsed) {
  S.ui = 'idle';
  if (parsed.done) {
    /* ADR-002: "Đã chọn món xong" → tắt trợ lý AI, hiển thị Order Draft */
    S.voiceOpen = false;
    S.draftOpen = true;
    S.ui = S.draft.length ? 'order-draft' : 'empty';
    aiSay(COPY.DONE_MSG);
    return;
  }
  if (parsed.ambiguities.length) {                      /* FLOW B — BR-RO-04 */
    S.ambiguity = parsed.ambiguities[0];
    S.ui = 'ambiguous';
    aiSay(ambiguityQuestion(S.ambiguity));
    return;
  }
  if (parsed.oos.length) {                              /* FLOW C — ADR-001/BR-RO-02 */
    const o = parsed.oos[0];
    const d = dishById(o.id);
    S.lastOos = { id: o.id, suggestions: o.suggestions.map(s => s.id) };
    S.ui = 'out-of-stock';
    aiSay(`"${d.name}" ${COPY.OOS_MSG}`, o.suggestions.map(s => ({ id: s.id, label: `＋ ${s.name} · ${fmtVND(s.price)}` })));
    return;
  }
  if (parsed.adds.length) {                             /* FLOW A — đồng bộ vào draft */
    parsed.adds.forEach(addToDraft);
    aiSay('Đã thêm vào bản nháp: ' + parsed.adds
      .map(a => `${a.qty}× ${dishById(a.id).name}${a.note ? ` (${a.note})` : ''}`).join(', ')
      + '. Anh/chị bấm “Xem đơn” để dò lại trước khi gửi bếp nhé ạ.');
    return;
  }
  if (parsed.notFound.length) {
    aiSay(`Em không tìm thấy món “${parsed.notFound.join('”, “')}” trong menu. Anh/chị thử gọi tên món khác hoặc chạm chọn từ menu nhé ạ.`);
  }
}

/* ----- Web Speech API thật (Chrome) — fallback về chip kịch bản nếu không hỗ trợ ----- */
let recognition = null;
function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    aiSay('Trình duyệt này chưa hỗ trợ nhận giọng nói. Anh/chị dùng các câu mẫu bên dưới hoặc gõ vào ô tìm kiếm nhé ạ.');
    render(); return;
  }
  if (S.ui === 'listening' && recognition) { try { recognition.stop(); } catch (e) {} return; }
  recognition = new SR();
  recognition.lang = 'vi-VN';
  recognition.interimResults = true;
  recognition.continuous = false;
  S.voiceOpen = true; S.transcript = ''; S.interim = ''; S.ui = 'listening';
  render();
  recognition.onresult = e => {
    let interim = '', final = '';
    for (const r of e.results) { if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript; }
    S.interim = (final || interim).trim();
    if (final) {
      S.transcript = final.trim();
      S.ui = 'processing'; render();
      setTimeout(() => { applyParse(parseUtterance(S.transcript)); render(); persist(); }, 900);
    } else { render(); }
  };
  recognition.onerror = ev => {
    S.ui = 'idle';
    aiSay(`Em chưa nghe rõ (${ev.error}). Anh/chị nói lại hoặc chọn một câu mẫu bên dưới nhé ạ.`);
    render();
  };
  recognition.onend = () => { if (S.ui === 'listening') { S.ui = 'idle'; render(); } };
  try { recognition.start(); } catch (e) { /* đã chạy */ }
}

/* ----- Lỗi mạng (state network-error) ----- */
function failNetwork(type, payload) {
  S.lastFailed = { type, payload };
  S.ui = 'network-error';
  render();
}
function retryNetwork() {
  if (S.networkDown || !S.lastFailed) { S.ui = 'network-error'; render(); return; }
  const f = S.lastFailed;
  S.lastFailed = null; S.ui = 'idle'; render();
  if (f.type === 'voice') runVoiceText(f.payload);
  else if (f.type === 'send') { S.draftOpen = true; sendToKitchen(); }
}

/* ----- FLOW D — Explicit Confirmation → KDS → Waiter ----- */
function sendToKitchen() {
  if (!S.draft.length || draftHasOos()) return;      /* ADR-001 khóa nút — chặn thêm 1 lớp */
  if (S.networkDown) { S.draftOpen = true; S.ui = 'order-draft'; return failNetwork('send'); }
  const code = `#${TABLE_INFO.code}-${String(S.orderSeq).padStart(3, '0')}`;
  S.orderSeq += 1;
  S.orders.unshift({
    code,
    items: S.draft.map(x => ({ ...x })),
    status: 'pending',
    placedTs: Date.now(), startedTs: null, readyTs: null, servedTs: null,
  });
  S.draft = [];
  S.successOrder = code;
  S.ui = 'success';
  S.draftOpen = false; S.voiceOpen = false;
  aiSay(`Đơn ${code} đã được gửi xuống bếp. Theo dõi tiến độ ở mục “Đơn đã gửi” nhé ạ.`);
  beep(SOUNDS.success);
  setTimeout(() => beep(SOUNDS.newTicket), 350);     /* bếp "nghe" ticket mới */
  render(); persist();
}
function kdsAdvance(code) {
  const o = S.orders.find(x => x.code === code);
  if (!o) return;
  if (o.status === 'pending') { o.status = 'cooking'; o.startedTs = Date.now(); }
  else if (o.status === 'cooking') { o.status = 'ready'; o.readyTs = Date.now(); beep(SOUNDS.ready); }
  else return;
  render(); persist();
}
function markServed(code) {
  const o = S.orders.find(x => x.code === code);
  if (!o || o.status !== 'ready') return;
  o.status = 'served'; o.servedTs = Date.now();
  beep(SOUNDS.tap);
  render(); persist();
}

/* ----- REQ-RO-09 — Nút "Out of Stock" của Bếp → khóa món toàn hệ thống ----- */
function toggleStock(id) {
  S.overrides[id] = isOos(id) ? 'Available' : 'Out of Stock';
  if (S.overrides[id] === 'Out of Stock') {
    /* ADR-001 — món vừa hết đang nằm trong draft khách: xám + khóa gửi + AI nhắc */
    if (S.draft.some(it => it.id === id)) {
      aiSay(COPY.ADR001(dishById(id).name));
      if (S.role === 'customer') S.draftOpen = true;
    }
  }
  render(); persist();
}

/* ===================== RENDER ===================== */
function render() {
  const app = $('#app');
  if (!S.role) { app.innerHTML = renderSplash(); return; }
  const busyOverlay = S.ui === 'success' || !!S.ambiguity || S.ui === 'confirm';
  app.innerHTML = `
    <div class="phone">
      ${renderTopBar()}
      ${renderDemoBar()}
      ${S.ui === 'network-error' ? renderBanner() : ''}
      <main class="screen">
        ${S.role === 'customer' ? renderCustomer() : S.role === 'kitchen' ? renderKDS() : renderWaiter()}
      </main>
      ${S.role === 'customer' && !S.voiceOpen && !S.draftOpen && !busyOverlay ? renderStickyBar() : ''}
      ${S.role === 'customer' && !S.voiceOpen && !busyOverlay ? renderVoiceFab() : ''}
      ${S.role === 'customer' ? renderVoiceSheet() + renderDraftSheet() : ''}
      ${renderAmbiguousModal()}
      ${renderConfirmModal()}
      ${renderSuccessOverlay()}
    </div>`;
  const c = $('#chat');
  if (c) c.scrollTop = c.scrollHeight;
}

/* ----- Screen 0 — chọn vai (bổ sung 2026-09-04) ----- */
function renderSplash() {
  return `
  <div class="phone splash-wrap">
    <div class="splash">
      <div class="splash-logo">🍽️</div>
      <h1>Smart Restaurant Ordering</h1>
      <p class="splash-sub"></p>
      <p class="splash-q">Bạn là vai trò nào?</p>
      ${ROLES.map(r => `
        <button class="role-card" data-action="select-role" data-role="${r.id}">
          <span class="rc-emoji">${r.emoji}</span>
          <span class="rc-text"><b>${r.title}</b><small>${r.desc}</small></span>
          <span class="rc-arrow">›</span>
        </button>`).join('')}
    </div>
  </div>`;
}

/* ----- Top bar + nút Đăng xuất (đổi vai chỉ qua Screen 0) ----- */
function renderTopBar() {
  return `
  <header class="topbar">
    <div class="brand-row">
      <span class="brand">🍽️ Smart Ordering</span>
      <button class="btn-logout" data-action="logout" title="Đăng xuất / Đổi vai">⏻ Đăng xuất</button>
    </div>
  </header>`;
}

/* ----- Thanh demo (duyệt 2026-09-04: mô phỏng lỗi mạng + reset) ----- */
function renderDemoBar() {
  return `
  <div class="demo-bar">
    <span class="demo-tag">🛠 DEMO</span>
    <label class="switch" title="Chặn Voice NLU và Gửi bếp để kích hoạt state network-error">
      <input type="checkbox" data-action="toggle-network" ${S.networkDown ? 'checked' : ''}>
      <span>Mô phỏng lỗi mạng</span>
    </label>
    <button class="btn-mini" data-action="reset-demo">↺ Reset demo</button>
  </div>`;
}

function renderBanner() {
  return `
  <div class="banner" role="alert">
    <span>⚠️ ${COPY.NETWORK}</span>
    <button class="btn-mini" data-action="retry-network">Thử lại</button>
  </div>`;
}

/* ===================== VAI 1 — KHÁCH (E-Menu + Voice) ===================== */
function renderCustomer() {
  const best = CATALOG.filter(d => d.bestseller);
  return `
  <div class="cust-head">
    <div>
      <h2>E-Menu — ${TABLE_INFO.label}</h2>
      <p>${TABLE_INFO.area} · ${esc(TABLE_INFO.guests)}</p>
    </div>
    <span class="pill ${S.draft.length ? 'pill-warn' : ''}">${COPY.DRAFT_BADGE}</span>
  </div>
  ${renderOosAlert()}
  <form class="searchbar" data-form="command">
    <input id="cmd" type="text" placeholder="${COPY.IDLE_SEARCH}" autocomplete="off" aria-label="Nhập món ăn hoặc câu lệnh">
    <button type="submit" aria-label="Gửi">➤</button>
  </form>
  <div class="menu-list">
    ${CATALOG.map(d => {
      const oos = isOos(d.id);
      return `
      <article class="card ${oos ? 'oos' : ''}">
        <div class="thumb">${d.emoji}</div>
        <div class="info">
          <h3>${esc(d.name)}${d.bestseller ? ' <span class="badge-hot">🔥Bán chạy</span>' : ''}</h3>
          <p class="price">${fmtVND(d.price)}</p>
          ${oos ? `<span class="badge-oos">${COPY.OOS_LABEL}</span>` : ''}
        </div>
        <button class="btn-add" data-action="add-item" data-id="${d.id}" ${oos ? 'disabled' : ''}
          aria-label="Thêm ${esc(d.name)} vào đơn" title="${oos ? COPY.OOS_MSG : 'Thêm vào Order Draft'}">＋</button>
      </article>`;
    }).join('')}
  </div>
  ${renderSentOrders()}`;
}

/* Thông báo OOS ngay trên E-Menu (state out-of-stock, FLOW C) */
function renderOosAlert() {
  if (S.ui !== 'out-of-stock' || !S.lastOos) return '';
  const d = dishById(S.lastOos.id);
  return `
  <div class="oos-alert" role="alert">
    <p><b>🤖 "${esc(d.name)}" — ${COPY.OOS_MSG}</b></p>
    ${S.lastOos.suggestions.length ? `<div class="chips-row">
      ${S.lastOos.suggestions.map(id => {
        const s = dishById(id);
        return `<button class="chip" data-action="add-suggestion" data-id="${s.id}">＋ ${esc(s.name)} · ${fmtVND(s.price)}</button>`;
      }).join('')}
    </div>` : ''}
    <button class="btn-mini" data-action="dismiss-oos">Đã hiểu</button>
  </div>`;
}

/* Đơn đã gửi (chỉ món chưa hoàn tất) + Hóa đơn tổng hợp — ADR-002 */
function renderSentOrders() {
  if (!S.orders.length) return '';
  const active = S.orders.filter(o => o.status !== 'served');
  return `
  <section class="sent">
    ${active.length ? `
      <h4>📋 Đơn đã gửi xuống bếp</h4>
      ${active.map(o => `
        <div class="sent-card">
          <div class="sent-top">
            <b>${o.code}</b>
            <span class="status-pill st-${o.status}">${STATUS_META[o.status].label}</span>
          </div>
          <p class="sent-items">${o.items.map(it => `${it.qty}× ${esc(dishById(it.id).name)}${it.note ? ` <small>(${esc(it.note)})</small>` : ''}`).join(' · ')}
            — <b>${fmtVND(orderTotal(o))}</b></p>
          <div class="timeline">
            ${LIFECYCLE.map(st => `
              <span class="tl-step ${LIFECYCLE.indexOf(st) <= LIFECYCLE.indexOf(o.status) ? 'done' : ''} ${st === o.status ? 'now' : ''}">
                ${STATUS_META[st].label}</span>`).join('<span class="tl-sep">→</span>')}
          </div>
        </div>`).join('')}` : ''}
    ${renderBill()}
  </section>`;
}

/* ADR-002 — Hóa đơn: toàn bộ món đã gọi, cột SL/Giá/Trạng thái + tổng kết */
function renderBill() {
  const rows = [];
  S.orders.forEach(o => {
    const served = o.status === 'served';
    o.items.forEach(it => {
      const d = dishById(it.id);
      rows.push(`
        <tr>
          <td>${esc(d.name)}${it.note ? `<small>📝 ${esc(it.note)}</small>` : ''}</td>
          <td class="num">${it.qty}</td>
          <td class="num">${fmtVND(d.price * it.qty)}</td>
          <td><span class="status-pill ${served ? 'st-served' : 'st-pending'}">${served ? 'Đã phục vụ' : 'Chưa phục vụ'}</span></td>
        </tr>`);
    });
  });
  if (!rows.length) return '';
  const totalQty = S.orders.reduce((n, o) => n + o.items.reduce((m, it) => m + it.qty, 0), 0);
  const totalAmt = S.orders.reduce((n, o) => n + orderTotal(o), 0);
  return `
    <h4>🧾 Hóa đơn</h4>
    <div class="bill">
      <table class="bill-table">
        <thead>
          <tr><th>Món</th><th class="num">Số lượng</th><th class="num">Giá</th><th>Trạng thái</th></tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
      <div class="bill-foot">
        <span>Tổng số món: <b>${totalQty}</b></span>
        <span>Tổng thành tiền: <b>${fmtVND(totalAmt)}</b></span>
      </div>
    </div>`;
}

function renderStickyBar() {
  const units = draftUnits();
  return `
  <div class="sticky-bar">
    <div class="sb-info">
      ${units ? `<b>${units} món</b><span>${fmtVND(draftTotal())}${draftHasOos() ? ' · ⚠️ có món hết hàng' : ''}</span>`
               : `<span>Chưa có món nào</span>`}
    </div>
    <button class="btn-primary" data-action="open-draft">🛒 Xem đơn${units ? ` (${units})` : ''}</button>
  </div>`;
}

function renderVoiceFab() {
  return `
  <button class="fab ${S.ui === 'listening' ? 'listening' : ''}" data-action="open-voice"
    aria-label="Mở trợ lý gọi món bằng giọng nói">🎙️</button>`;
}

/* ----- Voice sheet: idle / listening / processing + transcript + chat AI ----- */
function renderVoiceSheet() {
  if (!S.voiceOpen) return '';
  const busy = S.ui === 'listening' || S.ui === 'processing';
  return `
  <section class="sheet voice-sheet" role="dialog" aria-label="Trợ lý gọi món AI">
    <div class="sheet-grip"></div>
    <div class="sheet-head">
      <b>🤖 Trợ lý gọi món AI</b>
      <button class="btn-x" data-action="close-voice" aria-label="Đóng">✕</button>
    </div>

    <div class="mini-draft">
      ${S.draft.length
        ? `<b>Đang chọn:</b> ${S.draft.map(it => `${it.qty}× ${esc(dishById(it.id).name)}`).join(' · ')} — <b>${fmtVND(draftTotal())}</b>`
        : `<div class="empty-state small"><span>🛒</span><p>${COPY.EMPTY}</p></div>`}
    </div>

    <div class="voice-stage st-${S.ui}">
      ${S.ui === 'listening' ? `
        <div class="mic-live" data-action="mic-toggle" role="button" aria-label="Dừng nghe">
          <span class="wave"></span><span class="wave"></span><span class="wave"></span>
        </div>
        <p class="stage-label live">${COPY.LISTENING}</p>`
      : S.ui === 'processing' ? `
        <div class="spinner" aria-hidden="true"></div>
        <p class="stage-label">${COPY.PROCESSING}</p>`
      : `
        <button class="btn-mic" data-action="mic-toggle">🎙️ Bấm để nói</button>
        <p class="stage-label">${COPY.IDLE_SEARCH}</p>`}
      ${(S.ui === 'listening' || S.ui === 'processing') && S.interim ? `
        <p class="transcript" role="status" aria-live="polite">“${esc(S.interim)}”</p>` : ''}
    </div>

    <div class="scenario-row">
      ${VOICE_SCENARIOS.map((sc, i) => `
        <button class="chip chip-flow" data-action="scenario" data-i="${i}" ${busy ? 'disabled' : ''}
          title="Giả lập câu thoại: ${esc(sc.text)}">
          <small>${sc.tag}</small>${esc(sc.text)}
        </button>`).join('')}
    </div>

    <div class="chat" id="chat" aria-live="polite">
      ${S.chat.map(m => `
        <div class="msg ${m.from}">
          ${m.from === 'ai' ? '<span class="msg-ava">🤖</span>' : ''}
          <div class="bubble">
            <p>${esc(m.text)}</p>
            ${m.chips ? `<div class="chips-row">${m.chips.map(ch =>
              `<button class="chip" data-action="add-suggestion" data-id="${ch.id}">${esc(ch.label)}</button>`).join('')}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>
  </section>`;
}

/* ----- Order Draft sheet (state order-draft / empty + ADR-001) ----- */
function renderDraftSheet() {
  if (!S.draftOpen) return '';
  const units = draftUnits(), total = draftTotal(), hasOos = draftHasOos();
  const oosNames = S.draft.filter(it => isOos(it.id)).map(it => dishById(it.id).name);
  return `
  <section class="sheet draft-sheet" role="dialog" aria-label="Order Draft">
    <div class="sheet-grip"></div>
    <div class="sheet-head">
      <b>🧾 Order Draft</b>
      <button class="btn-x" data-action="close-draft" aria-label="Đóng">✕</button>
    </div>

    ${!S.draft.length ? `
      <div class="empty-state">
        <span>🛒</span>
        <p>${COPY.EMPTY}</p>
      </div>` : `
      <div class="d-list">
        ${S.draft.map((it, i) => {
          const d = dishById(it.id), oos = isOos(it.id);
          return `
          <div class="d-item ${oos ? 'oos' : ''}">
            <div class="d-info">
              <b>${it.qty}× ${esc(d.name)}</b>
              ${it.note ? `<small>📝 ${esc(it.note)}</small>` : ''}
              ${oos ? `<span class="badge-oos">${COPY.DRAFT_OOS_LABEL}</span>` : ''}
            </div>
            <div class="d-price">${fmtVND(d.price * it.qty)}</div>
            <div class="d-ctrl">
              <button data-action="dec-item" data-i="${i}" aria-label="Giảm ${esc(d.name)}">−</button>
              <span class="d-qty">${it.qty}</span>
              <button data-action="inc-item" data-i="${i}" ${oos ? 'disabled' : ''} aria-label="Thêm ${esc(d.name)}">＋</button>
              <button class="btn-x" data-action="remove-item" data-i="${i}" aria-label="Gỡ ${esc(d.name)}">🗑</button>
            </div>
          </div>`;
        }).join('')}
      </div>

      ${hasOos ? `
        <div class="adr-warn">
          <p>🤖 ${esc(COPY.ADR001(oosNames.join(', ')))}</p>
          <p class="lock-note">🔒 Nút “Xác nhận gửi bếp” bị khóa theo ADR-001 cho đến khi gỡ món hết hàng.</p>
        </div>` : ''}

      <div class="d-total"><span>Tổng tạm tính</span><b>${fmtVND(total)}</b></div>`}

    <button class="btn-primary btn-send" data-action="open-confirm"
      ${(!units || hasOos) ? 'disabled' : ''}>
      ${hasOos ? '🔒 Không thể gửi — có món hết hàng' : `Xác nhận gửi bếp · ${fmtVND(total)}`}
    </button>
  </section>`;
}

/* ----- Modal Explicit Confirmation (state confirm) ----- */
function renderConfirmModal() {
  if (S.ui !== 'confirm') return '';
  return `
  <div class="overlay">
    <div class="modal" role="alertdialog" aria-modal="true" aria-label="Xác nhận gửi bếp">
      <h3>🔔 Xác nhận gửi bếp</h3>
      <p>${COPY.confirm(draftUnits())}</p>
      <p class="muted">${TABLE_INFO.label} · Tổng tạm tính: <b>${fmtVND(draftTotal())}</b></p>
      <div class="modal-actions">
        <button class="btn-ghost" data-action="cancel-confirm">Hủy bỏ</button>
        <button class="btn-primary" data-action="confirm-send">Xác nhận</button>
      </div>
    </div>
  </div>`;
}

/* ----- Modal Clarification (state ambiguous — FLOW B / BR-RO-04) ----- */
function renderAmbiguousModal() {
  if (!S.ambiguity || S.ui !== 'ambiguous') return '';
  const a = S.ambiguity;
  return `
  <div class="overlay">
    <div class="modal" role="alertdialog" aria-modal="true" aria-label="Làm rõ món gọi">
      <h3>🤖 Câu lệnh có nhiều món phù hợp</h3>
      <p>${esc(ambiguityQuestion(a))}</p>
      <div class="cand-list">
        ${a.candidates.map(id => {
          const d = dishById(id), oos = isOos(id);
          return `
          <button class="cand ${oos ? 'oos' : ''}" data-action="pick-candidate" data-id="${d.id}" ${oos ? 'disabled' : ''}>
            <span class="thumb">${d.emoji}</span>
            <span class="cand-info">
              <b>${esc(d.name)}</b>
              <small>${fmtVND(d.price)}</small>
              ${oos ? `<span class="badge-oos">${COPY.OOS_LABEL}</span>` : ''}
            </span>
            <span class="cand-add">${oos ? '—' : 'Chọn'}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn-ghost" data-action="dismiss-ambiguous">Để sau</button>
      </div>
    </div>
  </div>`;
}

/* ----- Overlay thành công (state success — FLOW D) ----- */
function renderSuccessOverlay() {
  if (S.ui !== 'success' || !S.successOrder) return '';
  const o = S.orders.find(x => x.code === S.successOrder);
  return `
  <div class="overlay success-ov">
    <div class="modal success-modal" role="status">
      <div class="big-check">✓</div>
      <h3>${COPY.SUCCESS_HEAD}</h3>
      <p class="order-code">${o ? o.code : ''}</p>
      <p>${TABLE_INFO.label} · ${o ? fmtVND(orderTotal(o)) : ''}</p>
      <p class="muted">Trạng thái món: <span class="status-pill st-pending">${STATUS_META.pending.label}</span> — đã đồng bộ tới Bếp KDS.</p>
      <button class="btn-primary" data-action="close-success">Tiếp tục gọi món</button>
    </div>
  </div>`;
}

/* ===================== VAI 2 — BẾP KDS ===================== */
function renderKDS() {
  const active = S.orders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const ready = S.orders.filter(o => o.status === 'ready');
  const done = S.orders.filter(o => o.status === 'served');
  return `
  <div class="role-head">
    <div><h2>👨‍🍳 Bếp KDS</h2><p>Bếp trưởng Hùng · ${TABLE_INFO.label}</p></div>
    <span class="clock" data-clock>${fmtTime(Date.now())}</span>
  </div>

  <section class="stock-ctrl" title="REQ-RO-09: nút Out of Stock tự động khóa món toàn hệ thống">
    <b>Tồn kho — Bếp báo hết hàng</b>
    <div class="stock-chips">
      ${CATALOG.map(d => {
        const oos = isOos(d.id);
        return `<button class="stock-chip ${oos ? 'oos' : ''}" data-action="toggle-stock" data-id="${d.id}"
          aria-pressed="${oos}">${d.emoji} ${esc(d.name)} <b>${oos ? 'Hết hàng' : 'Còn hàng'}</b></button>`;
      }).join('')}
    </div>
  </section>

  <h4 class="kds-sec">Đơn đang xử lý (${active.length})</h4>
  ${active.length ? active.map(renderTicket).join('') : `
    <div class="empty-state small"><span>🍳</span><p>Chưa có đơn nào. Đơn khách gửi sẽ hiện tại đây.</p></div>`}
  ${ready.length ? `<h4 class="kds-sec">Sẵn sàng — chờ phục vụ (${ready.length})</h4>
    ${ready.map(o => `
      <div class="done-row">
        <b>${o.code}</b>
        <span>${o.items.map(it => `${it.qty}× ${esc(dishById(it.id).name)}`).join(' · ')}</span>
        <span class="t-timer" data-elapsed="${o.code}">${fmtDur(Date.now() - (o.readyTs || o.placedTs))}</span>
        <span class="status-pill st-ready">${STATUS_META.ready.label}</span>
      </div>`).join('')}` : ''}
  ${done.length ? `<h4 class="kds-sec">Đã hoàn tất (${done.length})</h4>
    ${done.map(o => `
      <div class="done-row">
        <b>${o.code}</b><span>${o.items.map(it => `${it.qty}× ${esc(dishById(it.id).name)}`).join(' · ')}</span>
        <span class="status-pill st-served">✓ ${STATUS_META.served.label} ${o.servedTs ? fmtTime(o.servedTs) : ''}</span>
      </div>`).join('')}` : ''}`;
}

/* Ticket đầy đủ chỉ dành cho pending/cooking; đơn ready hiển thị dạng dòng gọn ở renderKDS */
function renderTicket(o) {
  const base = o.status === 'cooking' ? (o.startedTs || o.placedTs) : o.placedTs;
  return `
  <article class="ticket st-${o.status} ${isOverdue(o) ? 'overdue' : ''}">
    <div class="t-top">
      <b>${o.code}</b>
      <span class="t-table">${TABLE_INFO.label}</span>
      <span class="t-timer" data-elapsed="${o.code}">${fmtDur(Date.now() - base)}</span>
      <span class="status-pill st-${o.status}">${STATUS_META[o.status].label}</span>
    </div>
    <ul class="t-items">
      ${o.items.map(it => `<li><b>${it.qty}×</b> ${esc(dishById(it.id).name)}
        ${it.note ? `<small>📝 ${esc(it.note)}</small>` : ''}</li>`).join('')}
    </ul>
    <p class="t-foot">Tạm tính: <b>${fmtVND(orderTotal(o))}</b> · Nhận: ${fmtTime(o.placedTs)}</p>
    ${o.status === 'pending' ? `
      <button class="btn-primary t-btn" data-action="kds-advance" data-code="${o.code}">▶ Bắt đầu nấu</button>`
    : `<button class="btn-primary t-btn" data-action="kds-advance" data-code="${o.code}">✓ Hoàn tất — Chờ phục vụ</button>`}
  </article>`;
}

/* ===================== VAI 3 — WAITER TABLET ===================== */
function renderWaiter() {
  const ready = S.orders.filter(o => o.status === 'ready');
  const cooking = S.orders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const served = S.orders.filter(o => o.status === 'served');
  return `
  <div class="role-head">
    <div><h2>Waiter Tablet</h2><p>Chị Lan · ${TABLE_INFO.label}</p></div>
    <span class="bell ${ready.length ? 'ring' : ''}">🔔${ready.length ? `<b>${ready.length}</b>` : ''}</span>
  </div>

  <h4 class="kds-sec">Sẵn sàng — chờ phục vụ (${ready.length})</h4>
  ${ready.length ? ready.map(o => `
    <article class="ticket st-ready">
      <div class="t-top">
        <b>${o.code}</b><span class="t-table"></span>
        <span class="t-timer" data-elapsed="${o.code}">${fmtDur(Date.now() - (o.readyTs || o.placedTs))}</span>
        <span class="status-pill st-ready">${STATUS_META.ready.label}</span>
      </div>
      <ul class="t-items">
        ${o.items.map(it => `<li><b>${it.qty}×</b> ${esc(dishById(it.id).name)}
          ${it.note ? `<small>📝 ${esc(it.note)}</small>` : ''}</li>`).join('')}
      </ul>
      <button class="btn-primary t-btn" data-action="mark-served" data-code="${o.code}">Đã phục vụ — Bàn 06</button>
    </article>`).join('')
  : `<div class="empty-state small"><span>🔔</span><p>Chưa có món nào sẵn sàng. Sẽ có âm báo khi bếp hoàn tất.</p></div>`}

  <h4 class="kds-sec">Đang chế biến (${cooking.length})</h4>
  ${cooking.length ? cooking.map(o => `
    <div class="done-row muted-row">
      <b>${o.code}</b>
      <span>${o.items.map(it => `${it.qty}× ${esc(dishById(it.id).name)}`).join(' · ')}</span>
      <span class="t-timer" data-elapsed="${o.code}">${fmtDur(Date.now() - o.placedTs)}</span>
      <span class="status-pill st-${o.status}">${STATUS_META[o.status].label}</span>
    </div>`).join('')
  : `<p class="hint">Không có đơn nào đang chế biến.</p>`}

  ${served.length ? `<h4 class="kds-sec">Đã phục vụ hôm nay (${served.length})</h4>
    ${served.map(o => `
      <div class="done-row">
        <b>${o.code}</b>
        <span>${o.items.map(it => `${it.qty}× ${esc(dishById(it.id).name)}`).join(' · ')}</span>
        <span class="status-pill st-served">${STATUS_META.served.label} ${o.servedTs ? fmtTime(o.servedTs) : ''}</span>
      </div>`).join('')}` : ''}`;
}

/* ===================== SỰ KIỆN ===================== */
document.addEventListener('click', e => {
  ensureAudio();
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const id = el.dataset.id;

  switch (el.dataset.action) {
    /* Screen 0 + Role Switcher */
    case 'select-role':
      S.role = el.dataset.role; S.ui = 'idle';
      if (S.role === 'customer' && !S.chat.length) aiSay(COPY.GREETING);
      persist(); render(); break;
    case 'logout': S.role = null; closeAllPanels(); S.ui = 'idle'; persist(); render(); break;

    /* Demo bar */
    case 'reset-demo':
      try { localStorage.removeItem(STORE_KEY); } catch (err) {}
      S = freshState(); render(); break;
    case 'retry-network': retryNetwork(); break;

    /* E-Menu */
    case 'add-item': addToDraft({ id, qty: 1, note: '' }); render(); persist(); break;
    case 'add-suggestion': {
      addToDraft({ id, qty: 1, note: '' });
      aiSay(`Đã thêm 1× ${dishById(id).name} (món thay thế) vào bản nháp ạ.`);
      S.ui = 'idle'; S.lastOos = null;
      render(); persist(); break;
    }
    case 'dismiss-oos': S.ui = 'idle'; S.lastOos = null; render(); break;

    /* Voice sheet */
    case 'open-voice':
      S.voiceOpen = true;
      S.ui = S.draft.length ? 'order-draft' : 'empty';   /* FLOW A: mic → draft / giỏ trống */
      render(); break;
    case 'close-voice': S.voiceOpen = false; S.ui = 'idle'; render(); break;
    case 'mic-toggle': toggleMic(); break;
    case 'scenario': runVoiceText(VOICE_SCENARIOS[Number(el.dataset.i)].text); break;

    /* Order Draft */
    case 'open-draft':
      S.draftOpen = true;
      S.ui = S.draft.length ? 'order-draft' : 'empty';
      render(); break;
    case 'close-draft': S.draftOpen = false; S.ui = 'idle'; render(); break;
    case 'inc-item': if (S.draft[el.dataset.i]) { S.draft[el.dataset.i].qty += 1; } render(); persist(); break;
    case 'dec-item': {
      const it = S.draft[el.dataset.i];
      if (it) { it.qty -= 1; if (it.qty <= 0) S.draft.splice(Number(el.dataset.i), 1); }
      render(); persist(); break;
    }
    case 'remove-item': S.draft.splice(Number(el.dataset.i), 1); render(); persist(); break;

    /* Explicit Confirmation (BR-RO-03) */
    case 'open-confirm': if (S.draft.length && !draftHasOos()) { S.ui = 'confirm'; render(); } break;
    case 'cancel-confirm': S.ui = 'order-draft'; render(); break;
    case 'confirm-send': sendToKitchen(); break;
    case 'close-success': S.successOrder = null; S.ui = 'idle'; render(); break;

    /* Clarification (BR-RO-04) */
    case 'pick-candidate': {
      const qty = S.ambiguity ? S.ambiguity.qty : 1;
      addToDraft({ id, qty, note: '' });
      aiSay(`Đã chọn ${qty}× ${dishById(id).name} vào bản nháp ạ.`);
      S.ambiguity = null; S.ui = 'idle';
      render(); persist(); break;
    }
    case 'dismiss-ambiguous':
      S.ambiguity = null; S.ui = 'idle';
      aiSay('Dạ không sao ạ, khi nào sẵn sàng anh/chị chọn lại món nhé.');
      render(); break;

    /* KDS + Waiter */
    case 'kds-advance': kdsAdvance(el.dataset.code); break;
    case 'mark-served': markServed(el.dataset.code); break;

    /* REQ-RO-09 */
    case 'toggle-stock': toggleStock(id); break;
  }
});

/* Công tắc mô phỏng lỗi mạng */
document.addEventListener('change', e => {
  const el = e.target.closest('[data-action="toggle-network"]');
  if (!el) return;
  S.networkDown = el.checked;
  if (!S.networkDown && S.ui === 'network-error') S.ui = 'idle';
  persist(); render();
});

/* Ô "Chạm để nói hoặc nhập món ăn..." — cùng bộ NLU với giọng nói */
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form="command"]');
  if (!f) return;
  e.preventDefault();
  const inp = $('#cmd');
  const text = (inp.value || '').trim();
  if (!text) return;
  inp.value = '';
  runVoiceText(text);
});

/* Đồng hồ + timer ticket (REQ-RO-08: đỏ khi chờ quá 15 phút) */
setInterval(() => {
  $$('[data-elapsed]').forEach(el => {
    const o = S.orders.find(x => x.code === el.dataset.elapsed);
    if (!o) return;
    const base = o.status === 'ready' ? (o.readyTs || o.placedTs)
      : o.status === 'cooking' ? (o.startedTs || o.placedTs) : o.placedTs;
    el.textContent = fmtDur(Date.now() - base);
    if (el.closest('.ticket')) el.closest('.ticket').classList.toggle('overdue', isOverdue(o));
  });
  const clock = $('[data-clock]');
  if (clock) clock.textContent = fmtTime(Date.now());
}, 1000);

render();
