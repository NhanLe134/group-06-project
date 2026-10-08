import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object: Màn hình Bếp KDS — frontend/fe_ofc/pages/kitchen.html (US-03).
 * Thẻ món đơn lẻ: `article.kcard`; món được AI gom mẻ: `section.batch` > `li.kcard-row`.
 */
export class KdsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/pages/kitchen.html');
    await this.page.locator('.board').waitFor();
  }

  /** Cột trạng thái: PENDING (Chờ nấu) | COOKING (Đang nấu) | READY (Đã nấu). */
  column(status: 'PENDING' | 'COOKING' | 'READY'): Locator {
    return this.page.locator(`.col[data-status="${status}"]`);
  }

  /** Thẻ món của 1 bàn (thẻ đơn lẻ hoặc 1 dòng trong mẻ). */
  card(table: string): Locator {
    return this.page.locator('article.kcard, li.kcard-row').filter({ hasText: table }).first();
  }

  batch(dish: string): Locator {
    return this.page.locator('section.batch').filter({ hasText: dish });
  }

  get connection(): Locator {
    return this.page.locator('#conn');
  }

  get offlineBanner(): Locator {
    return this.page.locator('#offline-banner');
  }

  /** Dòng của 1 món trong ngăn kéo "Tồn kho". */
  stockRow(dish: string): Locator {
    return this.page.locator('aside.stock li').filter({ hasText: dish });
  }

  /** Nút nổi góc dưới phải — mở ngăn kéo Tồn kho (không phải lướt xuống cuối trang). */
  get stockButton(): Locator {
    return this.page.locator('.stock-fab');
  }

  async openStockPanel() {
    if (!(await this.page.locator('aside.stock').isVisible())) await this.stockButton.click();
    await this.page.locator('aside.stock').waitFor();
  }

  /** Đóng ngăn kéo Tồn kho bằng phím Esc (lớp nền mờ che bảng khi đang mở). */
  async closeStockPanel() {
    await this.page.keyboard.press('Escape');
    await this.page.locator('aside.stock').waitFor({ state: 'hidden' });
  }

  /** Báo hết 1 món ở khung Tồn kho (có hộp xác nhận — REQ-09 tránh bấm nhầm). */
  async markOutOfStock(dish: string) {
    await this.openStockPanel();
    await this.stockRow(dish).getByRole('button', { name: 'Báo hết' }).click();
    await this.page.locator('#modal-root [data-action="do-oos"]').click();
  }
}
