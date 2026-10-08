/* =====================================================================
   voice.js — US-02 (Ny): Trợ lý Voice AI
   Lấy nguyên code từ prototype/js/app.js, thích nghi sang customer.html.
   - Gửi transcript lên backend; chỉ dùng COPY/VOICE_SCENARIOS cho nội dung giao diện
   - FAB + Voice Sheet render vào DOM tĩnh đã có trong customer.html
   - Tất cả event dùng data-action giống prototype → 1 listener duy nhất
   ===================================================================== */
'use strict';

/* ───────── Tiện ích (giống prototype) ───────── */
const escV = s => String(s).replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function normV(t) {
  return String(t).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')
    .replace(/\s+/g,' ').trim();
}

/* ───────── State voice ───────── */
const VS = {
  open: false,
  ui: 'idle',        /* idle | listening | processing | ambiguous */
  chat: [],
  interim: '',
  ambiguity: null,
  pendingDraftRemoval: null,
  noisy: false,      /* AC4: true khi lỗi no-speech → hiện text fallback */
};

let recognition = null;
let recognitionFailures = 0;

/* ───────── Truy vấn CATALOG (dùng lại từ mock-data.js) ───────── */
const vDishById = id =>
  (typeof MENU !== 'undefined' ? MENU.find(d => d.id === id) : null);
const vIsOos     = id => ['out_of_stock', 'Out of Stock'].includes(vDishById(id)?.status);
const vDraftUnits = () => draft.reduce((n,it)=>n+it.qty,0);     /* draft từ customer.js */
const vDraftTotal = () => draft.reduce((n,it)=>n+it.qty*vDishById(it.id).price,0);

/* Transcript NLU is handled by the backend endpoint. */

function vAmbiguityQuestion(a) {
  const ds = a.candidates.map(vDishById);
  const first = ds[0].name.split(' ')[0];
  const same  = ds.every(d => normV(d.name).split(' ')[0]===normV(first));
  const list  = ds.map(d=>`${d.name} (${fmtVND(d.price)})`).join(' và ');
  return `Quán có ${ds.length} món ${same?first.toLowerCase():'phù hợp'}: ${list}. Bạn muốn chọn món nào?`;
}

/* ───────── AI chat ───────── */
function vAiSay(text, chips) {
  VS.chat.push({ from:'ai', text, chips: chips||null });
  if (VS.chat.length > 60) VS.chat.splice(0, VS.chat.length-60);
}

function vVoiceToast(message) {
  let toast = document.getElementById('voice-warning-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'voice-warning-toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: '9999', padding: '12px 18px', borderRadius: '12px',
      background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74',
      boxShadow: '0 8px 24px #0f172a26', fontWeight: '600', maxWidth: '90vw',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  clearTimeout(vVoiceToast.timer);
  vVoiceToast.timer = setTimeout(() => toast.remove(), 5000);
}

/* ───────── Apply parse — copy logic từ prototype applyParse() ───────── */
function vApplyParse(parsed) {
  VS.ui = 'idle';
  VS.pendingDraftRemoval = parsed.pending_draft_removal || null;

  if (parsed.remove_from_draft?.length) {
    const removeIds = new Set(parsed.remove_from_draft);
    draft = draft.filter(item => !removeIds.has(item.id));
    VS.pendingDraftRemoval = null;
    renderStickyBar();
    renderMenu();
    if (draftOpen) renderDraft();
    vAiSay(parsed.message || 'Dạ, em đã cập nhật giỏ hàng cho anh/chị rồi ạ.');
    vRender();
    return;
  }

  if (parsed.draft_changes?.length) {
    for (const change of parsed.draft_changes) {
      const matching = draft.filter(item => item.id === change.item_id);
      if (!matching.length) continue;
      const total = matching.reduce((sum, item) => sum + item.qty, 0);
      const target = Math.max(0, Number(change.quantity) || 0);
      if (target < total) {
        let remove = total - target;
        for (let i = draft.length - 1; i >= 0 && remove > 0; i--) {
          if (draft[i].id !== change.item_id) continue;
          const removed = Math.min(draft[i].qty, remove);
          draft[i].qty -= removed;
          remove -= removed;
          if (draft[i].qty <= 0) draft.splice(i, 1);
        }
      } else if (target > total) {
        matching[0].qty += target - total;
      }
    }
    renderStickyBar();
    renderMenu();
    if (draftOpen) renderDraft();
    vAiSay(parsed.message || 'Dạ, em đã cập nhật số lượng trong giỏ hàng ạ.');
    vRender();
    return;
  }

  if (parsed.draft_note_updates?.length) {
    for (const update of parsed.draft_note_updates) {
      const matching = draft.filter(item => item.id === update.item_id);
      if (!matching.length) continue;
      const quantity = matching.reduce((sum, item) => sum + item.qty, 0);
      draft = draft.filter(item => item.id !== update.item_id);
      draft.push({ id: update.item_id, qty: quantity, note: update.note || '' });
    }
    renderStickyBar();
    renderMenu();
    if (draftOpen) renderDraft();
    vAiSay(parsed.message || 'Dạ, em đã cập nhật ghi chú món trong giỏ hàng ạ.');
    vRender();
    return;
  }

  if (parsed.done) {
    vCloseSheet();
    openDraft();   /* hàm openDraft từ customer.js */
    vAiSay(COPY.DONE_MSG);
    vRender(); return;
  }

  if (parsed.stock_limits?.length) {
    const limit = parsed.stock_limits[0];
    vVoiceToast(`Chỉ còn ${limit.available} phần ${limit.item_name}; giỏ nháp được giữ nguyên.`);
    vAiSay(
      parsed.message || `Dạ món ${limit.item_name} hiện chỉ còn ${limit.available} phần. Anh/chị có muốn lấy số lượng đó không ạ?`,
      limit.available > 0 ? [{
        id: limit.item_id, qty: limit.available,
        label: `Lấy ${limit.available} phần ${limit.item_name}`,
        stockAccept: true,
      }] : null,
    );
    vRender(); return;
  }

  if (parsed.ambiguities.length) {
    VS.ambiguity = parsed.ambiguities[0];
    VS.ui = 'ambiguous';
    vAiSay(parsed.message || vAmbiguityQuestion(VS.ambiguity));
    vRender(); return;
  }

  if (parsed.oos.length) {
    const o = parsed.oos[0];
    const d = vDishById(o.id);
    vAiSay(
      parsed.message || `"${d.name}" ${COPY.OOS_MSG}`,
      o.suggestions.map(id => vDishById(id)).filter(Boolean)
        .map(s=>({ id:s.id, label:`<i class="ph-bold ph-plus"></i> ${s.name} · ${fmtVND(s.price)}` }))
    );
    vRender(); return;
  }

  if (parsed.adds.length) {
    parsed.adds.forEach(({ id, qty, note }) => addToDraft(id, qty, note)); /* addToDraft từ customer.js */
    vAiSay(parsed.message || 'Dạ, em đã ghi nhận món. Anh/chị có muốn gọi thêm món nào nữa không ạ?');
    renderStickyBar();  /* cập nhật thanh dưới — từ customer.js */
    vRender(); return;
  }

  /* ── Intent A: Tư vấn theo từ khóa / nguyên liệu ── */
  if (parsed.intent === 'recommendation' || parsed.suggestions?.length || parsed.recommendations?.length) {
    const chips = (parsed.suggestions || []).concat(parsed.recommendations || [])
      .map(s => ({
        id: s.id,
        label: `<i class="ph-bold ph-plus"></i> ${escV(s.name)} · ${fmtVND(s.price)}`,
      }));
    vAiSay(
      parsed.message || 'Dạ, anh/chị muốn dùng món nào ạ?',
      chips.length ? chips : null,
    );
    vRender(); return;
  }

  /* ── Intent B: Cảnh báo dị ứng ── */
  if (parsed.warnings?.length) {
    const w = parsed.warnings[0];
    const altChips = (parsed.recommendations || []).map(s => ({
      id: s.id,
      label: `<i class="ph-bold ph-plus"></i> ${escV(s.name)} · ${fmtVND(s.price)}`,
    }));
    vAiSay(
      parsed.message || w.message,
      altChips.length ? altChips : null,
    );
    vRender(); return;
  }

  if (parsed.not_found?.length) {
    vAiSay(parsed.message || `Dạ, em chưa tìm thấy ${parsed.not_found.join(', ')} trong thực đơn ạ.`);
  } else if (parsed.message) {
    vAiSay(parsed.message);
  }
  vRender();
}

/* ───────── Gửi transcript lên backend NLU ───────── */
async function vRunText(text) {
  VS.chat.push({ from:'user', text });
  VS.interim = text;
  VS.ui = 'processing';
  vRender();
  try {
    const parsed = await apiFetch('/api/v1/ai/voice-parse', {
      method: 'POST',
      body: JSON.stringify({
        transcript: text,
        table_name: typeof tableName === 'string' ? tableName : null,
        draft: draft.map(item => ({
          item_id: item.id,
          quantity: item.qty,
          note: item.note || '',
        })),
        pending_draft_removal: VS.pendingDraftRemoval,
      }),
    });
    recognitionFailures = 0;
    vApplyParse(parsed);
  } catch (error) {
    VS.ui = 'idle';
    VS.noisy = true;
    vVoiceToast('Không kết nối được AI; giỏ nháp vẫn được giữ nguyên. Vui lòng nhập tên món bằng bàn phím.');
    vAiSay(error.message || 'Em chưa phân tích được yêu cầu. Anh/chị vui lòng thử lại nhé ạ.');
    vRender();
  }

}

/* ───────── Web Speech API — copy nguyên từ prototype toggleMic() ───────── */
function vToggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    VS.noisy = true;
    vAiSay('Trình duyệt chưa hỗ trợ micro. Anh/chị vui lòng nhập tên món bằng bàn phím nhé ạ.');
    vRender(); return;
  }
  if (VS.ui === 'listening' && recognition) { try { recognition.stop(); } catch(e){} return; }
  recognition = new SR();
  recognition.lang = 'vi-VN';
  recognition.interimResults = true;
  recognition.continuous = false;
  VS.interim = ''; VS.ui = 'listening'; VS.noisy = false;
  vRender(); vUpdateFab();

  recognition.onresult = e => {
    let interim='', final='';
    for (const r of e.results) { if (r.isFinal) final+=r[0].transcript; else interim+=r[0].transcript; }
    VS.interim = (final||interim).trim();
    if (final) {
      vRunText(final.trim());
    } else { vRender(); }
  };
  recognition.onerror = ev => {
    VS.ui = 'idle'; VS.interim = '';
    /* AC4: hai lần lỗi nhận diện liên tiếp mới chuyển sang text fallback. */
    recognitionFailures += 1;
    if (['no-speech', 'audio-capture', 'not-allowed', 'service-not-allowed'].includes(ev.error) && recognitionFailures >= 2) {
      VS.noisy = true;
      vAiSay('Không nhận diện được giọng nói do tiếng ồn. Vui lòng nhập tên món bằng bàn phím.');
    } else {
      vAiSay(`Em chưa nghe rõ (${ev.error}). Anh/chị nói lại hoặc nhập bằng bàn phím nhé ạ.`);
    }
    vRender(); vUpdateFab();
  };
  recognition.onend = ()=>{ if (VS.ui==='listening'){ VS.ui='idle'; vRender(); vUpdateFab(); } };
  try { recognition.start(); } catch(e){}
}

/* ───────── Mở / đóng sheet ───────── */
function vOpenSheet() {
  VS.open = true;
  VS.noisy = false;
  if (!VS.chat.length) vAiSay(COPY.GREETING);
  document.getElementById('voice-sheet').classList.add('open');
  document.getElementById('voice-sheet-overlay').classList.add('active');
  vRender();
}
function vCloseSheet() {
  VS.open = false;
  if (recognition) { try { recognition.stop(); } catch(e){} }
  VS.ui = 'idle'; VS.interim = '';
  vUpdateFab();
  document.getElementById('voice-sheet').classList.remove('open');
  document.getElementById('voice-sheet-overlay').classList.remove('active');
}

function vUpdateFab() {
  const fab = document.getElementById('voice-fab');
  if (fab) fab.className = `voice-fab${VS.ui==='listening'?' listening':''}`;
}

/* ───────── RENDER — khớp CSS mới ───────── */
function vRender() {
  const inner = document.getElementById('voice-sheet-inner');
  if (!inner) return;

  const busy = VS.ui === 'listening' || VS.ui === 'processing';

  /* ── Mini draft ── */
  const miniDraft = vDraftUnits()
    ? `<div class="v-mini-draft"><b>Đang chọn:</b> ${draft.map(it=>`${it.qty}× ${escV(vDishById(it.id).name)}`).join(' · ')} — <b>${fmtVND(vDraftTotal())}</b></div>`
    : `<div class="v-mini-draft empty">${COPY.EMPTY}</div>`;

  /* ── Stage ── */
  let stageInner = '';
  if (VS.ui === 'listening') {
    stageInner = `
      <button class="v-mic-live" data-action="v-mic" aria-label="Dừng nghe">
        <span class="wave"></span><span class="wave"></span><span class="wave"></span>
      </button>
      <p class="v-stage-hint live">${COPY.LISTENING}</p>
      ${VS.interim ? `<p class="v-transcript">"${escV(VS.interim)}"</p>` : ''}`;
  } else if (VS.ui === 'processing') {
    stageInner = `
      <div class="v-spinner" aria-hidden="true"></div>
      <p class="v-stage-hint">${COPY.PROCESSING}</p>
      ${VS.interim ? `<p class="v-transcript">"${escV(VS.interim)}"</p>` : ''}`;
  } else {
    stageInner = `
      <button class="v-btn-mic" data-action="v-mic">
        <i class="ph-duotone ph-microphone"></i> Bấm micro để nói
      </button>
      <p class="v-stage-hint">Hoặc chọn câu mẫu / gõ tên món bên dưới</p>`;
  }

  /* ── Clarification ── */
  let clarifyHTML = '';
  if (VS.ambiguity && VS.ui === 'ambiguous') {
    clarifyHTML = `
    <div class="v-clarify">
      <p class="v-clarify-q"><i class="ph-duotone ph-robot"></i> ${escV(vAmbiguityQuestion(VS.ambiguity))}</p>
      <div class="v-cand-list">
        ${VS.ambiguity.candidates.map(id => {
          const d = vDishById(id), oos = vIsOos(id);
          return `<button class="v-cand ${oos?'oos':''}" data-action="v-pick" data-id="${d.id}" ${oos?'disabled':''}>
            <span style="font-size:22px">${d.emoji || '<i class="ph-duotone ph-fork-knife"></i>'}</span>
            <span class="v-cand-info"><b>${escV(d.name)}</b><small>${fmtVND(d.price)}</small></span>
            <span class="v-cand-add">${oos ? 'Hết' : 'Chọn'}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn-mini-v" data-action="v-dismiss-ambiguous">Để sau</button>
    </div>`;
  }

  /* ── Scenarios ── */
  const scenarioHTML = '';

  /* ── Chat ── */
  const chatHTML = VS.chat.map(m => `
    <div class="msg ${m.from}">
      ${m.from==='ai' ? '<span class="msg-ava"><i class="ph-duotone ph-robot"></i></span>' : ''}
      <div class="bubble">
        <p>${escV(m.text)}</p>
        ${m.chips ? `<div class="chips-row">${m.chips.map(ch =>
          `<button class="chip" data-action="${ch.stockAccept ? 'v-stock-accept' : 'v-add-sug'}" data-id="${ch.id}" data-qty="${ch.qty || 1}">${ch.label}</button>`
        ).join('')}</div>` : ''}
      </div>
    </div>`).join('');

  /* ── Text fallback banner (chỉ khi noisy) ── */
  const fallbackHTML = VS.noisy ? `
    <div class="v-text-fallback show">
      <div class="v-fallback-banner">
        <i class="ph-fill ph-warning-circle"></i>
        Không nhận diện được giọng nói do tiếng ồn. Vui lòng nhập tên món bằng bàn phím.
      </div>
    </div>` : '';

  inner.innerHTML = `
    <div class="v-head">
      <div class="v-head-icon"><i class="ph-duotone ph-robot"></i></div>
      <div class="v-head-text">
        <b>Trợ lý gọi món AI</b>
        <small>${VS.ui === 'listening' ? 'Đang nghe…' : VS.ui === 'processing' ? 'Đang xử lý…' : 'Chế độ chờ'}</small>
      </div>
      <button class="v-close" data-action="v-close" aria-label="Đóng">
        <i class="ph-bold ph-x"></i>
      </button>
    </div>

    ${miniDraft}

    <div class="v-stage">${stageInner}</div>

    ${clarifyHTML}

    <div class="v-scenarios">${scenarioHTML}</div>

    <div class="v-chat" id="v-chat" aria-live="polite">
      ${chatHTML || '<p style="color:#94A3B8;font-size:13px;text-align:center;font-style:italic;margin:auto;">Trợ lý sẵn sàng lắng nghe…</p>'}
    </div>

    ${fallbackHTML}

    <form id="v-text-form" class="v-bottom">
      <input id="v-text-input" type="text" class="v-text-input"
        placeholder="Hoặc gõ món ăn (vd: 1 phở bò không hành)…"
        autocomplete="off" ${busy ? 'disabled' : ''}>
      <button type="submit" class="v-text-send" ${busy ? 'disabled' : ''} aria-label="Gửi">
        <i class="ph-bold ph-paper-plane-right"></i>
      </button>
    </form>
  `;

  const chat = document.getElementById('v-chat');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

/* ───────── Một listener click duy nhất (giống prototype) ───────── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const action = el.dataset.action;

  switch (action) {
    case 'v-open':              vOpenSheet(); break;
    case 'v-close':             vCloseSheet(); break;
    case 'v-mic':               vToggleMic(); break;
    case 'v-dismiss-ambiguous':
      VS.ambiguity = null; VS.ui = 'idle';
      vAiSay('Dạ không sao ạ, khi nào sẵn sàng anh/chị chọn lại nhé.');
      vRender(); break;
    case 'v-pick': {
      const ambiguity = VS.ambiguity;
      const qty = ambiguity ? ambiguity.qty : 1;
      const name = vDishById(el.dataset.id)?.name;
      const note = ambiguity?.segment.match(/(?:không\s+(?:lấy\s+)?[\p{L}]+|bỏ\s+[\p{L}]+|ít\s+[\p{L}]+|nhiều\s+[\p{L}]+|thêm\s+[\p{L}]+)/iu)?.[0] || '';
      VS.ambiguity = null;
      VS.ui = 'idle';
      vRunText(`${qty} ${name}${note ? ` ${note}` : ''}`);
      break;
    }
    case 'v-add-sug': {
      const name = vDishById(el.dataset.id)?.name;
      if (name) vRunText(`1 ${name}`);
      break;
    }
    case 'v-stock-accept': {
      addToDraft(el.dataset.id, Number(el.dataset.qty) || 1, '');
      vAiSay(`Dạ, em đã thêm ${el.dataset.qty} phần ${vDishById(el.dataset.id).name} vào giỏ nháp ạ.`);
      renderStickyBar();
      vRender(); break;
    }
  }
});

/* Submit text fallback */
document.addEventListener('submit', e => {
  if (e.target.id !== 'v-text-form') return;
  e.preventDefault();
  const inp = document.getElementById('v-text-input');
  const text = (inp?.value||'').trim();
  if (!text) return;
  inp.value = '';
  vRunText(text);
});

/* Overlay đóng sheet */
document.getElementById('voice-sheet-overlay')
  .addEventListener('click', vCloseSheet);

/* ───────── FAB: click ngắn = mở voice sheet, nhấn giữ = drag ───────── */
(function initFabDrag() {
  const fab = document.getElementById('voice-fab');
  if (!fab) return;

  const HOLD_MS   = 200;   /* giữ bao lâu mới tính là drag */
  const MOVE_PX   = 6;     /* di chuyển quá ngưỡng này thì hủy click */
  const MARGIN    = 12;    /* khoảng cách tối thiểu đến mép màn hình */

  let holdTimer   = null;
  let dragging    = false;
  let startX      = 0, startY = 0;
  let offsetX     = 0, offsetY = 0;  /* vị trí con trỏ so với góc fab */
  let hasMoved    = false;

  /* Đặt fab về vị trí fixed tuyệt đối */
  function applyPos(x, y) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const w  = fab.offsetWidth,   h  = fab.offsetHeight;
    x = Math.max(MARGIN, Math.min(vw - w - MARGIN, x));
    y = Math.max(MARGIN, Math.min(vh - h - MARGIN, y));
    fab.style.right  = 'unset';
    fab.style.bottom = 'unset';
    fab.style.left   = x + 'px';
    fab.style.top    = y + 'px';
  }

  function onMoveGlobal(ex, ey) {
    /* Tính hasMoved bất kể dragging hay chưa — để touch move sớm vẫn được ghi nhận */
    const dx = ex - startX, dy = ey - startY;
    if (!hasMoved && (Math.abs(dx) > MOVE_PX || Math.abs(dy) > MOVE_PX)) {
      hasMoved = true;
      /* Kích hoạt drag ngay khi di chuyển đủ, không cần chờ holdTimer */
      if (!dragging) {
        clearTimeout(holdTimer);
        dragging = true;
        fab.classList.add('dragging');
      }
    }
    if (dragging && hasMoved) {
      applyPos(ex - offsetX, ey - offsetY);
    }
  }

  function onUpGlobal() {
    clearTimeout(holdTimer);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend',  onTouchEnd);
    fab.classList.remove('dragging');
    const wasDragging = dragging && hasMoved;
    dragging = false;
    /* nếu không di chuyển → tính là click → mở voice sheet */
    if (!wasDragging) vOpenSheet();
  }

  function startHold(ex, ey) {
    startX  = ex; startY = ey;
    hasMoved = false;
    const rect = fab.getBoundingClientRect();
    offsetX = ex - rect.left;
    offsetY = ey - rect.top;
    holdTimer = setTimeout(() => {
      dragging = true;
      fab.classList.add('dragging');
    }, HOLD_MS);
  }

  /* Mouse */
  function onMouseMove(e) { onMoveGlobal(e.clientX, e.clientY); }
  function onMouseUp()    { onUpGlobal(); }
  fab.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    startHold(e.clientX, e.clientY);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  });

  /* Touch */
  function onTouchMove(e) {
    const t = e.touches[0];
    /* Luôn ngăn scroll khi đang trong session drag (dù chưa activate dragging)
       để tránh browser scroll cuỗn trang trước khi timer kích hoạt */
    e.preventDefault();
    onMoveGlobal(t.clientX, t.clientY);
  }
  function onTouchEnd() { onUpGlobal(); }
  fab.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startHold(t.clientX, t.clientY);
    /* passive: false BẮT BUỘC để preventDefault() trong touchmove có tác dụng */
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend',  onTouchEnd);
  }, { passive: false });   /* passive: false để cho phép preventDefault ngay tại touchstart nếu cần */
})();
