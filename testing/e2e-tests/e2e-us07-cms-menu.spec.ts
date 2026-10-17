/**
 * E2E TEST — US-07: CMS Quản lý Thực đơn (Menu CMS)
 * Kịch bản E2E-MA-004: Luồng Quản trị CMS, Khóa món & Báo cáo
 *
 * Tham chiếu:
 *  - Tài liệu E2E: testing/e2e-scenarios.md §2.4 (E2E-MA-004)
 *  - Test cases: testing/test_cases/test-cases-US07.md (TC-MA-CMS-001..022)
 *  - Vault QA Benchmark: vault/07-QA/vault-qa-benchmark.md
 *  - Business Rules: BR-03 (OOS Lock), BR-04 (AI Grounding), ADR-001
 *  - Requirements: REQ-11 (CMS CRUD), NFR-RO-03 (RBAC)
 *
 * Phụ trách (Who checked): Ny
 * Ngày tạo: 2026-10-17
 *
 * Luồng E2E chính:
 *  Manager mở CMS → Hiển thị danh sách → Tìm kiếm/Lọc → Thêm món mới →
 *  Sửa giá/trạng thái → Cập nhật tồn kho inline → Xóa món → Kiểm tra validation
 */
import { test, expect, type Page } from '@playwright/test';

// ===== Cấu hình =====
const BASE_URL = process.env.BASE_URL || 'https://smart-orderding.vercel.app';
const TIMEOUT = 60_000;
const UI_WAIT = 15_000;
const NAV_WAIT = 10_000;

// ===== Mock data =====
const MOCK_MENU_ITEMS = [
  {
    id: 'ITEM-001', name: 'Coca', category: 'Đồ uống',
    price: 15000, stock: 14, is_available: true,
    description: 'Nước ngọt có gas giải khát sảng khoái.',
    ingredients: 'Nước bảo hòa CO2, đường mía/sỉ rô ngô, màu',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-002', name: 'Nước Chanh Tươi', category: 'Đồ uống',
    price: 20000, stock: null, is_available: true,
    description: 'Nước chanh tươi mát lạnh.',
    ingredients: 'Chanh, đường, đá',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-003', name: 'Sprite', category: 'Đồ uống',
    price: 15000, stock: 43, is_available: true,
    description: 'Nước ngọt Sprite vị chanh.',
    ingredients: 'Nước bảo hòa CO2, đường',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-004', name: 'Trà đá', category: 'Đồ uống',
    price: 10000, stock: 0, is_available: false,
    description: 'Trà đá mát lạnh.',
    ingredients: 'Lá trà, đá viên',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-005', name: 'Trà Đào Cam Sả', category: 'Đồ uống',
    price: 25000, stock: null, is_available: true,
    description: 'Trà đào cam sả thơm ngon.',
    ingredients: 'Trà, đào, cam, sả',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-006', name: 'Khoai tây chiên', category: 'Khai vị',
    price: 40000, stock: null, is_available: false,
    description: 'Khoai tây giòn rụm.',
    ingredients: 'Khoai tây, muối',
    spicy: 'Không cay', diet: 'Chay', allergens: 'Không có',
    image_url: '',
  },
  {
    id: 'ITEM-007', name: 'Súp Hải Sản Chua Cay', category: 'Khai vị',
    price: 80000, stock: null, is_available: true,
    description: 'Súp hải sản chua cay đậm đà.',
    ingredients: 'Tôm, mực, nấm, ớt',
    spicy: 'Cay vừa', diet: 'Mặn', allergens: 'Hải sản',
    image_url: '',
  },
  {
    id: 'ITEM-008', name: 'Bò sốt tiêu đen', category: 'Món chính',
    price: 120000, stock: 16, is_available: true,
    description: 'Bò mềm sốt tiêu đen đậm đà.',
    ingredients: 'Thịt bò, tiêu đen, tỏi',
    spicy: 'Cay nhẹ', diet: 'Mặn', allergens: 'Không có',
    image_url: '',
  },
];

// ===== Helper: Setup mock API =====
async function setupMockApi(page: Page) {
  let itemsStore = JSON.parse(JSON.stringify(MOCK_MENU_ITEMS));

  await page.route('**/api/menu**', async route => {
    const method = route.request().method();
    const url = route.request().url();
    const pathname = new URL(url).pathname;
    const isCollection = /\/api\/menu\/?$/.test(pathname)
      || /\/api\/menu\/items\/?$/.test(pathname);
    const idMatch = pathname.match(/\/api\/menu\/(?:items\/)?([^/?#]+)\/?$/);
    const itemId = idMatch?.[1] ? decodeURIComponent(idMatch[1]) : null;

    if (method === 'GET') {
      if (!isCollection && itemId) {
        const item = itemsStore.find((e: { id: string }) => e.id === itemId);
        await route.fulfill(item
          ? { status: 200, json: item }
          : { status: 404, json: { message: 'Not found' } });
      } else {
        await route.fulfill({ status: 200, json: itemsStore });
      }
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      // Validate: giá không được âm
      if (body.price !== undefined && Number(body.price) < 0) {
        await route.fulfill({
          status: 400,
          json: { message: 'Giá bán không hợp lệ' },
        });
        return;
      }
      const newItem = { id: `ITEM-${Date.now()}`, is_available: true, ...body };
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
      const stockMatch = url.match(/\/api\/menu\/items\/([^/?#]+)\/stock/);
      const id = stockMatch ? decodeURIComponent(stockMatch[1]) : null;
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
}

// ===== Helper: Mở trang CMS =====
async function navigateToCms(page: Page) {
  await page.goto(`${BASE_URL}/pages/manager.html`);
  const cmsTab = page.locator('[data-tab="tab-menu-cms"]');
  await cmsTab.waitFor({ state: 'visible', timeout: UI_WAIT });
  await cmsTab.click();
  await page.locator('#menu-table').waitFor({ state: 'visible', timeout: UI_WAIT });
  await page.waitForTimeout(NAV_WAIT);
  await expect(page.locator('#menu-table tbody tr').first()).toBeVisible({
    timeout: UI_WAIT,
  });
}

// ===== Helper: Toast assertions =====
async function expectToast(page: Page, type: 'success' | 'danger', text: string) {
  const selector = type === 'success'
    ? '#toast-container .toast.toast-success, #toast-container .toast-success'
    : '#toast-container .toast.toast-danger, #toast-container .toast-danger';
  const toast = page.locator(selector).filter({ hasText: text });
  await expect(toast.first()).toBeVisible({ timeout: UI_WAIT });
}

// =====================================================================
//  E2E TEST SUITE — US-07: CMS Quản lý Thực đơn
// =====================================================================
test.describe('E2E US-07 — Luồng Quản trị CMS Menu (E2E-MA-004)', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await setupMockApi(page);
    await navigateToCms(page);
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 1: HIỂN THỊ & TÌM KIẾM / LỌC (TC-001..004)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-001: Manager mở CMS → bảng hiển thị đúng 8 cột & dữ liệu', async ({ page }) => {
    // Verify 8 cột header
    const headers = page.locator('#menu-table thead th');
    await expect(headers.nth(0)).toContainText('STT');
    await expect(headers.nth(1)).toContainText('Hình ảnh');
    await expect(headers.nth(2)).toContainText('Tên món ăn');
    await expect(headers.nth(3)).toContainText('Danh mục');
    await expect(headers.nth(4)).toContainText('Giá bán');
    await expect(headers.nth(5)).toContainText('Trạng thái');
    await expect(headers.nth(6)).toContainText('Số lượng tồn');
    await expect(headers.nth(7)).toContainText('Thao tác');

    // Verify dữ liệu món "Coca" hiển thị
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await expect(cocaRow).toBeVisible({ timeout: UI_WAIT });

    // Badge "Đang bán" = badge-success (xanh)
    const badge = cocaRow.locator('.badge').first();
    await expect(badge).toHaveText('Đang bán');

    // Badge "Tạm ẩn" cho Trà đá = badge-danger (đỏ)
    const traRow = page.locator('#menu-table tbody tr', { hasText: 'Trà đá' });
    const traBadge = traRow.locator('.badge').first();
    await expect(traBadge).toHaveText('Tạm ẩn');
  });

  test('E2E-CMS-002: Tìm kiếm "Coca" → chỉ hiện Coca, xóa search → hiện lại tất cả', async ({ page }) => {
    const searchInput = page.locator('#tab-menu-cms .search-box input');
    await searchInput.fill('Coca');

    await expect(page.locator('#menu-table tbody tr', { hasText: 'Coca' }))
      .toBeVisible({ timeout: UI_WAIT });
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Sprite' }))
      .toBeHidden({ timeout: UI_WAIT });

    // Xóa search → tất cả món hiện lại
    await searchInput.fill('');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Sprite' }))
      .toBeVisible({ timeout: UI_WAIT });
  });

  test('E2E-CMS-003: Lọc trạng thái "Tạm ẩn" → chỉ hiện món Tạm ẩn', async ({ page }) => {
    await page.locator('summary[aria-label="Lọc trạng thái"]').click();
    await page.locator('.filter-menu button[data-filter="status"][data-value="Tạm ẩn"]').click();

    // Trà đá (Tạm ẩn) phải hiện
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Trà đá' }))
      .toBeVisible({ timeout: UI_WAIT });
    // Coca (Đang bán) phải ẩn
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Coca' }))
      .toBeHidden({ timeout: UI_WAIT });
  });

  test('E2E-CMS-004: Lọc tồn kho "Sắp hết" → món stock < 20 hiện, còn lại ẩn', async ({ page }) => {
    await page.locator('summary[aria-label="Lọc số lượng tồn"]').click();
    await page.locator('.filter-menu button[data-filter="stock"][data-value="low"]').click();

    // Coca stock=14 → hiện
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Coca' }))
      .toBeVisible({ timeout: UI_WAIT });
    // Sprite stock=43 → ẩn
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Sprite' }))
      .toBeHidden({ timeout: UI_WAIT });
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 2: CRUD — THÊM MÓN (TC-006..011)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-006: Thêm món mới hợp lệ → toast thành công, món xuất hiện', async ({ page }) => {
    // Click "Thêm món mới"
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    // Điền form
    await page.locator('#menu-name').fill('Sườn sụn rang muối');
    await page.locator('#menu-category').selectOption('Món chính');
    await page.locator('#menu-price').fill('85000');
    await page.locator('#menu-description').fill('Sườn sụn giòn ngon đậm vị.');
    await page.locator('#menu-ingredients').fill('Sườn heo, tỏi, ớt');
    await page.locator('#menu-spicy').selectOption('Cay nhẹ');
    await page.locator('#menu-allergens').fill('Không có');

    // Submit
    const saveBtn = addModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Verify: toast thành công + món hiện trong bảng
    await expectToast(page, 'success', 'Thêm món thành công');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Sườn sụn rang muối' }))
      .toBeVisible({ timeout: UI_WAIT });
  });

  test('E2E-CMS-007: Thêm món bỏ trống Tên → toast lỗi, modal vẫn mở', async ({ page }) => {
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    // Bỏ trống Tên, điền Giá
    await page.locator('#menu-name').fill('');
    await page.locator('#menu-price').fill('85000');
    await page.locator('#menu-description').fill('Mô tả test');
    await page.locator('#menu-ingredients').fill('Thành phần test');
    await page.locator('#menu-allergens').fill('Không có');

    const saveBtn = addModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await expectToast(page, 'danger', 'Vui lòng nhập Tên món');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });
  });

  test('E2E-CMS-008: Thêm món bỏ trống Giá → toast lỗi', async ({ page }) => {
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#menu-name').fill('Món test thiếu giá');
    await page.locator('#menu-price').fill('');
    await page.locator('#menu-description').fill('Mô tả test');
    await page.locator('#menu-ingredients').fill('Thành phần test');
    await page.locator('#menu-allergens').fill('Không có');

    const saveBtn = addModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await expectToast(page, 'danger', 'Vui lòng nhập Giá bán');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 3: CRUD — SỬA MÓN (TC-012..014, 019, 021)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-012: Sửa giá Coca 15.000đ → 20.000đ → toast + bảng cập nhật', async ({ page }) => {
    // Mở modal sửa
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await cocaRow.locator('button[title="Sửa món"], button[aria-label="Sửa món"]').click();
    const editModal = page.locator('#edit-menu-modal');
    await expect(editModal).toBeVisible({ timeout: UI_WAIT });

    // Verify dữ liệu điền sẵn (TC-019)
    await expect(page.locator('#edit-menu-name')).toHaveValue('Coca');
    await expect(page.locator('#edit-menu-price')).toHaveValue('15000');

    // Sửa giá
    await page.locator('#edit-menu-price').fill('20000');

    // Intercept PUT response
    const updateResponse = page.waitForResponse(
      resp => resp.request().method() === 'PUT'
        && /\/api\/menu\//.test(resp.url()),
      { timeout: UI_WAIT },
    );

    const saveBtn = editModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    expect((await updateResponse).status()).toBe(200);
    await expect(editModal).toBeHidden({ timeout: UI_WAIT });
    await expectToast(page, 'success', 'Cập nhật thành công');
    await expect(cocaRow).toContainText('20.000đ', { timeout: UI_WAIT });
  });

  test('E2E-CMS-013: Đổi trạng thái Coca "Đang bán" → "Tạm ẩn"', async ({ page }) => {
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await cocaRow.locator('button[title="Sửa món"], button[aria-label="Sửa món"]').click();
    const editModal = page.locator('#edit-menu-modal');
    await expect(editModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#edit-menu-status').selectOption('Tạm ẩn');

    const updateResponse = page.waitForResponse(
      resp => resp.request().method() === 'PUT'
        && /\/api\/menu\//.test(resp.url()),
      { timeout: UI_WAIT },
    );

    const saveBtn = editModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    expect((await updateResponse).status()).toBe(200);
    await expect(editModal).toBeHidden({ timeout: UI_WAIT });
    await expectToast(page, 'success', 'Cập nhật thành công');

    const badge = cocaRow.locator('.badge').first();
    await expect(badge).toHaveText('Tạm ẩn', { timeout: UI_WAIT });
  });

  test('E2E-CMS-014: Sửa xóa trắng Tên món → toast lỗi, modal vẫn mở', async ({ page }) => {
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await cocaRow.locator('button[title="Sửa món"], button[aria-label="Sửa món"]').click();
    const editModal = page.locator('#edit-menu-modal');
    await expect(editModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#edit-menu-name').fill('');

    const saveBtn = editModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await expectToast(page, 'danger', 'Vui lòng nhập Tên món');
    await expect(editModal).toBeVisible({ timeout: UI_WAIT });
  });

  test('E2E-CMS-021: Nhập giá bán âm (-5000) khi sửa/thêm → hệ thống chặn', async ({ page }) => {
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#menu-name').fill('Món giá âm');
    await page.locator('#menu-price').fill('-5000');
    await page.locator('#menu-description').fill('Mô tả');
    await page.locator('#menu-ingredients').fill('Nguyên liệu');
    await page.locator('#menu-allergens').fill('Không có');

    const saveBtn = addModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Hệ thống phải chặn — modal vẫn mở HOẶC toast lỗi xuất hiện
    // Món giá âm không được thêm vào bảng
    const negativeRow = page.locator('#menu-table tbody tr', { hasText: 'Món giá âm' });
    // Chờ ngắn rồi kiểm tra KHÔNG có món trong bảng
    await page.waitForTimeout(2000);
    await expect(negativeRow).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 4: CẬP NHẬT TỒN KHO INLINE (TC-015, 022)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-015: Cập nhật tồn kho Coca inline 14 → 50', async ({ page }) => {
    const input = page.locator('#menu-table tbody tr', { hasText: 'Coca' })
      .locator('input.menu-stock-input');
    await input.fill('50');
    await input.dispatchEvent('change');

    await expect(input).toHaveValue('50', { timeout: UI_WAIT });
  });

  test('E2E-CMS-022: Nhập tồn kho âm (-10) inline → hệ thống chặn', async ({ page }) => {
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    const input = cocaRow.locator('input.menu-stock-input');
    const currentValue = await input.inputValue();

    await input.fill('-10');
    await input.dispatchEvent('change');
    await page.waitForTimeout(2000);

    // Tồn kho không được cập nhật thành -10
    // Phải giữ nguyên hoặc reset về giá trị cũ
    const newValue = await input.inputValue();
    expect(Number(newValue)).toBeGreaterThanOrEqual(0);
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 5: XÓA MÓN (TC-016, 017)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-016: Xóa món và xác nhận OK → món biến mất khỏi bảng', async ({ page }) => {
    // Thêm 1 món tạm để xóa
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#menu-name').fill('Món test xóa E2E');
    await page.locator('#menu-price').fill('30000');
    await page.locator('#menu-description').fill('Mô tả');
    await page.locator('#menu-ingredients').fill('Nguyên liệu');
    await page.locator('#menu-allergens').fill('Không có');
    const saveBtn = addModal.locator('button.btn-primary');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await expect(page.locator('#menu-table tbody tr', { hasText: 'Món test xóa E2E' }))
      .toBeVisible({ timeout: UI_WAIT });

    // Xóa: chấp nhận dialog
    page.once('dialog', dialog => dialog.accept());
    const deleteRow = page.locator('#menu-table tbody tr', { hasText: 'Món test xóa E2E' });
    await deleteRow.locator('button[title="Xóa món"], button[aria-label="Xóa món"]').click();

    await expectToast(page, 'success', 'Xóa thành công');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Món test xóa E2E' }))
      .toBeHidden({ timeout: UI_WAIT });
  });

  test('E2E-CMS-017: Hủy xóa (Cancel) → món vẫn còn trong bảng', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss());
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await cocaRow.locator('button[title="Xóa món"], button[aria-label="Xóa món"]').click();

    // Coca vẫn phải hiện
    await expect(cocaRow).toBeVisible({ timeout: UI_WAIT });
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 6: SẮP XẾP (TC-020)
  // ─────────────────────────────────────────────────────────────────

  test('E2E-CMS-020: Sắp xếp giá cao → thấp → Bò sốt tiêu đen đứng đầu', async ({ page }) => {
    await page.locator('summary[aria-label="Lọc giá bán"]').click();
    await page.locator('.filter-menu button[data-filter="price"][data-value="high-low"]').click();

    const rows = page.locator('#menu-table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: UI_WAIT });
    // Bò sốt tiêu đen (120.000đ) là món đắt nhất
    await expect(rows.first()).toContainText('Bò sốt tiêu đen', { timeout: UI_WAIT });
  });

  // ─────────────────────────────────────────────────────────────────
  //  PHASE 7: LUỒNG ĐẦU CUỐI LIÊN TỤC (Full E2E Flow)
  //  E2E-MA-004 §C: Manager CMS → Sửa giá → Thêm mới → Xóa
  // ─────────────────────────────────────────────────────────────────

  test('E2E-FULL: Luồng đầu cuối — Hiển thị → Sửa giá → Thêm món → Tìm kiếm → Xóa → Verify', async ({ page }) => {
    // ── BƯỚC 1: Verify bảng hiển thị ──
    const table = page.locator('#menu-table');
    await expect(table).toBeVisible({ timeout: UI_WAIT });
    const rowCount = await page.locator('#menu-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    // ── BƯỚC 2: Sửa giá Coca 15.000đ → 18.000đ (E2E-MA-004 §C Step 1) ──
    const cocaRow = page.locator('#menu-table tbody tr', { hasText: 'Coca' });
    await cocaRow.locator('button[title="Sửa món"], button[aria-label="Sửa món"]').click();
    const editModal = page.locator('#edit-menu-modal');
    await expect(editModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#edit-menu-price').fill('18000');
    const editSave = editModal.locator('button.btn-primary');
    await editSave.scrollIntoViewIfNeeded();
    await editSave.click();

    await expect(editModal).toBeHidden({ timeout: UI_WAIT });
    await expectToast(page, 'success', 'Cập nhật thành công');
    await expect(cocaRow).toContainText('18.000đ', { timeout: UI_WAIT });

    // ── BƯỚC 3: Thêm món mới "Gà nướng mật ong" ──
    await page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' }).click();
    const addModal = page.locator('#add-menu-modal');
    await expect(addModal).toBeVisible({ timeout: UI_WAIT });

    await page.locator('#menu-name').fill('Gà nướng mật ong');
    await page.locator('#menu-category').selectOption('Món chính');
    await page.locator('#menu-price').fill('95000');
    await page.locator('#menu-description').fill('Gà nướng mật ong thơm lừng.');
    await page.locator('#menu-ingredients').fill('Gà, mật ong, tỏi');
    await page.locator('#menu-allergens').fill('Không có');

    const addSave = addModal.locator('button.btn-primary');
    await addSave.scrollIntoViewIfNeeded();
    await addSave.click();

    await expectToast(page, 'success', 'Thêm món thành công');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Gà nướng mật ong' }))
      .toBeVisible({ timeout: UI_WAIT });

    // ── BƯỚC 4: Tìm kiếm "Gà nướng" → chỉ hiện 1 món ──
    const searchInput = page.locator('#tab-menu-cms .search-box input');
    await searchInput.fill('Gà nướng');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Gà nướng mật ong' }))
      .toBeVisible({ timeout: UI_WAIT });
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Coca' }))
      .toBeHidden({ timeout: UI_WAIT });

    // ── BƯỚC 5: Clear search và xóa "Gà nướng mật ong" ──
    await searchInput.fill('');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Gà nướng mật ong' }))
      .toBeVisible({ timeout: UI_WAIT });

    page.once('dialog', dialog => dialog.accept());
    const gaRow = page.locator('#menu-table tbody tr', { hasText: 'Gà nướng mật ong' });
    await gaRow.locator('button[title="Xóa món"], button[aria-label="Xóa món"]').click();

    await expectToast(page, 'success', 'Xóa thành công');
    await expect(page.locator('#menu-table tbody tr', { hasText: 'Gà nướng mật ong' }))
      .toBeHidden({ timeout: UI_WAIT });

    // ── BƯỚC 6: Verify giá Coca đã cập nhật vẫn giữ 18.000đ ──
    await expect(cocaRow).toContainText('18.000đ', { timeout: UI_WAIT });
  });
});
