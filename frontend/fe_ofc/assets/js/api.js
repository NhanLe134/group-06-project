/* =====================================================================
   api.js — Cấu hình kết nối Backend FastAPI (dùng chung customer + cashier)
   Backend chạy ở cổng 8000 (uvicorn); trang tĩnh có thể phục vụ ở cổng bất kỳ
   — dùng cùng hostname để test được cả trên localhost lẫn LAN (điện thoại).
   ===================================================================== */

'use strict';

const API_BASE = `${location.protocol}//${location.hostname}:8000`;

/** Gọi API; lỗi trả về Error có .code (error_code) và .status (HTTP). */
async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    const e = new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
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
