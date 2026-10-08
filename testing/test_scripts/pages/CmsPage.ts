import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object: CMS Quản lý Menu (index.html -> manager.html — Tab "Thực đơn (CMS)")
 * US-07 — Thêm / Sửa / Xóa món, lọc, tìm kiếm, phân quyền RBAC
 * Phụ trách: Ny
 */
export class CmsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────
  /**
   * Truy cập từ https://smart-orderding.vercel.app/
   * -> Click 'Quản lý Manager' -> Click tab 'Thực đơn (CMS)'
   */
  async goto() {
    // Vào trang index, bấm link "Quản lý Manager"
    await this.page.goto('/');
    await this.page.locator('a[href*="manager.html"]').click();
    await this.page.waitForURL('**/manager.html');

    // Click tab "Thực đơn (CMS)" trên sidebar
    const cmsTab = this.page.locator('[data-tab="tab-menu-cms"]');
    await cmsTab.waitFor({ state: 'visible' });
    await cmsTab.click();

    // Đợi bảng thực đơn render xong
    await this.menuTable.waitFor({ state: 'visible', timeout: 15000 });
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
    return this.menuRow(name).locator('.badge');
  }

  /** Nút Xem chi tiết (icon eye) */
  viewButton(name: string): Locator {
    return this.menuRow(name).locator('button[title="Xem chi tiết"], button[aria-label="Xem chi tiết"]');
  }

  /** Nút Sửa (icon pencil) */
  editButton(name: string): Locator {
    return this.menuRow(name).locator('button[title="Sửa món"], button[aria-label="Sửa món"]');
  }

  /** Nút Xóa (icon trash) */
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
    const summary = this.page.locator('summary[aria-label="Lọc trạng thái"]');
    await summary.click();
    const btn = this.page.locator(`.filter-menu button[data-filter="status"][data-value="${status}"]`);
    await btn.click();
  }

  async filterByStock(stock: 'all' | 'out' | 'low' | 'available') {
    const summary = this.page.locator('summary[aria-label="Lọc số lượng tồn"]');
    await summary.click();
    const btn = this.page.locator(`.filter-menu button[data-filter="stock"][data-value="${stock}"]`);
    await btn.click();
  }

  async sortByPrice(sort: 'all' | 'high-low' | 'low-high') {
    const summary = this.page.locator('summary[aria-label="Lọc giá bán"]');
    await summary.click();
    const btn = this.page.locator(`.filter-menu button[data-filter="price"][data-value="${sort}"]`);
    await btn.click();
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

  async openAddModal() {
    await this.addItemBtn.click();
    await this.addModal.waitFor({ state: 'visible' });
  }

  async closeAddModal() {
    await this.addCancelBtn.click();
    await this.addModal.waitFor({ state: 'hidden' });
  }

  async fillAddForm(data: {
    name?: string;
    category?: string;
    price?: number | string;
    stock?: number | string;
    description?: string;
    ingredients?: string;
    spicy?: string;
    allergens?: string;
  }) {
    if (data.name !== undefined) await this.addNameInput.fill(data.name);
    if (data.category !== undefined) await this.addCategorySelect.selectOption(data.category);
    if (data.price !== undefined) await this.addPriceInput.fill(String(data.price));
    if (data.stock !== undefined) await this.addStockInput.fill(String(data.stock));
    if (data.description !== undefined) await this.addDescriptionInput.fill(data.description);
    if (data.ingredients !== undefined) await this.addIngredientsInput.fill(data.ingredients);
    if (data.spicy !== undefined) await this.addSpicySelect.selectOption(data.spicy);
    if (data.allergens !== undefined) await this.addAllergensInput.fill(data.allergens);
  }

  async submitAdd() {
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
    await this.editModal.waitFor({ state: 'visible' });
  }

  async closeEditModal() {
    await this.editCancelBtn.click();
    await this.editModal.waitFor({ state: 'hidden' });
  }

  async updatePrice(name: string, newPrice: number) {
    await this.openEditModal(name);
    await this.editPriceInput.fill(String(newPrice));
    await this.editSaveBtn.click();
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
    await this.detailModal.waitFor({ state: 'visible' });
  }

  async closeDetailModal() {
    await this.detailCloseBtn.click();
    await this.detailModal.waitFor({ state: 'hidden' });
  }

  // ── Toast thông báo ──────────────────────────────────────────
  get toastContainer(): Locator {
    return this.page.locator('#toast-container');
  }

  get toastSuccess(): Locator {
    return this.page.locator('#toast-container .toast, .toast-success, .toast--success');
  }

  get toastDanger(): Locator {
    return this.page.locator('#toast-container .toast');
  }

  // ── Action Xóa món với confirmation dialog ─────────────────────
  async deleteItem(name: string, accept: boolean = true): Promise<string> {
    let dialogMessage = '';
    this.page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    await this.deleteButton(name).click();
    return dialogMessage;
  }

  // ── Action Cập nhật tồn kho inline ──────────────────────────────
  async updateStockInline(name: string, newValue: string) {
    const input = this.stockInput(name);
    await input.fill(newValue);
    await input.dispatchEvent('change');
  }
}

