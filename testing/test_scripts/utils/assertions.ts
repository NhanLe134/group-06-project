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

// ── Toast helpers ──────────────────────────────────────────────
// manager.js dùng showToast(title, body, type) → render .toast.toast--{type}

/** Chờ toast success xuất hiện và kiểm tra text */
export async function expectToastSuccess(
  page: Page,
  containsText?: string,
  timeout = 10000,
) {
  const toast = page.locator('.toast--success').first();
  await expect(toast).toBeVisible({ timeout });
  if (containsText) await expect(toast).toContainText(containsText, { timeout });
  return toast;
}

/** Chờ toast danger (lỗi) xuất hiện và kiểm tra text */
export async function expectToastDanger(
  page: Page,
  containsText?: string,
  timeout = 10000,
) {
  const toast = page.locator('.toast--danger').first();
  await expect(toast).toBeVisible({ timeout });
  if (containsText) await expect(toast).toContainText(containsText, { timeout });
  return toast;
}

/** Chờ bất kỳ toast nào xuất hiện */
export async function expectToast(
  page: Page,
  type: 'success' | 'danger' | 'warning' | 'primary',
  containsText?: string,
  timeout = 10000,
) {
  const toast = page.locator(`.toast--${type}`).first();
  await expect(toast).toBeVisible({ timeout });
  if (containsText) await expect(toast).toContainText(containsText, { timeout });
  return toast;
}

// ── Modal helpers ──────────────────────────────────────────────

/** Chờ modal hiển thị */
export async function expectModalOpen(page: Page, modalId: string) {
  const modal = page.locator(`#${modalId}`);
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

/** Kiểm tra modal đã đóng */
export async function expectModalClosed(page: Page, modalId: string) {
  await expect(page.locator(`#${modalId}`)).toBeHidden({ timeout: 5000 });
}

// ── Form helpers ───────────────────────────────────────────────

/**
 * Điền form thêm/sửa món — dùng chung cho cả 2 modal.
 * @param prefix  "menu" (add modal) | "edit-menu" (edit modal)
 */
export async function fillMenuForm(
  page: Page,
  prefix: 'menu' | 'edit-menu',
  data: {
    name?: string;
    category?: string;
    price?: number;
    stock?: number | null;
    description?: string;
    ingredients?: string;
    spicy?: string;
    allergens?: string;
    status?: string;
  },
) {
  if (data.name !== undefined)
    await page.locator(`#${prefix}-name`).fill(data.name);
  if (data.category !== undefined)
    await page.locator(`#${prefix}-category`).selectOption(data.category);
  if (data.price !== undefined)
    await page.locator(`#${prefix}-price`).fill(String(data.price));
  if (data.stock !== undefined)
    await page.locator(`#${prefix}-stock`).fill(data.stock === null ? '' : String(data.stock));
  if (data.description !== undefined)
    await page.locator(`#${prefix}-description`).fill(data.description);
  if (data.ingredients !== undefined)
    await page.locator(`#${prefix}-ingredients`).fill(data.ingredients);
  if (data.spicy !== undefined)
    await page.locator(`#${prefix}-spicy`).selectOption(data.spicy);
  if (data.allergens !== undefined)
    await page.locator(`#${prefix}-allergens`).fill(data.allergens);
  if (data.status !== undefined && prefix === 'edit-menu')
    await page.locator(`#${prefix}-status`).selectOption(data.status);
}

/** Dữ liệu món mẫu đủ pass validation khi thêm mới */
export const SAMPLE_MENU_ITEM = {
  name: 'Sườn sụn rang muối TEST',
  category: 'Món chính',
  price: 85_000,
  stock: 10,
  description: 'Sườn sụn giòn, thơm ngon, ăn kèm cơm trắng.',
  ingredients: 'Sườn heo, tỏi, ớt, nước mắm',
  spicy: 'Cay nhẹ',
  allergens: 'Không có',
} as const;
