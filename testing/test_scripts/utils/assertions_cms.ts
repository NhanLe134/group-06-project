import { expect, type Locator } from '@playwright/test';

// Dùng chung helper toast đã sửa trong assertions.ts (tìm theo
// #toast-container .toast + lọc theo text) để tránh trùng lặp logic.
export {
  expectVisible,
  expectDisabled,
  expectHasClass,
  fmtVND,
  expectToastSuccess,
  expectToastDanger,
  expectToast,
} from './assertions';

/** Kiểm tra số lượng dòng hiển thị trong bảng */
export async function expectTableRowCount(rowsLocator: Locator, expectedCount: number) {
  await expect(rowsLocator).toHaveCount(expectedCount, { timeout: 15000 });
}