/* =====================================================================
   Group 06 — Smart Restaurant Ordering (Prototype Output #10)
   data.js — Nguồn dữ liệu duy nhất của prototype.
   ---------------------------------------------------------------------
   NGUỒN DỮ LIỆU:
   - Catalog M01..M06: chép nguyên văn docs/05-Design/prototype-brief.md §4.
   - BR-RO-01: Giá món ăn cố định từ dữ liệu hệ thống — KHÔNG nơi nào khác
     trong code được sinh/sửa giá. Mọi hiển thị tiền phải đi qua fmtVND().
   - Copy UX: bảng 10 trạng thái §3 (hiệu chỉnh 2 chỗ đã được duyệt:
     state `ambiguous` dùng đúng catalog M03/M04; state `success` dùng
     mã đơn #B06-001 – Bàn 06 thay vì "Mã bàn B04").
   Lưu ý: từ khóa (kwStrong/kwWeak) đã chuẩn hóa không dấu để khớp NLU.
   ===================================================================== */

'use strict';

/* ---------- Thông tin vị trí (brief §4) ---------- */
const TABLE_INFO = {
  code: 'B06',
  label: 'Bàn 06',
  area: 'Lầu 1',
  guests: 'Anh Tuấn + gia đình 4 người',
};

/* ---------- Menu Catalog (brief §4 — KHÔNG được thêm/bớt/sửa giá) ----------
   status: 'Available' | 'Out of Stock' (M04 cố định OOS — dùng cho Flow C / ADR-001)
   bestseller: gợi ý "món bán chạy" theo glossary (AI ưu tiên gợi ý khách mới) */
const CATALOG = [
  { id: 'M01', name: 'Phở bò tái lăn', price: 65000, status: 'Available', emoji: '🍜', bestseller: true,
    kwStrong: ['pho bo', 'pho'], kwWeak: ['bo', 'tai lan'] },
  { id: 'M02', name: 'Bún chả Hà Nội', price: 55000, status: 'Available', emoji: '🍢',
    kwStrong: ['bun cha'], kwWeak: ['bun', 'cha', 'ha noi'] },
  { id: 'M03', name: 'Bò xào cần', price: 85000, status: 'Available', emoji: '🥩',
    kwStrong: ['bo xao can', 'bo xao'], kwWeak: ['bo', 'can tay'] },
  { id: 'M04', name: 'Bò sốt tiêu đen', price: 120000, status: 'Out of Stock', emoji: '🥘',
    kwStrong: ['bo sot tieu den', 'bo sot'], kwWeak: ['bo', 'tieu den'] },
  { id: 'M05', name: 'Trà đá', price: 5000, status: 'Available', emoji: '🫖',
    kwStrong: ['tra da'], kwWeak: ['tra', 'nuoc'] },
  { id: 'M06', name: 'Set lẩu 4 người', price: 350000, status: 'Available', emoji: '🍲', bestseller: true,
    kwStrong: ['set lau', 'lau'], kwWeak: ['gia dinh', 'set'] },
];

/* ---------- Vai (Role Switcher — brief §5.3 + Screen 0 bổ sung 2026-09-04) ---------- */
const ROLES = [
  { id: 'customer', emoji: '🙋', title: 'Khách gọi món', desc: 'E-Menu · AI Voice Assistant · Order Draft · Gửi bếp' },
  { id: 'kitchen',  emoji: '👨‍🍳', title: 'Bếp KDS', desc: 'Nhận ticket · Chờ nấu → Đang làm → Đã xong' },
  { id: 'waiter',   emoji: '🤵',  title: 'Phục vụ Waiter', desc: 'Nhận alert món xong · Bấm “Đã phục vụ”' },
];

/* ---------- Kịch bản thoại mẫu (brief §6.2 — fallback khi không có Web Speech) ---------- */
const VOICE_SCENARIOS = [
  { tag: 'FLOW A', text: 'Cho 1 phở bò không hành và 2 trà đá' },
  { tag: 'FLOW B', text: 'Cho 1 đĩa bò' },
  { tag: 'FLOW C', text: 'Thêm 1 Bò sốt tiêu đen' },
  { tag: 'Thêm món', text: 'Cho 2 set lẩu gia đình' },
  { tag: 'Thêm món', text: 'Thêm 1 bún chả Hà Nội' },
  { tag: 'Kết thúc', text: 'Đã chọn món xong' },
];

/* ---------- UX Copy — bảng 10 trạng thái (brief §3) ---------- */
const COPY = {
  IDLE_SEARCH:  'Tìm kiếm món ',
  LISTENING:    'Đang nghe... Nói tên món ăn của bạn.',
  PROCESSING:   'Đang xử lý yêu cầu...',
  EMPTY:        'Bàn chưa chọn món. Hãy gọi món qua trợ lý hoặc chọn từ menu.',
  OOS_MSG:      'Món này hiện đã hết, vui lòng chọn món khác.',
  OOS_LABEL:    'Hết hàng',
  DRAFT_OOS_LABEL: 'Món đã hết',
  NETWORK:      'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại; danh sách món chưa thay đổi.',
  DRAFT_BADGE:  'Bản nháp - Chưa gửi bếp',
  SUCCESS_HEAD: 'Đã gửi đơn xuống bếp thành công!',
  confirm: n => `Xác nhận gửi ${n} món xuống bếp? Đơn sau khi gửi sẽ không thể tự hủy trên máy.`,
  /* ADR-001 — copy thông báo đúng nguyên văn từ vault/08-Decisions/decision-log.md */
  ADR001: name => `Dạ món ${name} vừa hết hàng, anh/chị vui lòng bỏ món khỏi danh sách để chốt đơn nhé!`,
  BR05_NOTE: 'Theo BR-RO-05, đơn sau khi gửi không thể tự hủy trên máy. Cần hỗ trợ, xin gọi nhân viên.',
  DONE_MSG: 'Dạ em kết thúc phiên gọi món. Anh/chị kiểm tra lại bản nháp đơn hàng trước khi gửi bếp nhé ạ.',
  GREETING: 'Xin chào Anh Tuấn! Em là trợ lý gọi món của quán. Anh/chị chạm chọn món bên dưới, gõ vào ô tìm kiếm, hoặc bấm micro để gọi món bằng giọng nói ạ.',
};

/* ---------- Trạng thái vòng đời đơn (FLOW D) ---------- */
const STATUS_META = {
  pending: { label: 'Chờ nấu' },
  cooking: { label: 'Đang làm' },
  ready:   { label: 'Đã xong - Chờ phục vụ' },
  served:  { label: 'Đã phục vụ' },
};
const LIFECYCLE = ['pending', 'cooking', 'ready', 'served'];

/* ---------- Khác ---------- */
const QUANTITY_WORDS = { mot: 1, hai: 2, ba: 3, bon: 4, nam: 5, sau: 6 };
/* REQ-RO-08: nhấp nháy Đỏ khi ticket chờ quá 15 phút (thời gian thực) */
const OVERDUE_MS = 15 * 60 * 1000;
const STORE_KEY = 'g06-smart-ordering-v1';
