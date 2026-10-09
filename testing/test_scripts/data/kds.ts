/**
 * Test data — US-03 KDS & US-08 Kiểm kê (Owner: Nhã), theo quy ước thư mục `data/` của bộ test.
 *
 * Dữ liệu này phải KHỚP với dữ liệu mẫu mà backend E2E tạo sẵn: backend/scripts/e2e_server.py
 * (hàm `seed`, danh sách `E2E_TABLES`). Sửa ở đây thì sửa cả bên đó.
 */
export const KDS_DISHES = {
  PHO_BO: 'Phở bò',             // chế biến, công thức 0.2 kg Thịt bò / phần (kho 10 kg)
  SALAD: 'Salad cá ngừ',        // chế biến, chưa có công thức
  GOI_CUON: 'Gỏi cuốn',
  BANH_FLAN: 'Bánh flan',
  CHE: 'Chè đậu đen',
  COCA: 'Coca',                 // mua sẵn, tồn 24
  TRA_DA: 'Trà đá',             // mua sẵn, tồn 50
} as const;

export const KDS_INGREDIENTS = {
  THIT_BO: 'Thịt bò',
} as const;

/** Mỗi test E2E dùng 1 bàn riêng để không ảnh hưởng nhau (bàn là dữ liệu master — ADR-N14). */
export const KDS_TABLES = {
  REALTIME: 'Bàn E2E-01',
  BATCH_A: 'Bàn E2E-02A',
  BATCH_B: 'Bàn E2E-02B',
  READY: 'Bàn E2E-03',
  OOS: 'Bàn E2E-04',
  NO_INGREDIENT: 'Bàn E2E-05',
  OFFLINE: 'Bàn E2E-06',
  OFFLINE_MISSED: 'Bàn E2E-07',
  OVERDUE: 'Bàn E2E-08',
} as const;

/** Tài khoản do e2e_server tạo (khác data/users.ts — bộ đó dùng cho bản staging). */
export const E2E_PINS = {
  MANAGER: '1234',  // "Quản lý E2E" (QUAN_LY)
  CASHIER: '9999',  // "Thu ngân E2E" (THU_NGAN) — không được chốt ca
} as const;
