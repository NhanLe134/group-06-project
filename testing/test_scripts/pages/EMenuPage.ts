import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object: Màn hình E-Menu khách hàng (customer.html)
 * US-01 (Nhàn) — thêm món, xem draft, gửi đơn
 */
export class EMenuPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(table = 'Bàn 05') {
    const param = encodeURIComponent(table);
    await this.page.goto(`/fe_ofc/pages/customer.html?table=${param}`);
  }

  menuCard(name: string): Locator {
    return this.page.locator('.menu-card', { hasText: name });
  }

  addButton(name: string): Locator {
    return this.menuCard(name).locator('[data-add]');
  }

  async addItem(name: string) {
    await this.addButton(name).click();
  }

  get openDraftBtn(): Locator {
    return this.page.locator('#btn-open-draft');
  }

  get draftSheet(): Locator {
    return this.page.locator('#draft-sheet');
  }

  get submitBtn(): Locator {
    return this.page.locator('[data-open-confirm]');
  }

  get confirmModal(): Locator {
    return this.page.locator('#confirm-modal');
  }

  get confirmSendBtn(): Locator {
    return this.page.locator('#btn-confirm-send');
  }

  get successModal(): Locator {
    return this.page.locator('#success-modal');
  }

  async openDraft() {
    await this.openDraftBtn.click();
    await this.draftSheet.waitFor({ state: 'visible' });
  }

  async submitOrder() {
    await this.submitBtn.click();
    await this.confirmModal.waitFor({ state: 'visible' });
    await this.confirmSendBtn.click();
  }

  stickyBarText(): Locator {
    return this.page.locator('#sb-info');
  }
}
