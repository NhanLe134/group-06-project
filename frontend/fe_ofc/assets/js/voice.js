/* =====================================================================
   voice.js — US-02 (Ny): Trợ lý Voice AI
   Lấy nguyên code từ prototype/js/app.js, thích nghi sang customer.html.
   - Dùng đúng CATALOG, QUANTITY_WORDS, COPY, VOICE_SCENARIOS từ data.js/mock-data.js
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

/* ───────── Truy vấn CATALOG (dùng lại từ mock-data.js) ───────── */
const vDishById  = id => CATALOG.find(d => d.id === id);
const vIsOos     = id => vDishById(id)?.status === 'Out of Stock';
const vDraftUnits = () => draft.reduce((n,it)=>n+it.qty,0);     /* draft từ customer.js */
const vDraftTotal = () => draft.reduce((n,it)=>n+it.qty*vDishById(it.id).price,0);

/* ───────── NLU — copy nguyên từ prototype/js/app.js ───────── */
function vParseUtterance(raw) {
  const text = String(raw).trim();
  const res = { adds:[], ambiguities:[], oos:[], notFound:[], done:false };

  if (normV(text).includes('chon mon xong')) { res.done = true; return res; }

  const segs = text.split(/\s*(?:,|\svà\s|\svới\s)\s*/i).map(s=>s.trim()).filter(Boolean);
  segs.forEach(seg => {
    let n = normV(seg).replace(/^(cho|them|lay|order)\s+/,'');
    let qty = 1;
    const mQty = n.match(/^(\d+|mot|hai|ba|bon|nam|sau)\b\s*/);
    if (mQty) { qty = QUANTITY_WORDS[mQty[1]] || parseInt(mQty[1],10) || 1; n = n.slice(mQty[0].length); }

    const scored = CATALOG.map(d => {
      let score = 0;
      d.kwStrong.forEach(k => { if (n.includes(k)) score += k.split(' ').length * 2; });
      d.kwWeak.forEach(k   => { if (n.includes(k)) score += 1; });
      return { d, score };
    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score);

    if (!scored.length) { res.notFound.push(seg); return; }

    const top  = scored[0];
    const tied = scored.filter(x => x.score === top.score);
    if (tied.length === 1) { vResolveSeg(res, top.d, qty, seg); return; }

    const weakHits = tied.map(x => x.d.kwWeak.filter(k => n.includes(k)));
    const shared   = weakHits.reduce((acc,cur)=>acc.filter(k=>cur.includes(k)), weakHits[0]||[]);
    const candidates = tied.map(x=>x.d).filter(d => shared.some(k => normV(d.name).split(' ')[0]===k));
    if (candidates.length > 1) {
      res.ambiguities.push({ qty, candidates: candidates.map(d=>d.id), segment: seg });
    } else {
      vResolveSeg(res, top.d, qty, seg);
    }
  });
  return res;
}

function vResolveSeg(res, dish, qty, seg) {
  if (vIsOos(dish.id)) {
    res.oos.push({ id: dish.id, qty, suggestions: vSuggestFor(dish) });
  } else {
    const notes=[], re=/không\s+([\p{L}]+)/gu; let m;
    while ((m=re.exec(String(seg).toLowerCase()))) notes.push('Không '+m[1]);
    res.adds.push({ id: dish.id, qty, note: notes.join(', ') });
  }
}

function vSuggestFor(dish) {
  const hits=[...dish.kwStrong,...dish.kwWeak];
  return CATALOG.filter(d => d.id!==dish.id && !vIsOos(d.id) &&
    [...d.kwStrong,...d.kwWeak].some(k=>hits.includes(k)));
}

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

/* ───────── Apply parse — copy logic từ prototype applyParse() ───────── */
function vApplyParse(parsed) {
  VS.ui = 'idle';

  if (parsed.done) {
    vCloseSheet();
    openDraft();   /* hàm openDraft từ customer.js */
    vAiSay(COPY.DONE_MSG);
    vRender(); return;
  }

  if (parsed.ambiguities.length) {
    VS.ambiguity = parsed.ambiguities[0];
    VS.ui = 'ambiguous';
    vAiSay(vAmbiguityQuestion(VS.ambiguity));
    vRender(); return;
  }

  if (parsed.oos.length) {
    const o = parsed.oos[0];
    const d = vDishById(o.id);
    vAiSay(
      `"${d.name}" ${COPY.OOS_MSG}`,
      o.suggestions.map(s=>({ id:s.id, label:`<i class="ph-bold ph-plus"></i> ${s.name} · ${fmtVND(s.price)}` }))
    );
    vRender(); return;
  }

  if (parsed.adds.length) {
    parsed.adds.forEach(({ id, qty, note }) => addToDraft(id, qty, note)); /* addToDraft từ customer.js */
    vAiSay('Đã thêm vào bản nháp: ' +
      parsed.adds.map(a=>`${a.qty}× ${vDishById(a.id).name}${a.note?` (${a.note})`:''}`).join(', ') +
      '. Anh/chị bấm "Xem đơn" để dò lại trước khi gửi bếp nhé ạ.');
    renderStickyBar();  /* cập nhật thanh dưới — từ customer.js */
    vRender(); return;
  }

  if (parsed.notFound.length) {
    vAiSay(`Em không tìm thấy món "${parsed.notFound.join('", "')}" trong menu. Anh/chị thử gọi tên khác nhé ạ.`);
  }
  vRender();
}

/* ───────── Luồng text (giả lập như prototype runVoiceText) ───────── */
function vRunText(text) {
  VS.chat.push({ from:'user', text });
  VS.interim = text;
  VS.ui = 'listening';
  vRender();
  setTimeout(()=>{ VS.ui='processing'; vRender(); }, 400);
  setTimeout(()=>{ vApplyParse(vParseUtterance(text)); }, 1200);
}

/* ───────── Web Speech API — copy nguyên từ prototype toggleMic() ───────── */
function vToggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    vAiSay('Trình duyệt này chưa hỗ trợ nhận giọng nói. Anh/chị dùng các câu mẫu bên dưới hoặc gõ vào ô bên dưới nhé ạ.');
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
      VS.chat.push({ from:'user', text: final.trim() });
      VS.ui = 'processing'; vRender();
      setTimeout(()=>{ vApplyParse(vParseUtterance(final.trim())); }, 900);
    } else { vRender(); }
  };
  recognition.onerror = ev => {
    VS.ui = 'idle'; VS.interim = '';
    /* AC4: chỉ khi no-speech (tiếng ồn) mới bật text fallback */
    if (ev.error === 'no-speech' || ev.error === 'audio-capture') {
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
            <span style="font-size:22px">${d.emoji}</span>
            <span class="v-cand-info"><b>${escV(d.name)}</b><small>${fmtVND(d.price)}</small></span>
            <span class="v-cand-add">${oos ? 'Hết' : 'Chọn'}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn-mini-v" data-action="v-dismiss-ambiguous">Để sau</button>
    </div>`;
  }

  /* ── Scenarios ── */
  const scenarioHTML = VOICE_SCENARIOS.map((sc, i) => `
    <button class="chip-flow" data-action="v-scenario" data-i="${i}" ${busy?'disabled':''}
      title="${escV(sc.text)}">
      <small>${sc.tag}</small>${escV(sc.text)}
    </button>`).join('');

  /* ── Chat ── */
  const chatHTML = VS.chat.map(m => `
    <div class="msg ${m.from}">
      ${m.from==='ai' ? '<span class="msg-ava"><i class="ph-duotone ph-robot"></i></span>' : ''}
      <div class="bubble">
        <p>${escV(m.text)}</p>
        ${m.chips ? `<div class="chips-row">${m.chips.map(ch =>
          `<button class="chip" data-action="v-add-sug" data-id="${ch.id}">${ch.label}</button>`
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
    case 'v-scenario':          vRunText(VOICE_SCENARIOS[Number(el.dataset.i)].text); break;
    case 'v-dismiss-ambiguous':
      VS.ambiguity = null; VS.ui = 'idle';
      vAiSay('Dạ không sao ạ, khi nào sẵn sàng anh/chị chọn lại nhé.');
      vRender(); break;
    case 'v-pick': {
      const qty = VS.ambiguity ? VS.ambiguity.qty : 1;
      addToDraft(el.dataset.id, qty, '');
      vAiSay(`Đã chọn ${qty}× ${vDishById(el.dataset.id).name} vào bản nháp ạ.`);
      VS.ambiguity = null; VS.ui = 'idle';
      renderStickyBar();
      vRender(); break;
    }
    case 'v-add-sug': {
      addToDraft(el.dataset.id, 1, '');
      vAiSay(`Đã thêm 1× ${vDishById(el.dataset.id).name} (món thay thế) vào bản nháp ạ.`);
      VS.ui = 'idle';
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
