import { type Page, type Locator } from '@playwright/test';

const WAIT = 15000;

/**
 * Page Object: CMS Quản lý Menu (Vercel manager.html — Tab "Thực đơn (CMS)")
 * US-07 — Thêm / Sửa / Xóa món, lọc, tìm kiếm, phân quyền RBAC
 * Phụ trách: Ny
 *
 * Cập nhật giao diện form "Thêm món mới":
 *  - Thêm "Cách tính tồn kho": Chế biến (trừ nguyên liệu) | Mua sẵn (đếm số lượng)
 *  - Thêm "Loại món": Mặn | Chay
 *  - Thêm upload hình ảnh minh họa (không bắt buộc)
 */
export class CmsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────
  async goto() {
    await this.page.goto('/pages/manager.html');

    const cmsTab = this.page.locator('[data-tab="tab-menu-cms"]');
    await cmsTab.waitFor({ state: 'visible', timeout: WAIT });
    await cmsTab.click();

    await this.menuTable.waitFor({ state: 'visible', timeout: WAIT });
    await this.page.waitForSelector('#menu-table tbody tr', { state: 'visible', timeout: WAIT });
  }

  // ── Bảng danh sách món ──────────────────────────────────────
  get menuTable(): Locator {
    return this.page.locator('#menu-table');
  }

  get menuTableBody(): Locator {
    return this.page.locator('#menu-table tbody');
  }

  get menuRows(): Locator {
    return this.page.locator('#menu-table tbody tr');
  }

  /** Hàng trong bảng chứa tên món */
  menuRow(name: string): Locator {
    return this.page.locator('#menu-table tbody tr', { hasText: name });
  }

  /** Badge trạng thái trong hàng ("Đang bán" / "Tạm ẩn") */
  menuRowStatus(name: string): Locator {
    return this.menuRow(name).locator('.badge').first();
  }

  viewButton(name: string): Locator {
    return this.menuRow(name).locator('button[title="Xem chi tiết"], button[aria-label="Xem chi tiết"]');
  }

  editButton(name: string): Locator {
    return this.menuRow(name).locator('button[title="Sửa món"], button[aria-label="Sửa món"]');
  }

  deleteButton(name: string): Locator {
    return this.menuRow(name).locator('button[title="Xóa món"], button[aria-label="Xóa món"]');
  }

  /** Input tồn kho inline trong bảng */
  stockInput(name: string): Locator {
    return this.menuRow(name).locator('input.menu-stock-input');
  }

  // ── Thanh công cụ (Search, Filter, Sort, Add) ────────────────
  get addItemBtn(): Locator {
    return this.page.locator('#tab-menu-cms button.btn-primary', { hasText: 'Thêm món mới' });
  }

  get searchInput(): Locator {
    return this.page.locator('#tab-menu-cms .search-box input');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByStatus(status: 'all' | 'Đang bán' | 'Tạm ẩn') {
    await this.page.locator('summary[aria-label="Lọc trạng thái"]').click();
    await this.page.locator(`.filter-menu button[data-filter="status"][data-value="${status}"]`).click();
  }

  async filterByStock(stock: 'all' | 'out' | 'low' | 'available') {
    await this.page.locator('summary[aria-label="Lọc số lượng tồn"]').click();
    await this.page.locator(`.filter-menu button[data-filter="stock"][data-value="${stock}"]`).click();
  }

  async sortByPrice(sort: 'all' | 'high-low' | 'low-high') {
    await this.page.locator('summary[aria-label="Lọc giá bán"]').click();
    await this.page.locator(`.filter-menu button[data-filter="price"][data-value="${sort}"]`).click();
  }

  // ── Modal THÊM món ───────────────────────────────────────────
  get addModal(): Locator {
    return this.page.locator('#add-menu-modal');
  }

  get addNameInput(): Locator {
    return this.page.locator('#menu-name');
  }

  get addCategorySelect(): Locator {
    return this.page.locator('#menu-category');
  }

  get addPriceInput(): Locator {
    return this.page.locator('#menu-price');
  }

  get addStockInput(): Locator {
    return this.page.locator('#menu-stock');
  }

  get addDescriptionInput(): Locator {
    return this.page.locator('#menu-description');
  }

  get addIngredientsInput(): Locator {
    return this.page.locator('#menu-ingredients');
  }

  get addSpicySelect(): Locator {
    return this.page.locator('#menu-spicy');
  }

  get addAllergensInput(): Locator {
    return this.page.locator('#menu-allergens');
  }

  get addSaveBtn(): Locator {
    return this.page.locator('#add-menu-modal button.btn-primary');
  }

  get addCancelBtn(): Locator {
    return this.page.locator('#add-menu-modal button.btn-outline', { hasText: 'Hủy bỏ' });
  }

  /** Radio "Cách tính tồn kho" */
  stockModeOption(mode: 'Chế biến' | 'Mua sẵn'): Locator {
    return this.addModal.locator('label', { hasText: mode }).first();
  }

  /** Radio "Loại món" */
  dietOption(diet: 'Mặn' | 'Chay'): Locator {
    return this.addModal.locator('label', { hasText: new RegExp(`^\\s*${diet}\\s*$`) }).first();
  }

  async openAddModal() {
    await this.addItemBtn.click();
    await this.addModal.waitFor({ state: 'visible', timeout: WAIT });
  }

  async closeAddModal() {
    await this.addCancelBtn.click();
    await this.addModal.waitFor({ state: 'hidden', timeout: WAIT });
  }

  async fillAddForm(data: {
    name?: string;
    category?: string;
    stockMode?: 'Chế biến' | 'Mua sẵn';
    price?: number | string;
    stock?: number | string;
    description?: string;
    ingredients?: string;
    spicy?: string;
    diet?: 'Mặn' | 'Chay';
    allergens?: string;
  }) {
    if (data.name !== undefined) await this.addNameInput.fill(data.name);
    if (data.category !== undefined) await this.addCategorySelect.selectOption(data.category);

    // Cách tính tồn kho: nếu có nhập số lượng tồn thì tự chuyển sang "Mua sẵn"
    const hasStock = data.stock !== undefined && data.stock !== '';
    const mode = data.stockMode ?? (hasStock ? 'Mua sẵn' : undefined);
    if (mode) await this.stockModeOption(mode).click();

    if (data.stock !== undefined) await this.addStockInput.fill(String(data.stock));
    if (data.price !== undefined) await this.addPriceInput.fill(String(data.price));

    const desc = data.description !== undefined ? data.description : 'Mô tả món ăn test';
    const ing = data.ingredients !== undefined ? data.ingredients : 'Thành phần test';
    const alg = data.allergens !== undefined ? data.allergens : 'Không có';

    await this.addDescriptionInput.fill(desc);
    await this.addIngredientsInput.fill(ing);
    if (data.spicy !== undefined) await this.addSpicySelect.selectOption(data.spicy);
    if (data.diet !== undefined) await this.dietOption(data.diet).click();
    await this.addAllergensInput.fill(alg);
  }

  async submitAdd() {
    // Form dài, nút lưu nằm cuối modal -> cuộn tới trước khi bấm
    await this.addSaveBtn.scrollIntoViewIfNeeded();
    await this.addSaveBtn.click();
  }

  // ── Modal SỬA món ────────────────────────────────────────────
  get editModal(): Locator {
    return this.page.locator('#edit-menu-modal');
  }

  get editNameInput(): Locator {
    return this.page.locator('#edit-menu-name');
  }

  get editCategorySelect(): Locator {
    return this.page.locator('#edit-menu-category');
  }

  get editPriceInput(): Locator {
    return this.page.locator('#edit-menu-price');
  }

  get editStockInput(): Locator {
    return this.page.locator('#edit-menu-stock');
  }

  get editStatusSelect(): Locator {
    return this.page.locator('#edit-menu-status');
  }

  get editDescriptionInput(): Locator {
    return this.page.locator('#edit-menu-description');
  }

  get editIngredientsInput(): Locator {
    return this.page.locator('#edit-menu-ingredients');
  }

  get editSpicySelect(): Locator {
    return this.page.locator('#edit-menu-spicy');
  }

  get editAllergensInput(): Locator {
    return this.page.locator('#edit-menu-allergens');
  }

  get editSaveBtn(): Locator {
    return this.page.locator('#edit-menu-modal button.btn-primary');
  }

  get editCancelBtn(): Locator {
    return this.page.locator('#edit-menu-modal button.btn-outline', { hasText: 'Hủy bỏ' });
  }

  async openEditModal(name: string) {
    await this.editButton(name).click();
    await this.editModal.waitFor({ state: 'visible', timeout: WAIT });
  }

  async closeEditModal() {
    await this.editCancelBtn.click();
    await this.editModal.waitFor({ state: 'hidden', timeout: WAIT });
  }

  async saveEdit() {
    await this.editSaveBtn.scrollIntoViewIfNeeded();
    await this.editSaveBtn.click();
  }

  async updatePrice(name: string, newPrice: number) {
    await this.openEditModal(name);
    await this.editPriceInput.fill(String(newPrice));
    await this.saveEdit();
  }

  // ── Modal XEM chi tiết ───────────────────────────────────────
  get detailModal(): Locator {
    return this.page.locator('#menu-detail-modal');
  }

  get detailBody(): Locator {
    return this.page.locator('#menu-detail-body');
  }

  get detailCloseBtn(): Locator {
    return this.page.locator('#menu-detail-modal button:has-text("Đóng")');
  }

  get detailEditBtn(): Locator {
    return this.page.locator('#detail-edit-btn');
  }

  async openDetailModal(name: string) {
    await this.viewButton(name).click();
    await this.detailModal.waitFor({ state: 'visible', timeout: WAIT });
  }

  async closeDetailModal() {
    await this.detailCloseBtn.click();
    await this.detailModal.waitFor({ state: 'hidden', timeout: WAIT });
  }

  // ── Toast thông báo ──────────────────────────────────────────
  get toastContainer(): Locator {
    return this.page.locator('#toast-container');
  }

  get toasts(): Locator {
    return this.page.locator('#toast-container .toast');
  }

  // ── Action Xóa món với confirmation dialog ─────────────────────
  async deleteItem(name: string, accept: boolean = true): Promise<string> {
    let dialogMessage = '';
    const dialogPromise = new Promise<string>(resolve => {
      this.page.once('dialog', async dialog => {
        dialogMessage = dialog.message();
        if (accept) {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolve(dialogMessage);
      });
    });

    const btn = this.deleteButton(name);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await dialogPromise;
    return dialogMessage;
  }

  // ── Action Cập nhật tồn kho inline ──────────────────────────────
  async updateStockInline(name: string, newValue: string) {
    const input = this.stockInput(name);
    await input.fill(newValue);
    await input.dispatchEvent('change');
  }
}