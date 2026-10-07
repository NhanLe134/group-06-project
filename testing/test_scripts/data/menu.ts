/** Test data — danh sách món mẫu dùng chung cho tất cả spec files */
export const MENU_ITEMS = {
  PHO_BO: { id: 'MON001', name: 'Phở Bò', price: 80_000, category: 'Món chính' },
  BIT_TET: { id: 'MON002', name: 'Bít tết Bò Mỹ', price: 150_000, category: 'Món chính' },
  CA_HOI: { id: 'MON003', name: 'Cá Hồi', price: 200_000, category: 'Món chính' },
  PEPSI: { id: 'MON004', name: 'Pepsi', price: 20_000, category: 'Đồ uống' },
  CUA_CA_MAU: { id: 'MON005', name: 'Cua Cà Mau', price: 350_000, category: 'Set lẩu', oos: true },
} as const;

export const TABLES = {
  TABLE_02: 'Bàn 02',
  TABLE_04: 'Bàn 04',
  TABLE_05: 'Bàn 05',
  TABLE_06: 'Bàn 06',
  TABLE_08: 'Bàn 08',
  TABLE_09: 'Bàn 09',
  TABLE_10: 'Bàn 10',
} as const;
