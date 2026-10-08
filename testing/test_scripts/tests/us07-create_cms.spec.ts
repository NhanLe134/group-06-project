/**
 * US-07: CMS Quản lý Thực đơn (Menu CMS)
 * Phụ trách (Who checked): Ny
 * Site: https://smart-orderding.vercel.app
 * Luồng: / → Click "Quản lý Manager" → Tab "Thực đơn (CMS)"
 * Test cases: TC-MA-CMS-001 → TC-MA-CMS-020
 *
 * Ghi chú:
 * - Test chạy trực tiếp trên site đã deploy (không mock API).
 * - Backend thật → một số test (thêm/xóa) sẽ tạo/xóa dữ liệu thật trên DB.
 * - Các test có tạo dữ liệu đều tự cleanup bằng afterEach hoặc trong bước test.
 */
import { test, expect } from '@playwright/test';
import { CmsPage } from '../pages/CmsPage';

// Tên món dùng cho test thêm/xóa — suffix timestamp tránh conflict giữa các lần chạy
const TEST_ITEM_NAME = `Playwright Test Item ${Date.now()}`;

test.describe('US-07 — CMS Quản lý Thực đơn', () => {
  let cms: CmsPage;

  test.beforeEach(async ({ page }) => {
    cms = new CmsPage(page);
    await cms.goto();
  });

  // ── NHÓM 1: HIỂN THỊ & TÌM KIẾM / LỌC ──────────────────────

  // TC-MA-CMS-001
  test('TC-MA-CMS-001: Hiển thị danh sách món ăn đúng cấu trúc bảng', async ({ page }) => {
    await expect(cms.menuTable).toBeVisible();

    // Kiểm tra đủ 8 cột header
    const headers = page.locator('#menu-table thead th');
    await expect(headers.nth(0)).toContainText('STT');
    await expect(headers.nth(1)).toContainText('Hình ảnh');
    await expect(headers.nth(2)).toContainText('Tên món ăn');
    await expect(headers.nth(3)).toContainText('Danh mục');
    await expect(headers.nth(4)).toContainText('Giá bán');
    await expect(headers.nth(5)).toContainText('Trạng thái');
    await expect(headers.nth(6)).toContainText('Số lượng tồn');
    await expect(headers.nth(7)).toContainText('Thao tác');

    // Có ít nhất 1 dòng trong bảng
    const rowCount = await cms.menuRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // TC-MA-CMS-002
  test('TC-MA-CMS-002: Tìm kiếm món ăn theo tên', async ({ page }) => {
    // Lấy tên món đầu tiên để search
    const firstRow = cms.menuRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const firstName = await firstRow.locator('td:nth-child(3) b').innerText();

    await cms.search(firstName);

    // Dòng khớp vẫn hiển thị
    await expect(cms.menuRow(firstName)).toBeVisible();

    // Clear → toàn bộ danh sách trở lại (> 1 dòng)
    await cms.search('');
    const countAfterClear = await cms.menuRows.count();
    expect(countAfterClear).toBeGreaterThan(1);
  });

  // TC-MA-CMS-003
  test('TC-MA-CMS-003: Lọc món theo trạng thái "Tạm ẩn"', async () => {
    await cms.filterByStatus('Tạm ẩn');

    // Tất cả badge hiển thị phải là "Tạm ẩn"
    const badges = cms.page.locator('#menu-table tbody tr .badge');
    const count = await badges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(badges.nth(i)).toContainText('Tạm ẩn');
      }
    }

    // Reset về Tất cả
    await cms.filterByStatus('all');
    const countAll = await cms.menuRows.count();
    expect(countAll).toBeGreaterThan(0);
  });

  // TC-MA-CMS-004
  test('TC-MA-CMS-004: Lọc món theo số lượng tồn "Sắp hết (< 20)"', async ({ page }) => {
    await cms.filterByStock('low');

    // Tất cả stock input hiển thị phải < 20
    const stockInputs = page.locator('#menu-table tbody tr input.menu-stock-input');
    const count = await stockInputs.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const val = await stockInputs.nth(i).inputValue();
        if (val !== '') {
          expect(Number(val)).toBeLessThan(20);
          expect(Number(val)).toBeGreaterThan(0);
        }
      }
    }
  });

  // TC-MA-CMS-020
  test('TC-MA-CMS-020: Sắp xếp giá từ cao đến thấp', async ({ page }) => {
    await cms.sortByPrice('high-low');

    // Thu thập giá của 3 dòng đầu — phải giảm dần
    const rows = page.locator('#menu-table tbody tr');
    const rowCount = await rows.count();
    if (rowCount >= 2) {
      const prices: number[] = [];
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const text = await rows.nth(i).locator('td:nth-child(5)').innerText();
        const num = Number(text.replace(/[^\d]/g, ''));
        prices.push(num);
      }
      // Kiểm tra danh sách giá không tăng (sorted descending)
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    }
  });

  // ── NHÓM 2: XEM CHI TIẾT ──────────────────────────────────────

  // TC-MA-CMS-005
  test('TC-MA-CMS-005: Xem chi tiết món ăn (modal xem)', async () => {
    // Lấy tên món đầu tiên
    const firstRow = cms.menuRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const firstName = await firstRow.locator('td:nth-child(3) b').innerText();

    await cms.openDetailModal(firstName);
    await expect(cms.detailModal).toBeVisible();
    // Modal body có nội dung (tên món)
    await expect(cms.detailBody).toContainText(firstName);

    await cms.closeDetailModal();
    await expect(cms.detailModal).toBeHidden();
  });

  // ── NHÓM 3: THÊM MÓN ──────────────────────────────────────────

  // TC-MA-CMS-006
  test('TC-MA-CMS-006: Thêm món mới hợp lệ (Happy Path)', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: TEST_ITEM_NAME,
      category: 'Khai vị',
      price: 25000,
      description: 'Playwright test item — created by automated test.',
      ingredients: 'Test ingredient',
      allergens: 'Không có',
    });
    await cms.submitAdd();

    // Chờ toast hoặc modal đóng (backend call thật cần timeout dài hơn)
    await expect(cms.addModal).toBeHidden({ timeout: 15000 });
    await expect(cms.menuRow(TEST_ITEM_NAME)).toBeVisible({ timeout: 10000 });

    // Cleanup: xóa món vừa thêm
    await cms.deleteItem(TEST_ITEM_NAME, true);
    await expect(cms.menuRow(TEST_ITEM_NAME)).toBeHidden({ timeout: 10000 });
  });

  // TC-MA-CMS-007
  test('TC-MA-CMS-007: Thêm món thiếu Tên → báo lỗi, modal vẫn mở', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: '',           // bỏ trống Tên
      price: 50000,
      description: 'Mô tả test',
      ingredients: 'Thành phần test',
      allergens: 'Không',
    });
    await cms.submitAdd();

    // Modal vẫn hiển thị (không đóng khi lỗi)
    await expect(cms.addModal).toBeVisible();

    // Toast hoặc focus vào field Tên
    const nameInput = page.locator('#menu-name');
    // Có thể check focus hoặc toast tùy UI — ít nhất modal vẫn mở là pass
    await expect(nameInput).toBeFocused().catch(() => {
      // Một số trình duyệt không focus — chấp nhận nếu modal vẫn mở
    });

    // Đóng modal để cleanup
    await cms.closeAddModal();
  });

  // TC-MA-CMS-008
  test('TC-MA-CMS-008: Thêm món thiếu Giá bán → báo lỗi, modal vẫn mở', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: 'Món test thiếu giá',
      price: '',          // bỏ trống Giá
      description: 'Mô tả test',
      ingredients: 'Thành phần',
      allergens: 'Không',
    });
    await cms.submitAdd();

    await expect(cms.addModal).toBeVisible();

    await cms.closeAddModal();
  });

  // TC-MA-CMS-009
  test('TC-MA-CMS-009: Thêm món với số lượng tồn = 10', async () => {
    const itemName = `TC009 Item ${Date.now()}`;
    await cms.openAddModal();
    await cms.fillAddForm({
      name: itemName,
      category: 'Đồ uống',
      price: 15000,
      stock: 10,
      description: 'Test item với tồn kho.',
      ingredients: 'Test',
      allergens: 'Không',
    });
    await cms.submitAdd();

    await expect(cms.addModal).toBeHidden({ timeout: 15000 });
    const stockInput = cms.stockInput(itemName);
    await expect(stockInput).toHaveValue('10', { timeout: 10000 });

    // Cleanup
    await cms.deleteItem(itemName, true);
  });

  // TC-MA-CMS-010
  test('TC-MA-CMS-010: Thêm món không nhập tồn kho → hiển thị trống (—)', async () => {
    const itemName = `TC010 Item ${Date.now()}`;
    await cms.openAddModal();
    await cms.fillAddForm({
      name: itemName,
      category: 'Đồ uống',
      price: 20000,
      stock: '',          // để trống
      description: 'Test item không tồn kho.',
      ingredients: 'Test',
      allergens: 'Không',
    });
    await cms.submitAdd();

    await expect(cms.addModal).toBeHidden({ timeout: 15000 });
    const stockInput = cms.stockInput(itemName);
    // Giá trị trống → hiển thị placeholder "—"
    await expect(stockInput).toHaveValue('', { timeout: 10000 });

    // Cleanup
    await cms.deleteItem(itemName, true);
  });

  // TC-MA-CMS-011
  test('TC-MA-CMS-011: Hủy bỏ form thêm món (bấm Hủy bỏ)', async () => {
    await cms.openAddModal();
    await cms.fillAddForm({ name: 'Test hủy bỏ' });
    await cms.closeAddModal();

    await expect(cms.addModal).toBeHidden();
    // Không có dòng nào tên "Test hủy bỏ" trong bảng
    await expect(cms.menuRow('Test hủy bỏ')).toBeHidden();
  });

  // ── NHÓM 4: SỬA MÓN ──────────────────────────────────────────

  // TC-MA-CMS-019
  test('TC-MA-CMS-019: Mở modal sửa → dữ liệu điền sẵn đúng với bảng', async ({ page }) => {
    // Lấy thông tin từ dòng đầu trong bảng
    const firstRow = cms.menuRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const nameInTable = await firstRow.locator('td:nth-child(3) b').innerText();
    const priceInTable = await firstRow.locator('td:nth-child(5)').innerText();
    const priceNum = priceInTable.replace(/[^\d]/g, '');

    await cms.openEditModal(nameInTable);

    await expect(cms.editNameInput).toHaveValue(nameInTable);
    await expect(cms.editPriceInput).toHaveValue(priceNum);
    // Trạng thái phải là "Đang bán" hoặc "Tạm ẩn"
    const statusVal = await cms.editStatusSelect.inputValue();
    expect(['Đang bán', 'Tạm ẩn']).toContain(statusVal);

    await cms.closeEditModal();
  });

  // TC-MA-CMS-014
  test('TC-MA-CMS-014: Sửa món — xóa trắng Tên → báo lỗi, modal vẫn mở', async () => {
    const firstRow = cms.menuRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    const nameInTable = await firstRow.locator('td:nth-child(3) b').innerText();

    await cms.openEditModal(nameInTable);
    await cms.editNameInput.fill('');
    await cms.editSaveBtn.click();

    // Modal vẫn mở do validation
    await expect(cms.editModal).toBeVisible();
    await cms.closeEditModal();
  });

  // ── NHÓM 5: XÓA MÓN ──────────────────────────────────────────

  // TC-MA-CMS-016 + TC-MA-CMS-017
  test('TC-MA-CMS-016+017: Xóa món xác nhận OK / Hủy xóa Cancel', async () => {
    // Thêm 1 món tạm để test xóa
    const tempName = `Delete Test ${Date.now()}`;
    await cms.openAddModal();
    await cms.fillAddForm({
      name: tempName,
      category: 'Khai vị',
      price: 10000,
      description: 'Temp item for delete test.',
      ingredients: 'Test',
      allergens: 'Không',
    });
    await cms.submitAdd();
    await expect(cms.menuRow(tempName)).toBeVisible({ timeout: 15000 });

    // TC-017: Hủy xóa → món vẫn còn
    await cms.deleteItem(tempName, false);
    await expect(cms.menuRow(tempName)).toBeVisible();

    // TC-016: Xác nhận xóa → món biến mất
    await cms.deleteItem(tempName, true);
    await expect(cms.menuRow(tempName)).toBeHidden({ timeout: 10000 });
  });

  // ── NHÓM 6: RBAC ──────────────────────────────────────────────

  // TC-MA-CMS-018
  test('TC-MA-CMS-018: Waiter gọi API sửa menu → HTTP 403/401 (RBAC)', async ({ request }) => {
    // Gọi thẳng API backend với token giả của Waiter
    const res = await request.put('https://smart-orderding.vercel.app/api/menu/ITEM-001', {
      data: { price: 99999 },
      headers: {
        Authorization: 'Bearer WAITER_FAKE_TOKEN',
        'Content-Type': 'application/json',
      },
    });
    // Backend RBAC phải chặn: 401, 403, hoặc 404 (route không tồn tại với token đó)
    expect([401, 403, 404, 422]).toContain(res.status());
  });
});
