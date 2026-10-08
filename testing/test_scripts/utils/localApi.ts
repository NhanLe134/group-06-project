import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Fixture cho E2E US-03/US-08 chạy trên backend E2E riêng (playwright.us03.config.ts).
 * config.js của frontend luôn trỏ localhost:8000 khi chạy local → khóa APP_CONFIG trước khi trang
 * tải để mọi trang (KDS, E-Menu, Phục vụ, Quản lý) gọi đúng backend E2E.
 */
export const API = process.env.E2E_API_URL || 'http://127.0.0.1:8765';

async function pointToE2eApi(page: Page) {
  await page.addInitScript(api => {
    Object.defineProperty(window, 'APP_CONFIG', {
      value: Object.freeze({ API_BASE_URL: api }),
      writable: false,
    });
  }, API);
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await pointToE2eApi(page);
    await use(page);
  },
});

/** Mở thêm 1 tab (vd. E-Menu, Phục vụ) cũng trỏ về backend E2E. */
export async function openPage(page: Page, path: string): Promise<Page> {
  const other = await page.context().newPage();
  await pointToE2eApi(other);
  await other.goto(path);
  return other;
}

export async function menuId(request: APIRequestContext, name: string): Promise<string> {
  const menu = await (await request.get(`${API}/menu`)).json();
  const dish = menu.find((m: { name: string }) => m.name === name);
  expect(dish, `món "${name}" có trong dữ liệu E2E`).toBeTruthy();
  return dish.id;
}

export async function sendToKitchen(
  request: APIRequestContext, table: string, dish: string, qty = 1,
) {
  const res = await request.post(`${API}/orders`, {
    data: { table_name: table, items: [{ thucdon_id: await menuId(request, dish), soluong: qty }] },
  });
  return res;
}

export async function kdsItem(request: APIRequestContext, table: string, dish: string) {
  const items = await (await request.get(`${API}/kds/items`)).json();
  return items.find((i: { ban: string; tenmon: string }) => i.ban === table && i.tenmon === dish);
}

export { expect };
