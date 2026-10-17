/**
 * US-04: Tablet Phục vụ (Waiter)
 * Full E2E Automation Suite
 * Kiểm thử toàn diện Sơ đồ bàn, Thông báo Realtime, Xác nhận phục vụ, Dọn bàn,
 * và các quy tắc nghiệp vụ Hủy/Điều chỉnh món (Chờ nấu, Đang nấu, Đã phục vụ).
 */
import { test, expect } from '@playwright/test';

test.describe('US-04 — Tablet Phục vụ: Thông báo & Cập nhật', () => {

  const initialMockTables = [
    {
      id: "table-01",
      name: "Bàn 01",
      capacity: 4,
      zone: "Khu A",
      status: "occupied",
      time: "25p",
      items: [
        { id: "item-ready-1", name: "Trà đào", status: "ready", statusText: "Cần phục vụ", price: "25.000đ", qty: 2, isDrink: true },
        { id: "item-cook-multi", name: "Phở bò", status: "cooking", statusText: "Đang nấu", price: "45.000đ", qty: 3, isDrink: false },
        { id: "item-cook-single", name: "Gà rán", status: "cooking", statusText: "Đang nấu", price: "50.000đ", qty: 1, isDrink: false },
        { id: "item-pending", name: "Cơm chiên", status: "pending", statusText: "Chờ nấu", price: "40.000đ", qty: 2, isDrink: false },
        { id: "item-served", name: "Nem rán", status: "served", statusText: "Đã phục vụ", price: "35.000đ", qty: 1, isDrink: false }
      ]
    },
    {
      id: "table-02",
      name: "Bàn 02",
      capacity: 2,
      zone: "Khu A",
      status: "cleaning",
      time: "5p",
      items: []
    },
    {
      id: "table-03",
      name: "Bàn 03",
      capacity: 6,
      zone: "Khu B",
      status: "empty",
      time: "0p",
      items: []
    }
  ];

  let currentTables: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Khởi tạo bản sao dữ liệu riêng cho mỗi test case
    currentTables = JSON.parse(JSON.stringify(initialMockTables));

    // Mock API Backend để test chạy ổn định, nhanh và độc lập
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vaitro: 'PHUC_VU',
          hoten: 'Nhân viên Phục vụ'
        })
      });
    });

    await page.route('**/waiter/tables', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentTables)
      });
    });

    await page.route('**/waiter/items/*/serve', async (route, request) => {
      const url = request.url();
      const itemId = url.split('/items/')[1]?.split('/serve')[0];
      currentTables.forEach(t => {
        const item = t.items.find((i: any) => i.id === itemId);
        if (item) item.status = 'served';
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: "Đã phục vụ thành công" })
      });
    });

    await page.route('**/waiter/items/*/void', async (route, request) => {
      const url = request.url();
      const itemId = url.split('/items/')[1]?.split('/void')[0];
      const postData = request.postDataJSON() || {};
      const newQty = postData.new_quantity;
      currentTables.forEach(t => {
        if (newQty === 0) {
          t.items = t.items.filter((i: any) => i.id !== itemId);
        } else {
          const item = t.items.find((i: any) => i.id === itemId);
          if (item) item.qty = newQty;
        }
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: "Đã điều chỉnh/hủy món thành công" })
      });
    });

    await page.route('**/tables/*/cleaned', async (route, request) => {
      const url = request.url();
      const tableId = url.split('/tables/')[1]?.split('/cleaned')[0];
      const table = currentTables.find(t => t.id === tableId);
      if (table) {
        table.status = 'empty';
        table.items = [];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: "Đã dọn dẹp bàn thành công" })
      });
    });

    // Đi từ luồng Đăng nhập thực tế
    await page.goto('/login.html');
    await page.getByRole('button', { name: 'Phục vụ' }).click();
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Chờ chuyển hướng sang trang Phục vụ
    await page.waitForURL('**/waiter.html*');

    // Nếu trên giao diện mobile (thanh điều hướng đáy hiện diện), chuyển sang tab Sơ đồ bàn
    const navTables = page.locator('#nav-tables');
    if (await navTables.isVisible()) {
      await navTables.click();
    }
    await expect(page.locator('.table-card').first()).toBeVisible();
  });

  test('TC-US04-01: Nhận thông báo đồ uống hoàn thành từ quầy Bar (Màu xanh lam)', async ({ page }) => {
    const navNotif = page.locator('#nav-notif');
    if (await navNotif.isVisible()) await navNotif.click();

    const drinkNotif = page.locator('.notif-card', { hasText: 'CẦN LẤY NƯỚC' }).first();
    await expect(drinkNotif).toBeVisible();
    await expect(drinkNotif).toContainText('Trà đào');
    await expect(drinkNotif.locator('.notif-table')).toContainText('CẦN LẤY NƯỚC');
  });

  test('TC-US04-02: Nhận thông báo đồ ăn hoàn thành từ Bếp (Màu xanh lá)', async ({ page }) => {
    const navNotif = page.locator('#nav-notif');
    if (await navNotif.isVisible()) await navNotif.click();

    // Kích hoạt thêm 1 món ăn ready của Bàn 03
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', {
        detail: {
          type: 'ITEM_READY',
          data: { table: 'Bàn 03', item: 'Bún bò Huế', category: 'Đồ ăn', qty: 1 }
        }
      }));
    });

    const anyServeNotif = page.locator('.notif-card button', { hasText: 'Đã hoàn tất' }).first();
    await expect(anyServeNotif).toBeVisible();
  });

  test('TC-US04-03: Nhận thông báo dọn dẹp bàn sau khi thanh toán', async ({ page }) => {
    const navNotif = page.locator('#nav-notif');
    if (await navNotif.isVisible()) await navNotif.click();

    const cleanNotif = page.locator('.notif-card', { hasText: 'DỌN DẸP BÀN' }).first();
    await expect(cleanNotif).toBeVisible();
    await expect(cleanNotif).toContainText('Bàn 02');
  });

  test('TC-US04-04: Sơ đồ bàn hiển thị đúng trạng thái Đang phục vụ (occupied)', async ({ page }) => {
    const table1 = page.locator('.table-card', { hasText: 'Bàn 01' });
    await expect(table1).toBeVisible();
    await expect(table1).toHaveAttribute('data-status', 'occupied');
  });

  test('TC-US04-05: Sơ đồ bàn hiển thị đúng trạng thái Cần dọn dẹp (cleaning)', async ({ page }) => {
    const table2 = page.locator('.table-card', { hasText: 'Bàn 02' });
    await expect(table2).toBeVisible();
    await expect(table2).toHaveAttribute('data-status', 'cleaning');
  });

  test('TC-US04-06: Xác nhận Đã dọn xong chuyển bàn về Trống (empty)', async ({ page }) => {
    const table2 = page.locator('.table-card', { hasText: 'Bàn 02' });
    await table2.click(); // Mở Drawer chi tiết

    const drawer = page.locator('#table-drawer');
    await expect(drawer).toHaveClass(/active/);

    const btnClean = page.locator('#drawer-footer').getByRole('button', { name: /Đã dọn xong/i });
    await expect(btnClean).toBeVisible();
    await btnClean.click();

    // Bàn 02 chuyển sang empty
    await expect(page.locator('.table-card', { hasText: 'Bàn 02' })).toHaveAttribute('data-status', 'empty');
  });

  test('TC-US04-07: Ngăn kéo chi tiết bàn sắp xếp món theo độ ưu tiên', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const drawer = page.locator('#table-drawer');
    await expect(drawer).toHaveClass(/active/);

    const items = drawer.locator('.order-item');
    await expect(items).toHaveCount(5);

    // Món ready (Cần phục vụ) phải đứng đầu
    await expect(items.first()).toContainText('Cần phục vụ');
    // Món served (Đã phục vụ) phải đứng cuối
    await expect(items.last()).toContainText('Đã phục vụ');
  });

  test('TC-US04-08: Xác nhận bưng món từ Thẻ thông báo mới nhất', async ({ page }) => {
    const navNotif = page.locator('#nav-notif');
    if (await navNotif.isVisible()) await navNotif.click();

    const finishBtn = page.locator('.notif-card button', { hasText: 'Đã hoàn tất' }).first();
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Toast thông báo phục vụ thành công
    const toast = page.locator('#toast-container .toast');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('Đã phục vụ');
  });

  test('TC-US04-09: Xác nhận bưng món từ nút Phục vụ trong Drawer chi tiết bàn', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const drawer = page.locator('#table-drawer');
    await expect(drawer).toHaveClass(/active/);

    const readyRow = drawer.locator('.order-item', { hasText: 'Cần phục vụ' }).first();
    const btnServe = readyRow.locator('.btn-serve-item');
    await expect(btnServe).toBeVisible();
    await btnServe.click();

    // Món chuyển sang Đã phục vụ (nút Phục vụ biến mất)
    await expect(readyRow.locator('.btn-serve-item')).not.toBeVisible();
  });

  test('TC-US04-10: Hủy hoàn toàn món Chờ nấu (pending) về 0 phần', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const pendingRow = page.locator('.order-item', { hasText: 'Cơm chiên' });
    await expect(pendingRow).toBeVisible();

    // Bấm nút Hủy/Điều chỉnh món (icon thùng rác)
    await pendingRow.locator('.btn-void-item').click();

    const voidModal = page.locator('#void-modal');
    await expect(voidModal).toBeVisible();

    // Bấm nút "Hủy toàn bộ món này"
    const btnFullVoid = page.locator('#btn-full-void');
    await expect(btnFullVoid).toBeVisible();
    await btnFullVoid.click();

    // Modal đóng và món biến mất khỏi danh sách
    await expect(voidModal).toBeHidden();
    await expect(page.locator('.order-item', { hasText: 'Cơm chiên' })).not.toBeVisible();
  });

  test('TC-US04-11: Giảm số lượng món Chờ nấu (pending)', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const pendingRow = page.locator('.order-item', { hasText: 'Cơm chiên' });
    await pendingRow.locator('.btn-void-item').click();

    const voidModal = page.locator('#void-modal');
    await expect(voidModal).toBeVisible();

    // Giảm số lượng từ 2 xuống 1
    await page.locator('#btn-void-minus').click();
    await expect(page.locator('#void-qty-input')).toHaveValue('1');

    // Bấm Cập nhật
    await page.locator('#btn-confirm-void').click();
    await expect(voidModal).toBeHidden();

    // Món cập nhật thành x1
    await expect(pendingRow).toContainText('x1');
  });

  test('TC-US04-12: Khóa nút hủy cho món Đang nấu (cooking) có số lượng bằng 1', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const singleCookingRow = page.locator('.order-item', { hasText: 'Gà rán' });
    await expect(singleCookingRow).toBeVisible();

    const voidBtn = singleCookingRow.locator('.btn-void-item');
    // Nút phải bị disabled và có tooltip giải thích
    await expect(voidBtn).toBeDisabled();
    await expect(voidBtn).toHaveAttribute('title', /Không thể hủy món đang nấu có số lượng 1/);
  });

  test('TC-US04-13: Cho phép mở hộp thoại điều chỉnh cho món Đang nấu có số lượng > 1', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const multiCookingRow = page.locator('.order-item', { hasText: 'Phở bò' });
    await expect(multiCookingRow).toBeVisible();

    const voidBtn = multiCookingRow.locator('.btn-void-item');
    await expect(voidBtn).toBeEnabled();
    await voidBtn.click();

    const voidModal = page.locator('#void-modal');
    await expect(voidModal).toBeVisible();
    await expect(page.locator('#void-modal-desc')).toContainText('Phở bò');
    await expect(page.locator('#void-modal-desc')).toContainText('tối thiểu 1 phần');
  });

  test('TC-US04-14: Chặn giảm về 0 và ẩn nút hủy toàn bộ cho món Đang nấu', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const multiCookingRow = page.locator('.order-item', { hasText: 'Phở bò' });
    await multiCookingRow.locator('.btn-void-item').click();

    const voidModal = page.locator('#void-modal');
    await expect(voidModal).toBeVisible();

    // Nút Hủy toàn bộ món này phải bị ẩn hoàn toàn
    await expect(page.locator('#btn-full-void')).toBeHidden();

    // Bấm giảm liên tục (đang từ 3 -> 2 -> 1, sau đó không thể giảm xuống 0)
    await page.locator('#btn-void-minus').click(); // 2
    await page.locator('#btn-void-minus').click(); // 1
    await page.locator('#btn-void-minus').click(); // Vẫn là 1

    await expect(page.locator('#void-qty-input')).toHaveValue('1');
  });

  test('TC-US04-15: Chặn thao tác sửa/hủy trên giao diện cho món Đã phục vụ (served)', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const servedRow = page.locator('.order-item', { hasText: 'Nem rán' });
    await expect(servedRow).toBeVisible();

    // Không có nút sửa/hủy món
    await expect(servedRow.locator('.btn-void-item')).not.toBeVisible();
    await expect(servedRow.locator('.btn-serve-item')).not.toBeVisible();
  });

  test('TC-US04-18: Giao diện Modal điều chỉnh hiển thị phông chữ mềm mại, bo góc chuẩn', async ({ page }) => {
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    await page.locator('.order-item', { hasText: 'Cơm chiên' }).locator('.btn-void-item').click();

    const voidModal = page.locator('#void-modal .modal-content');
    await expect(voidModal).toBeVisible();

    // Kiểm tra cấu trúc style mềm mại của modal
    await expect(voidModal).toHaveCSS('border-radius', '20px');
    await expect(page.locator('#void-modal-title')).toHaveCSS('font-weight', '600');
  });

  test('TC-US04-22: Phân định chính xác trạng thái bàn "Chờ bếp nấu" và "Bếp đang nấu"', async ({ page }) => {
    // Kiểm tra thanh Legend có đủ các trạng thái bao gồm Chờ bếp nấu & Bếp đang nấu
    const legend = page.locator('.status-legend');
    await expect(legend).toContainText('Chờ bếp nấu');
    await expect(legend).toContainText('Bếp đang nấu');
  });

  test('TC-US04-23: Quy chuẩn nút bấm bo góc 10px và hover rõ ràng', async ({ page }) => {
    // Mở chi tiết bàn để xem nút Phục vụ
    await page.locator('.table-card', { hasText: 'Bàn 01' }).click();
    const serveBtn = page.locator('.order-item', { hasText: 'Trà đào' }).locator('.btn-serve-item');
    await expect(serveBtn).toBeVisible();
    await expect(serveBtn).toHaveCSS('border-radius', '10px');
  });

});
