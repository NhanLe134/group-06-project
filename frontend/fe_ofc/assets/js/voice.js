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

  if (parsed.suggestions?.length || parsed.recommendations?.length) {
    vAiSay(parsed.message || 'Dạ, anh/chị muốn dùng món nào ạ?');
  } else if (parsed.not_found?.length) {
    vAiSay(parsed.message || `Dạ, em chưa tìm thấy ${parsed.not_found.join(', ')} trong thực đơn ạ.`);
  } else if (parsed.warnings?.length) {
    vRender();
    return;
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
  const draftTotals = draft.reduce((totals, item) => {
    totals[item.id] = (totals[item.id] || 0) + item.qty;
    return totals;
  }, {});
  try {
    const parsed = await apiFetch('/api/v1/ai/voice-parse', {
      method: 'POST',
      body: JSON.stringify({
        transcript: text,
        table_name: typeof tableName === 'string' ? tableName : null,
        draft: Object.entries(draftTotals).map(([item_id, quantity]) => ({ item_id, quantity })),
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

/* FAB — dùng data-action="v-open" trong HTML */
document.getElementById('voice-fab')
  .addEventListener('click', vOpenSheet);
