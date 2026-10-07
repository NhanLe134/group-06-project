import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../fe_ofc/pages/manager.html', import.meta.url), 'utf8');
const managerScript = await readFile(new URL('../fe_ofc/assets/js/manager.js', import.meta.url), 'utf8');
const stepDelayMs = 1200;
const pause = () => delay(stepDelayMs);
const fixtures = () => [
  { id: 'dessert-1', name: 'Bánh flan', category: 'Tráng miệng', price: 25000, stock: null, is_available: true, description: 'Bánh flan', ingredients: 'Trứng, sữa', spicy: 'Không cay', diet: 'Chay', allergens: 'Sữa', image_url: null },
  { id: 'main-1', name: 'Phở bò', category: 'Món chính', price: 65000, stock: null, is_available: true, description: 'Phở bò', ingredients: 'Bò, phở', spicy: 'Không cay', diet: 'Mặn', allergens: 'Không có', image_url: null },
  { id: 'drink-1', name: 'Trà đá', category: 'Đồ uống', price: 5000, stock: 12, is_available: true, description: 'Trà đá', ingredients: 'Trà', spicy: 'Không cay', diet: 'Chay', allergens: 'Không có', image_url: null },
];

function reportStep(name) {
  return async action => {
    console.log(`  STEP START ${name}`);
    const started = Date.now();
    await action();
    await pause();
    console.log(`  STEP PASS  ${name} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  };
}

async function setupPage() {
  const dom = new JSDOM(html, { url: 'http://localhost/pages/manager.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const items = fixtures();
  const requests = [];
  window.APP_CONFIG = { API_BASE_URL: 'http://localhost:8000' };
  window.confirm = () => true;
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : undefined;
    if (!url.pathname.startsWith('/api/menu')) return { status: 200, ok: true, json: async () => [] };
    requests.push({ method, path: url.pathname, body });
    let data;
    let status = 200;
    if (method === 'GET' && url.pathname === '/api/menu') data = items;
    else if (method === 'POST' && url.pathname === '/api/menu') {
      data = { ...body, id: 'created-dessert', image_url: body.image_url || null };
      items.push(data);
      status = 201;
    } else if (method === 'PUT') {
      const id = decodeURIComponent(url.pathname.split('/').at(-1));
      const item = items.find(entry => entry.id === id);
      assert.ok(item, `fixture ${id} should exist`);
      Object.assign(item, body);
      data = item;
    } else if (method === 'PATCH' && url.pathname.endsWith('/stock')) {
      const id = decodeURIComponent(url.pathname.split('/').at(-2));
      const item = items.find(entry => entry.id === id);
      assert.ok(item, `fixture ${id} should exist`);
      item.stock = body.stock;
      data = item;
    } else data = {};
    return { status, ok: true, json: async () => data };
  };

  window.eval(managerScript);
  await pause();
  await window.eval('loadMenuItems()');
  return { dom, window, requests };
}

test('Tất cả danh mục hiển thị ô tồn kho tùy chọn', async () => {
  const { dom, window } = await setupPage();
  const step = reportStep('Kiểm tra món tráng miệng, món chính, đồ uống và trạng thái để trống');
  await step(async () => {
    const rows = [...window.document.querySelectorAll('#menu-table tbody tr')];
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.querySelector('.menu-stock-input')));
    assert.equal(rows.find(row => row.textContent.includes('Bánh flan')).querySelector('.menu-stock-input').value, '');
  });
  dom.window.close();
});

test('Thêm món tráng miệng không bắt buộc số lượng tồn', async () => {
  const { dom, window, requests } = await setupPage();
  const step = reportStep('Mở form thêm món');
  await step(() => window.openAddMenuModal());
  await reportStep('Nhập món tráng miệng, để trống số lượng và lưu')(async () => {
    window.document.getElementById('menu-name').value = 'Chè khúc bạch';
    window.document.getElementById('menu-category').value = 'Tráng miệng';
    window.document.getElementById('menu-price').value = '30000';
    window.document.getElementById('menu-description').value = 'Món tráng miệng';
    window.document.getElementById('menu-ingredients').value = 'Sữa';
    window.document.getElementById('menu-allergens').value = 'Sữa';
    window.document.getElementById('menu-stock').value = '';
    await window.submitAddMenu();
    const request = requests.findLast(entry => entry.method === 'POST');
    assert.equal(request.body.category, 'Tráng miệng');
    assert.equal(request.body.stock, null);
  });
  dom.window.close();
});

test('Sửa món tráng miệng lưu được số lượng tồn', async () => {
  const { dom, window, requests } = await setupPage();
  await reportStep('Mở form sửa món tráng miệng')(async () => {
    window.openEditMenuModal('dessert-1');
    assert.equal(window.document.getElementById('edit-stock-group').hidden, false);
  });
  await reportStep('Nhập 7 và lưu thay đổi')(async () => {
    window.document.getElementById('edit-menu-stock').value = '7';
    await window.submitEditMenu();
    const request = requests.findLast(entry => entry.method === 'PUT');
    assert.equal(request.body.category, 'Tráng miệng');
    assert.equal(request.body.stock, 7);
  });
  dom.window.close();
});

test('Xóa số lượng tồn đưa món về trạng thái không theo dõi', async () => {
  const { dom, window, requests } = await setupPage();
  await reportStep('Xóa giá trị tồn kho trên danh sách')(async () => {
    await window.updateMenuStock('dessert-1', '');
    const request = requests.findLast(entry => entry.method === 'PATCH');
    assert.equal(request.body.stock, null);
  });
  dom.window.close();
});
