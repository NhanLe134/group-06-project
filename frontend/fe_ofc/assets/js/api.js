/* =====================================================================
   api.js — Cấu hình kết nối Backend FastAPI (dùng chung customer + cashier)
   Backend chạy ở cổng 8000 (uvicorn); trang tĩnh có thể phục vụ ở cổng bất kỳ
   — dùng cùng hostname để test được cả trên localhost lẫn LAN (điện thoại).
   ===================================================================== */

'use strict';

/* Ưu tiên APP_CONFIG.API_BASE_URL (config.js của team — localhost:8000 khi dev,
 * Render production khi deploy online); thiếu config.js thì fallback hostname:8000. */
const API_BASE = window.APP_CONFIG?.API_BASE_URL
  || `${location.protocol}//${location.hostname}:8000`;

/** Gọi API; lỗi trả về Error có .code (error_code) và .status (HTTP). */
async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    const e = new Error('Không tìm thấy món nào phù hợp. Vui lòng thử lại.');
    e.code = 'NETWORK_ERROR';
    e.status = 0;
    throw e;
  }
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* body rỗng */ }
    const e = new Error(body.message || `Lỗi máy chủ (${res.status}).`);
    e.code = body.error_code || 'HTTP_ERROR';
    e.status = res.status;
    throw e;
  }
  return res.json();
}
