/* =====================================================================
   realtime.js — Nghe sự kiện WebSocket từ Backend FastAPI (dùng chung
   waiter + customer). Kênh: `kds:tickets` (vòng đời món), `menu:oos` (Hết hàng).
   Envelope chuẩn: { event, payload, emitted_at } (api-contract.md Mục 5).
   Địa chỉ backend giống api.js: ưu tiên APP_CONFIG.API_BASE_URL (config.js — localhost khi dev,
   Render khi deploy), thiếu config.js thì dùng hostname:8000. http → ws, https → wss.
   ===================================================================== */

'use strict';

/** Địa chỉ WebSocket từ địa chỉ API: http → ws, https → wss (có unit test: frontend/tests/). */
function wsBaseFrom(apiBase, loc) {
  return (apiBase || `${loc.protocol}//${loc.hostname}:8000`).replace(/^http/, 'ws').replace(/\/$/, '');
}

const WS_BASE = wsBaseFrom(window.APP_CONFIG?.API_BASE_URL, location);

/** Đăng ký nghe 1 kênh; mất kết nối thì tự nối lại sau 3 giây. */
function subscribeChannel(channel, onMessage) {
  let ws;
  const open = () => {
    ws = new WebSocket(`${WS_BASE}/ws/${channel}`);
    ws.onmessage = ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      try { onMessage(msg); } catch (e) { console.error('[realtime]', e); }
    };
    ws.onclose = () => setTimeout(open, 3000);
  };
  open();
}

/** Tiếng "ting" ngắn báo sự kiện (trình duyệt có thể chặn tới khi người dùng chạm trang). */
function playTing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* không có âm thanh cũng không sao */ }
}


