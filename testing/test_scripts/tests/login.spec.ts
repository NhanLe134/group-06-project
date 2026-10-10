/**
 * Test case cho màn hình Đăng nhập (Login)
 */
import { test, expect } from '@playwright/test';

test.describe('Đăng nhập Hệ thống (Login)', () => {

  test('TC-LOGIN-001: Đăng nhập thành công với tài khoản Quản lý', async ({ page }) => {
    test.skip(true, 'Cần mock/seed data tài khoản Manager và check redirect sang Dashboard');
  });

  test('TC-LOGIN-002: Đăng nhập thành công với tài khoản Waiter', async ({ page }) => {
    test.skip(true, 'Cần mock/seed data tài khoản Waiter và check redirect sang màn hình Waiter');
  });

  test('TC-LOGIN-003: Đăng nhập thất bại - Sai thông tin', async ({ page }) => {
    test.skip(true, 'Nhập sai tài khoản/PIN và expect UI báo lỗi');
  });

  test('TC-LOGIN-004: Đăng nhập thất bại - Bỏ trống trường bắt buộc', async ({ page }) => {
    test.skip(true, 'Bỏ trống password và submit -> Expect có tooltip/cảnh báo');
  });

});
