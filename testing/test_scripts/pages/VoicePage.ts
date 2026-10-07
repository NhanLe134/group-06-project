import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object: Trợ lý Voice AI (voice sheet trên customer.html)
 * US-02 (Ny) — mở sheet, gửi text, đọc phản hồi AI
 */
export class VoicePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get fab(): Locator {
    return this.page.locator('#voice-fab');
  }

  get sheet(): Locator {
    return this.page.locator('#voice-sheet');
  }

  get closeBtn(): Locator {
    return this.page.locator('[data-action="v-close"]');
  }

  get textInput(): Locator {
    return this.page.locator('#v-text-input');
  }

  get sendBtn(): Locator {
    return this.page.locator('.v-text-send');
  }

  get chatContainer(): Locator {
    return this.page.locator('#v-chat');
  }

  get lastAiMessage(): Locator {
    return this.page.locator('#v-chat .msg.ai .bubble p').last();
  }

  async open() {
    await this.fab.click();
    await this.sheet.waitFor({ state: 'visible' });
  }

  async close() {
    await this.closeBtn.click();
    await this.sheet.waitFor({ state: 'hidden' });
  }

  /** Gửi văn bản qua text fallback (không dùng mic) */
  async sendText(text: string) {
    await this.textInput.fill(text);
    await this.sendBtn.click();
  }

  /** Gửi văn bản và chờ phản hồi AI (bubble mới xuất hiện) */
  async sendAndWait(text: string, timeout = 10_000) {
    const before = await this.page.locator('#v-chat .msg.ai').count();
    await this.sendText(text);
    await this.page.waitForFunction(
      (count: number) =>
        document.querySelectorAll('#v-chat .msg.ai').length > count,
      before,
      { timeout },
    );
  }
}
