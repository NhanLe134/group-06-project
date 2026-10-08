/**
 * US-07: CMS Quản lý Thực đơn (Menu CMS)
 * Phụ trách (Who checked): Ny
 * File test script: testing/test_scripts/tests/us07-create_cms.spec.ts
 * URL: https://smart-orderding.vercel.app/pages/manager.html -> Tab 'Thực đơn (CMS)'
 *
 * Test cases giữ lại (cần automation): 001, 002, 003, 004, 006, 007, 008, 009,
 * 012, 013, 015, 016, 017, 020
 * Đã loại (kiểm tra thủ công / trùng lặp): 005, 010, 011, 014, 019
 */
import { test, expect } from '@playwright/test';
import { CmsPage } from '../pages/CmsPage';
import { expectToastSuccess, expectToastDanger } from '../utils/assertions';

// ===== Cấu hình thời gian chờ =====
const TEST_TIMEOUT = 60000; // tối đa cho mỗi test
const NAV_WAIT_MS = 10000; // chờ sau khi mở trang để load dữ liệu
const UI_TIMEOUT = 15000; // timeout cho mỗi assertion UI

test.describe('US-07 — CMS Quản lý Thực đơn', () => {
  let cms: CmsPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    cms = new CmsPage(page);

    // Mock API /api/menu để bộ test chạy độc lập, ổn định
    const initialMenuItems = [
      {
        id: 'ITEM-001',
        name: 'Coca',
        category: 'Đồ uống',
        price: 15000,
        stock: 24,
        is_available: true,
        description: 'Nước ngọt có gas giải khát sảng khoái.',
        ingredients: 'Nước bảo hòa CO2, đường...',
        spicy: 'Không cay',
        diet: 'Mặn',
        allergens: 'Không có',
        image_url: '',
      },
      {
        id: 'ITEM-002',
        name: 'Trà đá',
        category: 'Đồ uống',
        price: 10000,
        stock: 2,
        is_available: true,
        description: 'Trà xanh đá mát lạnh.',
        ingredients: 'Lá trà, đá viên',
        spicy: 'Không cay',
        diet: 'Chay',
        allergens: 'Không có',
        image_url: '',
      },
      {
        id: 'ITEM-003',
        name: 'Khoai tây chiên',
        category: 'Khai vị',
        price: 40000,
        stock: null,
        is_available: true,
        description: 'Khoai tây giòn rụm.',
        ingredients: 'Khoai tây, muối',
        spicy: 'Không cay',
        diet: 'Chay',
        allergens: 'Không có',
        image_url: '',
      },
      {
        id: 'ITEM-004',
        name: 'Bò sốt tiêu đen',
        category: 'Món chính',
        price: 120000,
        stock: null,
        is_available: true,
        description: 'Bò mềm sốt tiêu đen đậm đà.',
        ingredients: 'Thịt bò, tiêu đen, tỏi',
        spicy: 'Cay nhẹ',
        diet: 'Mặn',
        allergens: 'Không có',
        image_url: '',
      },
      {
        id: 'ITEM-005',
        name: 'Bún chả Hà Nội',
        category: 'Món chính',
        price: 55000,
        stock: 0,
        is_available: false,
        description: 'Bún chả truyền thống.',
        ingredients: 'Thịt heo, bún, nước mắm',
        spicy: 'Không cay',
        diet: 'Mặn',
        allergens: 'Không có',
        image_url: '',
      },
    ];

    let itemsStore = JSON.parse(JSON.stringify(initialMenuItems));

    await page.route('**/api/menu**', async route => {
      const method = route.request().method();
      const url = route.request().url();
      const pathname = new URL(url).pathname;
      const isMenuCollection = /\/api\/menu\/?$/.test(pathname)
        || /\/api\/menu\/items\/?$/.test(pathname);
      const itemIdMatch = pathname.match(/\/api\/menu\/(?:items\/)?([^/?#]+)\/?$/);
      const itemId = itemIdMatch?.[1] ? decodeURIComponent(itemIdMatch[1]) : null;

      if (method === 'GET') {
        const item = !isMenuCollection && itemId
          ? itemsStore.find((entry: { id: string }) => entry.id === itemId)
          : null;
        if (!isMenuCollection && itemId) {
          await route.fulfill(item
            ? { status: 200, json: item }
            : { status: 404, json: { message: 'Not found' } });
        } else {
          await route.fulfill({ status: 200, json: itemsStore });
        }
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newItem = {
          id: `ITEM-${Date.now()}`,
          is_available: true,
          ...body,
        };
        itemsStore.push(newItem);
        await route.fulfill({ status: 201, json: newItem });
      } else if (method === 'PUT') {
        const body = route.request().postDataJSON();
        const idx = itemsStore.findIndex((i: { id: string }) => i.id === itemId);
        if (idx !== -1) {
          itemsStore[idx] = { ...itemsStore[idx], ...body };
          await route.fulfill({ status: 200, json: itemsStore[idx] });
        } else {
          await route.fulfill({ status: 404, json: { message: 'Not found' } });
        }
      } else if (method === 'PATCH') {
        const idMatch = url.match(/\/api\/menu\/items\/([^/?#]+)\/stock/);
        const id = idMatch ? decodeURIComponent(idMatch[1]) : null;
        const body = route.request().postDataJSON();
        const idx = itemsStore.findIndex((i: { id: string }) => i.id === id);
        if (idx !== -1) {
          itemsStore[idx].stock = body.stock;
          await route.fulfill({ status: 200, json: itemsStore[idx] });
        } else {
          await route.fulfill({ status: 404, json: { message: 'Not found' } });
        }
      } else if (method === 'DELETE') {
        const before = itemsStore.length;
        itemsStore = itemsStore.filter((i: { id: string }) => i.id !== itemId);
        await route.fulfill(itemId && itemsStore.length < before
          ? { status: 204 }
          : { status: 404, json: { message: 'Not found' } });
      } else {
        await route.continue();
      }
    });

    // Mở trang manager -> Tab Thực đơn (CMS)
    await cms.goto();

    // Chờ 10s cho trang load dữ liệu rồi mới thao tác
    await page.waitForTimeout(NAV_WAIT_MS);
    await expect(cms.menuRows.first()).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-001
  test('TC-MA-CMS-001: Hiển thị danh sách món ăn đúng cấu trúc bảng', async ({ page }) => {
    await expect(cms.menuTable).toBeVisible({ timeout: UI_TIMEOUT });

    const headers = page.locator('#menu-table thead th');
    await expect(headers.nth(0)).toContainText('STT');
    await expect(headers.nth(1)).toContainText('Hình ảnh');
    await expect(headers.nth(2)).toContainText('Tên món ăn');
    await expect(headers.nth(3)).toContainText('Danh mục');
    await expect(headers.nth(4)).toContainText('Giá bán');
    await expect(headers.nth(5)).toContainText('Trạng thái');
    await expect(headers.nth(6)).toContainText('Số lượng tồn');
    await expect(headers.nth(7)).toContainText('Thao tác');

    await expect(cms.menuRow('Coca')).toBeVisible({ timeout: UI_TIMEOUT });

    // Badge "Đang bán" màu xanh (badge-success)
    const statusBadge = cms.menuRowStatus('Coca');
    await expect(statusBadge).toHaveClass(/badge-success/);
    await expect(statusBadge).toHaveText('Đang bán');

    const rowCount = await cms.menuRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // TC-MA-CMS-002
  test('TC-MA-CMS-002: Tìm kiếm món ăn theo tên', async () => {
    await cms.search('Coca');
    await expect(cms.menuRow('Coca')).toBeVisible({ timeout: UI_TIMEOUT });
    await expect(cms.menuRow('Bún chả Hà Nội')).toBeHidden({ timeout: UI_TIMEOUT });

    // Clear tìm kiếm -> hiển thị lại tất cả món
    await cms.search('');
    await expect(cms.menuRow('Bún chả Hà Nội')).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-003
  test('TC-MA-CMS-003: Lọc món theo trạng thái "Tạm ẩn"', async () => {
    await cms.filterByStatus('Tạm ẩn');
    await expect(cms.menuRow('Bún chả Hà Nội')).toBeVisible({ timeout: UI_TIMEOUT });
    await expect(cms.menuRow('Coca')).toBeHidden({ timeout: UI_TIMEOUT });

    // Reset về Tất cả
    await cms.filterByStatus('all');
    await expect(cms.menuRow('Coca')).toBeVisible({ timeout: UI_TIMEOUT });
    const countAll = await cms.menuRows.count();
    expect(countAll).toBeGreaterThan(0);
  });

  // TC-MA-CMS-004
  test('TC-MA-CMS-004: Lọc món theo số lượng tồn "Sắp hết (< 20)"', async () => {
    await cms.filterByStock('low');
    // Trà đá có tồn = 2 -> hiển thị
    await expect(cms.menuRow('Trà đá')).toBeVisible({ timeout: UI_TIMEOUT });
    // Coca có tồn = 24 -> ẩn
    await expect(cms.menuRow('Coca')).toBeHidden({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-006
  test('TC-MA-CMS-006: Thêm món mới hợp lệ (Happy Path)', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: 'Sườn sụn rang muối',
      category: 'Món chính',
      price: 85000,
      description: 'Sườn sụn giòn ngon đậm vị.',
      ingredients: 'Sườn heo, tỏi, ớt',
      spicy: 'Cay nhẹ',
      allergens: 'Không có',
    });
    await cms.submitAdd();

    await expectToastSuccess(page, 'Thêm món thành công');
    await expect(cms.menuRow('Sườn sụn rang muối')).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-007
  test('TC-MA-CMS-007: Thêm món mới thiếu trường bắt buộc — bỏ trống Tên', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: '',
      price: 85000,
      description: 'Mô tả test',
      ingredients: 'Thành phần test',
      allergens: 'Không có',
    });
    await cms.submitAdd();

    await expectToastDanger(page, 'Vui lòng nhập Tên món!');
    await expect(cms.addModal).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-008
  test('TC-MA-CMS-008: Thêm món mới thiếu trường bắt buộc — bỏ trống Giá bán', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: 'Món test thiếu giá',
      price: '',
      description: 'Mô tả test',
      ingredients: 'Thành phần test',
      allergens: 'Không có',
    });
    await cms.submitAdd();

    await expectToastDanger(page, 'Vui lòng nhập Giá bán!');
    await expect(cms.addModal).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-009
  test('TC-MA-CMS-009: Thêm món với số lượng tồn tùy chọn', async ({ page }) => {
    await cms.openAddModal();
    await cms.fillAddForm({
      name: 'Bò né trứng',
      category: 'Món chính',
      price: 65000,
      stock: 10,
      description: 'Bò né sốt pa tê trứng ốp la.',
      ingredients: 'Thịt bò, trứng, pa tê',
      allergens: 'Trứng',
    });
    await cms.submitAdd();

    await expectToastSuccess(page, 'Thêm món thành công');
    await expect(cms.stockInput('Bò né trứng')).toHaveValue('10', { timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-012
  test('TC-MA-CMS-012: Sửa giá bán món ăn thành công', async ({ page }) => {
    const updateResponse = page.waitForResponse(response =>
      response.request().method() === 'PUT'
      && /\/api\/menu\/(?:items\/)?[^/]+\/?$/.test(new URL(response.url()).pathname),
    { timeout: UI_TIMEOUT });

    await cms.updatePrice('Coca', 20000);
    expect((await updateResponse).status()).toBe(200);
    await expect(cms.editModal).toBeHidden({ timeout: UI_TIMEOUT });
    await expectToastSuccess(page, 'Cập nhật thành công');

    await expect(cms.menuRow('Coca')).toContainText('20.000đ', { timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-013
  test('TC-MA-CMS-013: Sửa trạng thái món từ "Đang bán" → "Tạm ẩn"', async ({ page }) => {
    await cms.openEditModal('Coca');
    await cms.editStatusSelect.selectOption('Tạm ẩn');
    const updateResponse = page.waitForResponse(response =>
      response.request().method() === 'PUT'
      && /\/api\/menu\/(?:items\/)?[^/]+\/?$/.test(new URL(response.url()).pathname),
    { timeout: UI_TIMEOUT });
    await cms.editSaveBtn.click();

    expect((await updateResponse).status()).toBe(200);
    await expect(cms.editModal).toBeHidden({ timeout: UI_TIMEOUT });
    await expectToastSuccess(page, 'Cập nhật thành công');
    const badge = cms.menuRowStatus('Coca');
    await expect(badge).toHaveText('Tạm ẩn', { timeout: UI_TIMEOUT });
    await expect(badge).toHaveClass(/badge-danger/);
  });

  // TC-MA-CMS-015
  test('TC-MA-CMS-015: Cập nhật số lượng tồn inline trực tiếp trên bảng', async () => {
    await cms.updateStockInline('Trà đá', '50');
    await expect(cms.stockInput('Trà đá')).toHaveValue('50', { timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-016
  test('TC-MA-CMS-016: Xóa món ăn và xác nhận', async ({ page }) => {
    // Thêm 1 món test tạm để xóa
    await cms.openAddModal();
    await cms.fillAddForm({
      name: 'Món xóa test',
      category: 'Khai vị',
      price: 25000,
      description: 'Mô tả',
      ingredients: 'Nguyên liệu',
      allergens: 'Không có',
    });
    await cms.submitAdd();
    await expect(cms.menuRow('Món xóa test')).toBeVisible({ timeout: UI_TIMEOUT });

    // Click xóa và chấp nhận dialog confirm
    await cms.deleteItem('Món xóa test', true);
    await expectToastSuccess(page, 'Xóa thành công');
    await expect(cms.menuRow('Món xóa test')).toBeHidden({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-017
  test('TC-MA-CMS-017: Hủy xóa món ăn (bấm Cancel trong dialog)', async () => {
    await cms.deleteItem('Coca', false);
    await expect(cms.menuRow('Coca')).toBeVisible({ timeout: UI_TIMEOUT });
  });

  // TC-MA-CMS-020
  test('TC-MA-CMS-020: Sắp xếp giá từ cao đến thấp', async ({ page }) => {
    await cms.sortByPrice('high-low');

    const rows = page.locator('#menu-table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: UI_TIMEOUT });
    // Bò sốt tiêu đen (120.000đ) là món đắt nhất trong mock data
    await expect(rows.first()).toContainText('Bò sốt tiêu đen', { timeout: UI_TIMEOUT });
  });
});
