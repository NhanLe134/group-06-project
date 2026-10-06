/* =====================================================================
   Cấu hình CÔNG KHAI của frontend — file này chạy trong trình duyệt nên ai cũng đọc được.
   Chỉ được chứa giá trị được phép lộ ra ngoài (ADR-ARCH-003):
   - API_BASE_URL: FastAPI backend. Mọi thao tác đọc/ghi dữ liệu nghiệp vụ (đặt món, đổi trạng thái
     món, báo Hết hàng...) đều đi qua backend để kiểm tra quyền và business rule.
   - SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY: khóa công khai của Supabase, chỉ dùng cho tính năng
     phía client như nhận sự kiện Realtime. KHÔNG dùng để ghi thẳng vào bảng.
   TUYỆT ĐỐI KHÔNG đặt SUPABASE_SECRET_KEY hay DATABASE_URL ở đây (chỉ có trong backend/.env).
   Cách dùng: <script src="../assets/js/config.js"></script> rồi đọc window.APP_CONFIG.
   ===================================================================== */
window.APP_CONFIG = Object.freeze({
  API_BASE_URL: 'http://localhost:8000',
  SUPABASE_URL: 'https://lgoxdzymyqanncrrqmlc.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_7qi05QXRAt1noNrWqNRwIQ_4xz8Vrfi',
});
