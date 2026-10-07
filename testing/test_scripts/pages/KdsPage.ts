import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object: Màn hình KDS Bếp
 * US-03 — xem ticket, bấm Done, bấm OOS
 */
export class KdsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/fe_ofc/pages/kds.html');
  }

  ticketCard(tableName: string): Locator {
    return this.page.locator('.kds-ticket', { hasText: tableName });
  }

  doneButton(tableName: string): Locator {
    return this.ticketCard(tableName).locator('[data-done]');
  }

  oosToggle(itemName: string): Locator {
    return this.page.locator('[data-oos]', { hasText: itemName });
  }

  get flashingTickets(): Locator {
    return this.page.locator('.kds-ticket.overdue');
  }
}
