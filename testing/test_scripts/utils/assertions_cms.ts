import { expect, type Locator, type Page } from '@playwright/test';

/** Kiểm tra phần tử hiển thị và có chứa text */
export async function expectVisible(locator: Locator, text?: string) {
  await expect(locator).toBeVisible();
  if (text) await expect(locator).toContainText(text);
}

/** Kiểm tra phần tử bị disabled */
export async function expectDisabled(locator: Locator) {
  await expect(locator).toBeDisabled();
}

/** Kiểm tra class CSS */
export async function expectHasClass(locator: Locator, className: string) {
  await expect(locator).toHaveClass(new RegExp(className));
}

/** Format số tiền VNĐ giống frontend */
export function fmtVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '\u00a0đ';
}

/** Kiểm tra Toast thành công hiển thị */
export async function expectToastSuccess(page: Page, expectedText?: string) {
  const toast = page.locator('#toast-container .toast');
  await expect(toast.first()).toBeVisible({ timeout: 5000 });
  if (expectedText) {
    await expect(toast.first()).toContainText(expectedText);
  }
}

/** Kiểm tra Toast báo lỗi/cảnh báo hiển thị */
export async function expectToastDanger(page: Page, expectedText?: string) {
  const toast = page.locator('#toast-container .toast');
  await expect(toast.first()).toBeVisible({ timeout: 5000 });
  if (expectedText) {
    await expect(toast.first()).toContainText(expectedText);
  }
}

/** Kiểm tra số lượng dòng hiển thị trong bảng */
export async function expectTableRowCount(rowsLocator: Locator, expectedCount: number) {
  await expect(rowsLocator).toHaveCount(expectedCount);
}
