import { type APIRequestContext } from '@playwright/test';

const BASE = process.env.API_URL || 'http://localhost:8000';

/** Gọi API backend trực tiếp (bỏ qua UI) để chuẩn bị dữ liệu hoặc xác nhận state */
export async function apiPost(
  request: APIRequestContext,
  path: string,
  body: Record<string, unknown>,
) {
  const res = await request.post(`${BASE}${path}`, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });
  return res;
}

export async function apiGet(request: APIRequestContext, path: string) {
  return request.get(`${BASE}${path}`);
}

export async function apiPut(
  request: APIRequestContext,
  path: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return request.put(`${BASE}${path}`, {
    data: body,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function apiDelete(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>,
) {
  return request.delete(`${BASE}${path}`, {
    headers: { ...headers },
  });
}

/** Seed: đặt tồn kho về giá trị cụ thể trước khi test */
export async function setStockLevel(
  request: APIRequestContext,
  itemId: string,
  qty: number,
) {
  return apiPost(request, `/menu/${itemId}/stock`, { soluongton: qty });
}

/** Seed: đặt món về trạng thái hết hàng */
export async function setOos(
  request: APIRequestContext,
  itemId: string,
  oos: boolean,
) {
  return apiPost(request, `/menu/${itemId}/stock`, {
    trangthaiban: !oos,
  });
}

