import { expect, type Locator, type Page } from '@playwright/test';

const TOAST_TIMEOUT = 15000;

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
// Không phụ thuộc class .toast--success / .toast--danger (đã không còn khớp
// với giao diện hiện tại). Toast được tìm trong #toast-container và lọc theo
// nội dung. Lọc theo text giúp tránh bắt nhầm toast cũ còn đang hiển thị.

function toastLocator(page: Page, containsText?: string | RegExp): Locator {
  const all = page.locator('#toast-container .toast, .toast');
  return (containsText ? all.filter({ hasText: containsText }) : all).first();
}

/** Chờ toast thành công xuất hiện (và chứa text nếu có) */
export async function expectToastSuccess(
  page: Page,
  containsText?: string | RegExp,
  timeout = TOAST_TIMEOUT,
) {
  const toast = toastLocator(page, containsText);
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/** Chờ toast lỗi/cảnh báo xuất hiện (và chứa text nếu có) */
export async function expectToastDanger(
  page: Page,
  containsText?: string | RegExp,
  timeout = TOAST_TIMEOUT,
) {
  const toast = toastLocator(page, containsText);
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/** Chờ bất kỳ toast nào xuất hiện */
export async function expectToast(
  page: Page,
  _type?: 'success' | 'danger' | 'warning' | 'primary',
  containsText?: string | RegExp,
  timeout = TOAST_TIMEOUT,
) {
  const toast = toastLocator(page, containsText);
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

// ── Modal helpers ──────────────────────────────────────────────

/** Chờ modal hiển thị */
export async function expectModalOpen(page: Page, modalId: string) {
  const modal = page.locator(`#${modalId}`);
  await expect(modal).toBeVisible({ timeout: 10000 });
  return modal;
}

/** Kiểm tra modal đã đóng */
export async function expectModalClosed(page: Page, modalId: string) {
  await expect(page.locator(`#${modalId}`)).toBeHidden({ timeout: 10000 });
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
    stockMode?: 'Chế biến' | 'Mua sẵn';
    description?: string;
    ingredients?: string;
    spicy?: string;
    diet?: 'Mặn' | 'Chay';
    allergens?: string;
    status?: string;
  },
) {
  const modal = page.locator(prefix === 'menu' ? '#add-menu-modal' : '#edit-menu-modal');

  if (data.name !== undefined)
    await page.locator(`#${prefix}-name`).fill(data.name);
  if (data.category !== undefined)
    await page.locator(`#${prefix}-category`).selectOption(data.category);

  // "Cách tính tồn kho" — phải chọn "Mua sẵn" trước khi nhập số lượng tồn
  const mode = data.stockMode ?? (data.stock !== undefined && data.stock !== null ? 'Mua sẵn' : undefined);
  if (mode) await modal.locator('label', { hasText: mode }).first().click();

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
  if (data.diet !== undefined)
    await modal.locator('label', { hasText: new RegExp(`^\\s*${data.diet}\\s*$`) }).first().click();
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