// Xử lý chuyển Tab trong Sidebar
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Cập nhật UI Menu
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Đổi Tiêu đề
        pageTitle.innerText = item.querySelector('span').innerText;

        // Chuyển Tab Content
        const targetTabId = item.getAttribute('data-tab');
        tabPanes.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === targetTabId) {
                tab.classList.add('active');
            }
        });
    });
});

// ==========================================
// NGHIỆP VỤ: CMS QUẢN LÝ THỰC ĐƠN (CRUD MÓN ĂN - REQ-11)
// ==========================================
let menuItems = [];
const MENU_API = `${(window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000'}/api/menu`;
async function menuRequest(method, path = '', body) {
    let response;
    try {
        response = await fetch(MENU_API + path, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Không kết nối được backend. Hãy kiểm tra FastAPI đang chạy.');
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.detail || `Backend trả lỗi HTTP ${response.status}`);
    return data;
}
function mapMenuItem(item) {
    return {
        ...item,
        img: item.image_url || '',
        stock: item.stock,
        status: item.is_available ? 'Đang bán' : 'Tạm ẩn',
        statusClass: item.is_available ? 'badge-success' : 'badge-danger',
    };
}
async function loadMenuItems() {
    try {
        menuItems = (await menuRequest('GET')).map(mapMenuItem);
        renderMenu();
    } catch (error) {
        menuTableBody.innerHTML = `<tr><td colspan="8">${error.message} <button class="btn btn-outline" onclick="loadMenuItems()">Thử lại</button></td></tr>`;
    }
}
const menuFilters = { price: 'all', status: 'all', stock: 'all' };

const menuTableBody = document.querySelector('#menu-table tbody');

function renderMenu() {
    menuTableBody.innerHTML = '';
    const search = (document.querySelector('#tab-menu-cms .search-box input')?.value || '').trim().toLocaleLowerCase('vi');
    let visibleItems = menuItems.filter(item => {
        if (search && !item.name.toLocaleLowerCase('vi').includes(search)) return false;
        if (menuFilters.status !== 'all' && item.status !== menuFilters.status) return false;
        if (menuFilters.stock !== 'all') {
            // Số còn bán được: món mua sẵn = số lượng tồn, món chế biến = số phần theo nguyên liệu
            const qty = item.stock ?? item.portions;
            if (qty == null) return false;
            if (menuFilters.stock === 'out' && qty !== 0) return false;
            if (menuFilters.stock === 'low' && !(qty > 0 && qty < 20)) return false;
            if (menuFilters.stock === 'available' && qty < 20) return false;
        }
        return true;
    });
    if (menuFilters.price === 'high-low') visibleItems.sort((a, b) => b.price - a.price);
    if (menuFilters.price === 'low-high') visibleItems.sort((a, b) => a.price - b.price);
    visibleItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><div class="mock-img ${item.img ? '' : 'mock-img-empty'}" ${item.img ? `style="background-image: url('${item.img}')"` : ''}>${item.img ? '' : '<i class="ph-bold ph-image"></i>'}</div></td>
            <td><b>${item.name}</b></td>
            <td>${item.category}</td>
            <td>${item.price.toLocaleString('vi-VN')}đ</td>
            <td><span class="badge ${item.statusClass}">${item.status}</span></td>
            <td>${item.stock != null ? `<input class="inv-input menu-stock-input" type="number" min="0" value="${item.stock}" aria-label="Số lượng tồn" onchange="updateMenuStock('${item.id}', this.value)">` : `<span class="stock-na" title="Món chế biến — tính theo nguyên liệu">${item.portions != null ? `${item.portions} phần (theo NL)` : 'Chưa có công thức'}</span>`}</td>
            <td><div class="menu-row-actions"><button class="btn-icon" title="Xem chi tiết" aria-label="Xem chi tiết" onclick="showMenuDetail('${item.id}')"><i class="ph-bold ph-eye"></i></button><button class="btn-icon" title="Sửa món" aria-label="Sửa món" onclick="openEditMenuModal('${item.id}')"><i class="ph-bold ph-pencil-simple"></i></button><button class="btn-icon danger-icon" title="Xóa món" aria-label="Xóa món" onclick="deleteMenu('${item.id}')"><i class="ph-bold ph-trash"></i></button></div></td>
        `;
        menuTableBody.appendChild(tr);
    });
}

window.updateMenuStock = function(id, value) {
    const stock = value.trim() === '' ? null : Math.max(0, Number.parseInt(value, 10) || 0);
    menuRequest('PATCH', `/items/${encodeURIComponent(id)}/stock`, { stock })
        .then(loadMenuItems)
        .catch(error => showToast('Không thể cập nhật tồn kho', error.message, 'danger'));
};
window.showMenuDetail = function(id) {
    const item = menuItems.find(menuItem => menuItem.id === id);
    if (!item) return;

    const spicyLabel = { 'Không cay': '🌿 Không cay', 'Cay nhẹ': '🌶 Cay nhẹ', 'Cay vừa': '🌶🌶 Cay vừa', 'Cay nhiều': '🌶🌶🌶 Cay nhiều' };
    const dietLabel = item.diet === 'Chay'
        ? '<span style="background:#DCFCE7;color:#15803D;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">🥦 Chay</span>'
        : '<span style="background:#FEE2E2;color:#B91C1C;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">🥩 Mặn</span>';

    document.getElementById('menu-detail-body').innerHTML = `
        <div class="modal-body">

            <div class="form-group">
                <label>Tên món ăn</label>
                <input type="text" class="form-control" value="${item.name}" readonly>
            </div>

            <div class="form-group">
                <label>Danh mục</label>
                <input type="text" class="form-control" value="${item.category}" readonly>
            </div>

            <div class="form-group">
                <label>Số lượng tồn</label>
                <input type="text" class="form-control" value="${item.stock ?? 'Chế biến — tính theo nguyên liệu'}" readonly>
            </div>

            <div class="form-group">
                <label>Giá bán (VNĐ)</label>
                <input type="text" class="form-control" value="${item.price.toLocaleString('vi-VN')}đ" readonly>
            </div>

            <div class="form-group">
                <label>Trạng thái</label>
                <div style="padding-top:4px"><span class="badge ${item.statusClass}">${item.status}</span></div>
            </div>

            <div class="form-group">
                <label>Hình ảnh Minh họa</label>
                ${item.img
                    ? `<div class="upload-box has-image" style="cursor:default;"><img src="${item.img}" alt="${item.name}" style="max-height:140px; max-width:100%; border-radius:8px;"><p style="margin-top:8px; font-size:12px;">${item.name}</p></div>`
                    : '<div class="menu-no-image"><i class="ph-bold ph-image"></i><span>Chưa có ảnh minh họa</span></div>'}
            </div>

            <div class="form-group">
                <label>Mô tả</label>
                <textarea class="form-control" rows="3" readonly style="resize:none;">${item.description || '—'}</textarea>
            </div>

            <div class="smart-ordering-section">
                <div class="smart-ordering-header">
                    <i class="ph-bold ph-robot"></i>
                    <span>Thông tin phục vụ Smart Ordering</span>
                </div>
                <div class="smart-ordering-body">
                    <div class="form-group">
                        <label>Thành phần</label>
                        <input type="text" class="form-control" value="${item.ingredients || '—'}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Độ cay</label>
                        <input type="text" class="form-control" value="${spicyLabel[item.spicy] || item.spicy || '—'}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Loại món</label>
                        <div style="padding-top:4px">${item.diet ? dietLabel : '—'}</div>
                    </div>
                    <div class="form-group">
                        <label>Thông tin dị ứng</label>
                        <input type="text" class="form-control" value="${item.allergens || '—'}" readonly>
                    </div>
                </div>
            </div>

        </div>
    `;

    document.getElementById('detail-edit-btn').onclick = () => {
        closeMenuDetail();
        openEditMenuModal(id);
    };

    document.getElementById('menu-detail-modal').style.display = 'flex';
};
window.closeMenuDetail = function() { document.getElementById('menu-detail-modal').style.display = 'none'; };

// ==========================================
// NGHIỆP VỤ: SỬA MÓN ĂN
// ==========================================
window.openEditMenuModal = function(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-menu-id').value = id;
    document.getElementById('edit-menu-name').value = item.name;
    document.getElementById('edit-menu-category').value = item.category;
    document.getElementById('edit-menu-price').value = item.price;
    document.getElementById('edit-menu-status').value = item.status;
    document.getElementById('edit-menu-description').value = item.description || '';
    document.getElementById('edit-menu-ingredients').value = item.ingredients || '';
    document.getElementById('edit-menu-spicy').value = item.spicy || 'Không cay';
    document.getElementById('edit-menu-allergens').value = item.allergens || '';

    // Loại món radio
    const dietRadio = document.querySelector(`input[name="edit-menu-diet"][value="${item.diet || 'Mặn'}"]`);
    if (dietRadio) dietRadio.checked = true;

    // Số lượng tồn
    // Cách tính tồn theo từng món: có số lượng tồn = Mua sẵn, không có = Chế biến (story-spec-tru-kho-tu-dong.md)
    const muaSan = item.stock != null;
    document.querySelector(`input[name="edit-stock-mode"][value="${muaSan ? 'mua_san' : 'che_bien'}"]`).checked = true;
    document.getElementById('edit-menu-stock').value = muaSan ? item.stock : '';
    applyEditStockMode();

    // Ảnh preview
    const preview = document.getElementById('edit-upload-preview');
    const icon = document.getElementById('edit-upload-icon');
    const label = document.getElementById('edit-upload-label');
    const box = document.getElementById('edit-upload-box');
    if (item.img) {
        preview.src = item.img;
        preview.style.display = 'block';
        icon.style.display = 'none';
        label.textContent = 'Ảnh hiện tại (click để thay)';
        box.classList.add('has-image');
    } else {
        preview.src = '';
        preview.style.display = 'none';
        icon.style.display = 'block';
        label.textContent = 'Click hoặc Kéo thả ảnh vào đây';
        box.classList.remove('has-image');
    }
    document.getElementById('edit-image-input').value = '';

    loadRecipeIntoEditForm(id);
    document.getElementById('edit-menu-modal').style.display = 'flex';
};

window.closeEditMenuModal = function() {
    document.getElementById('edit-menu-modal').style.display = 'none';
};

const stockMode = name => document.querySelector(`input[name="${name}"]:checked`)?.value || 'che_bien';
function applyEditStockMode() {
    const muaSan = stockMode('edit-stock-mode') === 'mua_san';
    document.getElementById('edit-stock-group').hidden = !muaSan;
    document.getElementById('edit-recipe-section').hidden = muaSan;
}
document.querySelectorAll('input[name="edit-stock-mode"]').forEach(r => r.addEventListener('change', applyEditStockMode));

window.previewEditImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('edit-upload-preview');
        const icon = document.getElementById('edit-upload-icon');
        const label = document.getElementById('edit-upload-label');
        const box = document.getElementById('edit-upload-box');
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
        label.textContent = file.name;
        box.classList.add('has-image');
    };
    reader.readAsDataURL(file);
};

window.submitEditMenu = async function() {
    const id = document.getElementById('edit-menu-id').value;
    const name = document.getElementById('edit-menu-name').value.trim();
    const category = document.getElementById('edit-menu-category').value;
    const priceStr = document.getElementById('edit-menu-price').value.trim();
    const description = document.getElementById('edit-menu-description').value.trim();
    const ingredients = document.getElementById('edit-menu-ingredients').value.trim();
    const allergens = document.getElementById('edit-menu-allergens').value.trim();

    if (!name) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên món!', 'danger'); document.getElementById('edit-menu-name').focus(); return; }
    if (!priceStr) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Giá bán!', 'danger'); document.getElementById('edit-menu-price').focus(); return; }
    if (!description) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Mô tả!', 'danger'); document.getElementById('edit-menu-description').focus(); return; }
    if (!ingredients) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thành phần!', 'danger'); document.getElementById('edit-menu-ingredients').focus(); return; }
    if (!allergens) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thông tin dị ứng!', 'danger'); document.getElementById('edit-menu-allergens').focus(); return; }

    const previewEl = document.getElementById('edit-upload-preview');
    const oldItem = menuItems.find(item => item.id === id);
    const imageChanged = document.getElementById('edit-image-input').files.length > 0;
    const imgSrc = imageChanged ? previewEl.src : (oldItem?.image_url || null);

    const muaSan = stockMode('edit-stock-mode') === 'mua_san';
    const recipeLines = muaSan ? null : collectRecipeLines();
    if (!muaSan && !recipeLines) return;

    const status = document.getElementById('edit-menu-status').value;
    const stockInput = document.getElementById('edit-menu-stock').value;
    showToast('Đang cập nhật món', 'Đang lưu thay đổi vào thực đơn...', 'primary');
    try {
        const saved = await menuRequest('PUT', `/${encodeURIComponent(id)}`, {
            name, category, price: Number.parseInt(priceStr, 10), description,
            image_url: imgSrc, is_available: status === 'Đang bán',
            stock: muaSan ? Math.max(0, Number.parseInt(stockInput, 10) || 0) : null,
            ingredients,
            spicy: document.getElementById('edit-menu-spicy').value,
            diet: document.querySelector('input[name="edit-menu-diet"]:checked').value,
            allergens,
        });
        // Công thức lưu riêng (story-spec-tru-kho-tu-dong.md); số phần còn đổi theo → tải lại món
        if (recipeLines) await stockApi('PUT', `/menu/items/${encodeURIComponent(id)}/recipe`, { lines: recipeLines });
        const refreshed = await menuRequest('GET', `/${encodeURIComponent(id)}`).catch(() => saved);
        menuItems = menuItems.map(item => item.id === id ? mapMenuItem(refreshed) : item);
        renderMenu();
        closeEditMenuModal();
        showToast('Cập nhật thành công', `Đã lưu thay đổi cho món "${name}".`, 'success');
    } catch (error) {
        showToast('Không thể cập nhật món', error.message, 'danger');
    }
};

document.querySelectorAll('.filter-menu button').forEach(button => button.addEventListener('click', () => {
    menuFilters[button.dataset.filter] = button.dataset.value;
    button.closest('details').open = false;
    renderMenu();
}));
document.querySelector('#tab-menu-cms .search-box input')?.addEventListener('input', renderMenu);

// Tính năng Thêm Món (Modal)
const addMenuModal = document.getElementById('add-menu-modal');

window.openAddMenuModal = function() {
    addMenuModal.style.display = 'flex';
    document.getElementById('menu-name').value = '';
    document.getElementById('menu-price').value = '';
    document.getElementById('menu-stock').value = '';
    document.getElementById('menu-description').value = '';
    document.getElementById('menu-ingredients').value = '';
    document.getElementById('menu-spicy').value = 'Không cay';
    document.getElementById('menu-allergens').value = '';
    document.querySelector('input[name="menu-diet"][value="Mặn"]').checked = true;
    document.getElementById('menu-category').value = 'Món chính';
    document.querySelector('input[name="menu-stock-mode"][value="che_bien"]').checked = true;
    document.getElementById('menu-stock-group').hidden = true;
    // Reset ảnh
    const preview = document.getElementById('upload-preview');
    const icon = document.getElementById('upload-icon');
    const label = document.getElementById('upload-label');
    const uploadBox = document.getElementById('upload-box');
    preview.style.display = 'none';
    preview.src = '';
    icon.style.display = 'block';
    label.textContent = 'Click hoặc Kéo thả ảnh vào đây';
    uploadBox.classList.remove('has-image');
    document.getElementById('menu-image-input').value = '';
}

window.closeAddMenuModal = function() {
    addMenuModal.style.display = 'none';
}

// Preview ảnh tải lên
window.previewMenuImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('upload-preview');
        const icon = document.getElementById('upload-icon');
        const label = document.getElementById('upload-label');
        const uploadBox = document.getElementById('upload-box');
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
        label.textContent = file.name;
        uploadBox.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

document.querySelectorAll('input[name="menu-stock-mode"]').forEach(r => r.addEventListener('change', () => {
    const muaSan = stockMode('menu-stock-mode') === 'mua_san';
    document.getElementById('menu-stock-group').hidden = !muaSan;
    document.getElementById('menu-stock').required = muaSan;
}));

window.submitAddMenu = async function() {
    const name = document.getElementById('menu-name').value.trim();
    const category = document.getElementById('menu-category').value;
    const priceStr = document.getElementById('menu-price').value.trim();
    const stock = document.getElementById('menu-stock').value;
    const description = document.getElementById('menu-description').value.trim();
    const isDrink = stockMode('menu-stock-mode') === 'mua_san';   // món mua sẵn: đếm theo số lượng

    // Validate bắt buộc (*)
    if (!name) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên món!', 'danger'); document.getElementById('menu-name').focus(); return; }
    if (!priceStr) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Giá bán!', 'danger'); document.getElementById('menu-price').focus(); return; }
    if (!description) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Mô tả!', 'danger'); document.getElementById('menu-description').focus(); return; }
    const ingredients = document.getElementById('menu-ingredients').value.trim();
    const allergens = document.getElementById('menu-allergens').value.trim();
    if (!ingredients) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thành phần!', 'danger'); document.getElementById('menu-ingredients').focus(); return; }
    if (!allergens) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thông tin dị ứng!', 'danger'); document.getElementById('menu-allergens').focus(); return; }

    // Chỉ lưu ảnh khi người dùng đã chọn ảnh.
    const previewEl = document.getElementById('upload-preview');
    const imgSrc = (previewEl.src && previewEl.style.display !== 'none')
        ? previewEl.src
        : null;

    showToast('Đang thêm món', 'Đang lưu món mới vào thực đơn...', 'primary');
    try {
        const created = await menuRequest('POST', '', {
            name, category, price: Number.parseInt(priceStr, 10), description,
            image_url: imgSrc, is_available: true,
            stock: isDrink ? Math.max(0, Number.parseInt(stock, 10) || 0) : null,   // Chế biến → null (theo công thức)
            ingredients,
            spicy: document.getElementById('menu-spicy').value,
            diet: document.querySelector('input[name="menu-diet"]:checked').value,
            allergens,
        });
        menuItems.push(mapMenuItem(created));
        renderMenu();
        closeAddMenuModal();
        showToast('Thêm món thành công', `Đã thêm món "${name}" vào thực đơn.`, 'success');
    } catch (error) {
        showToast('Không thể thêm món', error.message, 'danger');
    }
}

window.deleteMenu = async function(id) {
    if(confirm('Bạn có chắc chắn muốn xóa món này?')) {
        try {
            await menuRequest('DELETE', `/${encodeURIComponent(id)}`);
            await loadMenuItems();
            showToast('Xóa thành công', 'Món ăn đã bị gỡ khỏi thực đơn.', 'success');
        } catch (error) {
            showToast('Không thể xóa món', error.message, 'danger');
        }
    }
}

// Đồng bộ AI
window.syncMenuToAI = function() {
    const btn = document.getElementById('btn-sync-ai');
    const originalText = btn.innerHTML;
    
    // Giả lập Loading
    btn.innerHTML = `<i class="ph-bold ph-spinner ph-spin"></i> Đang đồng bộ...`;
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = `<i class="ph-bold ph-check"></i> Đã đồng bộ`;
        btn.classList.replace('btn-outline', 'btn-primary');
        showToast('Đồng bộ AI thành công', 'Trợ lý AI đã được cập nhật dữ liệu Menu và Giá mới nhất.', 'success');
        
        // Reset sau 3 giây
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.replace('btn-primary', 'btn-outline');
            btn.disabled = false;
        }, 3000);
    }, 1500);
}

// ==========================================
// NGHIỆP VỤ: THỰC PHẨM (NGUYÊN LIỆU) + CÔNG THỨC MÓN — trừ kho tự động
// Spec: vault/06-Engineering/story-spec-tru-kho-tu-dong.md (API /inventory/ingredients, /menu/items/{id}/recipe)
// ==========================================
const STOCK_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000';
let ingredientsData = [];

async function stockApi(method, path, body) {
    let res;
    try {
        res = await fetch(STOCK_BASE + path, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Không kết nối được máy chủ. Kiểm tra backend đang chạy.');
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error((data && (data.message || (Array.isArray(data.detail) ? 'Dữ liệu nhập không hợp lệ' : data.detail))) || `Lỗi máy chủ (HTTP ${res.status})`);
    }
    return data;
}

const fmtQty = n => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 3 });

async function loadIngredients() {
    ingredientsData = await stockApi('GET', '/inventory/ingredients');
    return ingredientsData;
}

async function renderIngredients() {
    const tbody = document.querySelector('#ingredients-table tbody');
    if (!tbody) return;
    try {
        await loadIngredients();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="inv-empty">${invEsc(err.message)} <button class="btn btn-outline" onclick="renderIngredients()">Thử lại</button></td></tr>`;
        return;
    }
    drawIngredients();
}

function drawIngredients() {
    const tbody = document.querySelector('#ingredients-table tbody');
    const q = (document.getElementById('ing-search')?.value || '').trim().toLowerCase();
    const rows = ingredientsData.filter(i => !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="inv-empty">${ingredientsData.length ? 'Không có nguyên liệu khớp tìm kiếm.' : 'Chưa có nguyên liệu nào. Bấm "Thêm nguyên liệu" để bắt đầu.'}</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(item => `
        <tr>
            <td>${invEsc(item.id)}</td>
            <td><b>${invEsc(item.name)}</b></td>
            <td>${invEsc(item.unit)}</td>
            <td><span class="badge ${item.stock > 0 ? 'badge-success' : 'badge-danger'}">${fmtQty(item.stock)} ${invEsc(item.unit)}</span></td>
            <td>${item.used_in.length ? invEsc(item.used_in.join(', ')) : '<span class="stock-na">Chưa dùng</span>'}</td>
            <td>
                <div class="menu-row-actions">
                    <button class="btn-icon" title="Sửa / nhập hàng" onclick="openIngredientModal('${invEsc(item.id)}')"><i class="ph-bold ph-pencil-simple"></i></button>
                    <button class="btn-icon danger-icon" title="Xóa" onclick="deleteIngredient('${invEsc(item.id)}')"><i class="ph-bold ph-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
}
document.getElementById('ing-search')?.addEventListener('input', drawIngredients);

window.openIngredientModal = function(id) {
    const item = id ? ingredientsData.find(i => i.id === id) : null;
    document.getElementById('ing-modal-title').innerHTML = `<i class="ph-bold ph-carrot"></i> ${item ? 'Sửa nguyên liệu / Nhập hàng' : 'Thêm nguyên liệu'}`;
    document.getElementById('ing-id').value = item ? item.id : '';
    document.getElementById('ing-name').value = item ? item.name : '';
    document.getElementById('ing-unit').value = item ? item.unit : '';
    document.getElementById('ing-stock').value = item ? item.stock : '';
    document.getElementById('ing-error').textContent = '';
    document.getElementById('ingredient-modal').style.display = 'flex';
    document.getElementById('ing-name').focus();
};

window.closeIngredientModal = function() {
    document.getElementById('ingredient-modal').style.display = 'none';
};

window.submitIngredient = async function() {
    const id = document.getElementById('ing-id').value;
    const name = document.getElementById('ing-name').value.trim();
    const unit = document.getElementById('ing-unit').value.trim();
    const stockStr = document.getElementById('ing-stock').value.trim();
    const stock = Number(stockStr);
    const error = document.getElementById('ing-error');
    if (!name || !unit || stockStr === '') { error.textContent = 'Vui lòng nhập đủ tên, đơn vị và tồn kho.'; return; }
    if (!Number.isFinite(stock) || stock < 0) { error.textContent = 'Tồn kho phải là số không âm.'; return; }
    const btn = document.getElementById('ing-submit');
    btn.disabled = true;
    try {
        await stockApi(id ? 'PUT' : 'POST', `/inventory/ingredients${id ? '/' + encodeURIComponent(id) : ''}`, { name, unit, stock });
        closeIngredientModal();
        showToast(id ? 'Đã cập nhật' : 'Đã thêm', `Nguyên liệu "${name}" đã được lưu.`, 'success');
        renderIngredients();
        loadMenuItems();   // số phần còn của các món dùng nguyên liệu này có thể đổi
    } catch (err) {
        error.textContent = err.message;
    } finally {
        btn.disabled = false;
    }
};

window.deleteIngredient = async function(id) {
    const item = ingredientsData.find(i => i.id === id);
    if (!item || !confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${item.name}"?`)) return;
    try {
        await stockApi('DELETE', `/inventory/ingredients/${encodeURIComponent(id)}`);
        showToast('Xóa thành công', 'Nguyên liệu đã bị xóa.', 'success');
        renderIngredients();
    } catch (err) {
        showToast('Không thể xóa', err.message, 'danger');
    }
};

// ---------- Công thức trong form Sửa món ----------
function recipeLineHtml(line = {}) {
    const options = ingredientsData.map(i =>
        `<option value="${invEsc(i.id)}" data-unit="${invEsc(i.unit)}" ${i.id === line.ingredient_id ? 'selected' : ''}>${invEsc(i.name)} (${invEsc(i.unit)})</option>`).join('');
    const unit = (ingredientsData.find(i => i.id === line.ingredient_id) || ingredientsData[0] || {}).unit || '';
    return `
        <div class="recipe-line">
            <select class="form-control recipe-ingredient" aria-label="Nguyên liệu" onchange="this.closest('.recipe-line').querySelector('.recipe-unit').textContent = this.selectedOptions[0]?.dataset.unit || ''">${options}</select>
            <input type="number" class="form-control recipe-qty" min="0" step="any" placeholder="Định lượng" aria-label="Định lượng cho 1 phần" value="${line.quantity ?? ''}">
            <span class="recipe-unit">${invEsc(unit)}</span>
            <button type="button" class="btn-icon danger-icon" title="Bỏ khỏi công thức" onclick="this.closest('.recipe-line').remove()"><i class="ph-bold ph-x"></i></button>
        </div>`;
}

window.addRecipeLine = function() {
    if (!ingredientsData.length) {
        showToast('Chưa có nguyên liệu', 'Hãy thêm nguyên liệu ở tab Thực phẩm trước.', 'warning');
        return;
    }
    document.getElementById('edit-recipe-lines').insertAdjacentHTML('beforeend', recipeLineHtml());
};

async function loadRecipeIntoEditForm(id) {
    const box = document.getElementById('edit-recipe-lines');
    const portions = document.getElementById('edit-recipe-portions');
    box.innerHTML = '<p class="recipe-hint">Đang tải công thức...</p>';
    portions.textContent = '';
    try {
        const [, recipe] = await Promise.all([loadIngredients(), stockApi('GET', `/menu/items/${encodeURIComponent(id)}/recipe`)]);
        box.innerHTML = recipe.lines.map(recipeLineHtml).join('');
        portions.textContent = recipe.portions == null ? '' : `· Còn làm được ${recipe.portions} phần`;
    } catch (err) {
        box.innerHTML = `<p class="inv-field-error">${invEsc(err.message)}</p>`;
    }
}

/** Đọc các dòng công thức; trả null nếu dữ liệu sai (đã báo lỗi). */
function collectRecipeLines() {
    const lines = [...document.querySelectorAll('#edit-recipe-lines .recipe-line')].map(row => ({
        ingredient_id: row.querySelector('.recipe-ingredient').value,
        quantity: Number(row.querySelector('.recipe-qty').value),
    }));
    if (lines.some(l => !(l.quantity > 0))) {
        showToast('Lỗi công thức', 'Định lượng mỗi nguyên liệu phải lớn hơn 0.', 'danger');
        return null;
    }
    if (new Set(lines.map(l => l.ingredient_id)).size !== lines.length) {
        showToast('Lỗi công thức', 'Mỗi nguyên liệu chỉ nhập 1 lần trong công thức.', 'danger');
        return null;
    }
    return lines;
}

// ==========================================
// NGHIỆP VỤ: PHIẾU KIỂM KÊ — US-08 Đối soát tồn kho & Đóng ca
// Dữ liệu thật qua FastAPI (API_BASE_URL trong config.js) — bảng phieukiemke / chitietkiemke.
// Spec: vault/06-Engineering/story-spec-us08-inventory.md
// ==========================================
const INV_API = ((window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000') + '/inventory/shifts';
const INV_LOSS_MSG = 'Vui lòng nhập lý do hao hụt trước khi chốt ca';
let invCurrent = null;   // phiếu đang mở (chi tiết từ API)

const invEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const invTime = iso => {
    if (!iso) return '';
    const d = new Date(iso), p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;   // giờ máy (VN)
};

async function invApi(method, path = '', body) {
    let res;
    try {
        res = await fetch(INV_API + path, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw { status: 0, error_code: 'NETWORK', message: 'Không kết nối được máy chủ. Kiểm tra backend đang chạy.' };
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const message = (data && (data.message || (Array.isArray(data.detail) ? 'Dữ liệu nhập không hợp lệ' : data.detail))) || `Lỗi máy chủ (HTTP ${res.status})`;
        throw { status: res.status, error_code: data && data.error_code, message, details: data && data.details };
    }
    return data;
}

// ---------- Danh sách phiếu ----------
async function renderInventorySessions() {
    const tbody = document.querySelector('#inventory-sessions-table tbody');
    if (!tbody) return;
    let shifts;
    try {
        shifts = await invApi('GET');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="inv-empty">${invEsc(err.message)} <button class="btn btn-outline" onclick="renderInventorySessions()">Thử lại</button></td></tr>`;
        return;
    }
    if (!shifts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="inv-empty">Chưa có phiếu kiểm kê nào. Bấm “Tạo Phiếu Kiểm Kê” khi kết thúc ca.</td></tr>';
        return;
    }
    tbody.innerHTML = shifts.map(s => {
        const closed = s.trangthai === 'da_chot';
        const loss = s.so_mon_hao_hut ? `<span class="diff-val negative">${s.tong_hao_hut} (${s.so_mon_hao_hut} món)</span>` : '<span class="diff-val zero">0</span>';
        return `
        <tr>
            <td><b>${invEsc(s.maphieu)}</b></td>
            <td>${invTime(s.tuluc)} → ${closed ? invTime(s.giochot) : 'hiện tại'}</td>
            <td>${closed ? invEsc(s.nguoichot || '—') : '—'}</td>
            <td>${loss}</td>
            <td><span class="status-badge inv-badge ${closed ? 'inv-badge--closed' : 'inv-badge--draft'}">${closed ? 'Đã chốt' : 'Đang nháp'}</span></td>
            <td>
                <button class="btn-icon" title="${closed ? 'Xem chi tiết' : 'Tiếp tục kiểm'}" onclick="openInventoryShift('${s.id}')"><i class="ph-bold ${closed ? 'ph-eye' : 'ph-pencil-simple'}"></i></button>
                ${closed ? '' : `<button class="btn-icon" style="color:var(--color-danger)" title="Xóa phiếu" onclick="deleteSession('${s.id}', '${invEsc(s.maphieu)}')"><i class="ph-bold ph-trash"></i></button>`}
            </td>
        </tr>`;
    }).join('');
}

window.createInventoryShift = async function() {
    const btn = document.getElementById('inv-create-btn');
    btn.disabled = true;
    try {
        const shift = await invApi('POST');
        showToast('Đã tạo phiếu', `Phiếu ${shift.maphieu} — nhập tồn thực tế cho từng món.`, 'success');
        showInventoryDetail(shift);
        renderInventorySessions();
    } catch (err) {
        if (err.error_code === 'SHIFT_DRAFT_EXISTS') {
            // Đã có phiếu nháp → mở luôn phiếu đó thay vì báo lỗi
            const shifts = await invApi('GET').catch(() => []);
            const draft = shifts.find(s => s.trangthai === 'nhap');
            showToast('Đang có phiếu chưa chốt', 'Mở phiếu đang kiểm để tiếp tục.', 'warning');
            if (draft) openInventoryShift(draft.id);
        } else {
            showToast('Không tạo được phiếu', err.message, 'danger');
        }
    } finally {
        btn.disabled = false;
    }
};

window.deleteSession = async function(id, code) {
    if (!confirm(`Xóa phiếu nháp ${code}? Số liệu đã nhập sẽ mất.`)) return;
    try {
        await invApi('DELETE', `/${id}`);
        showToast('Xóa thành công', 'Phiếu kiểm kê nháp đã bị xóa.', 'success');
        if (invCurrent && invCurrent.id === id) closeInventoryDetail();
        renderInventorySessions();
    } catch (err) {
        showToast('Không xóa được', err.message, 'danger');
    }
};

// ---------- Bảng đối soát ----------
window.openInventoryShift = async function(id) {
    try {
        showInventoryDetail(await invApi('GET', `/${id}`));
    } catch (err) {
        showToast('Không mở được phiếu', err.message, 'danger');
    }
};

window.closeInventoryDetail = function() {
    invCurrent = null;
    document.getElementById('inv-detail-panel').style.display = 'none';
    document.getElementById('inv-list-panel').style.display = '';
};

function showInventoryDetail(shift) {
    invCurrent = shift;
    const closed = shift.trangthai === 'da_chot';
    document.getElementById('inv-list-panel').style.display = 'none';
    document.getElementById('inv-detail-panel').style.display = '';
    document.getElementById('inv-detail-title').innerHTML =
        `${invEsc(shift.maphieu)} <span class="status-badge inv-badge ${closed ? 'inv-badge--closed' : 'inv-badge--draft'}">${closed ? 'Đã chốt · chỉ xem' : 'Đang nháp'}</span>`;
    document.getElementById('inv-detail-period').textContent =
        `Kỳ: ${invTime(shift.tuluc)} → ${closed ? invTime(shift.giochot) + ' · Người chốt: ' + (shift.nguoichot || '—') : 'hiện tại'}`;

    document.querySelector('#inv-lines-table tbody').innerHTML = shift.lines.map(l => `
        <tr data-dish="${l.thucdon_id}" data-c="${l.tonlythuyet}">
            <td><b>${invEsc(l.tenmon)}</b></td>
            <td class="num">${l.tondauca}</td>
            <td class="num">${l.daban}</td>
            <td class="num"><b>${l.tonlythuyet}</b></td>
            <td class="num">${closed ? `<b>${l.tonthucte}</b>`
                : `<input type="number" min="0" step="1" class="inv-input" value="${l.tonthucte ?? ''}" aria-label="Tồn thực tế ${invEsc(l.tenmon)}" oninput="onInventoryInput(this)">`}</td>
            <td class="num diff-cell"></td>
            <td>${closed ? invEsc(l.lydo || '—')
                : `<input type="text" class="form-control inv-reason" value="${invEsc(l.lydo || '')}" placeholder="VD: Vỡ 1 chai" aria-label="Lý do hao hụt ${invEsc(l.tenmon)}" oninput="onInventoryInput(this)">
                   <span class="inv-field-error"></span>`}</td>
        </tr>`).join('') || '<tr><td colspan="7" class="inv-empty">Phiếu không có món nào.</td></tr>';
    document.querySelectorAll('#inv-lines-table tbody tr[data-dish]').forEach(tr => updateInventoryRow(tr, closed ? shift.lines.find(l => l.thucdon_id === tr.dataset.dish) : null));

    document.getElementById('inv-detail-actions').innerHTML = closed ? '' : `
        <button class="btn btn-outline" onclick="saveInventoryDraft()"><i class="ph-bold ph-floppy-disk"></i> Lưu nháp</button>
        <button class="btn btn-primary" onclick="requestInventoryClose()"><i class="ph-bold ph-lock-key"></i> Xác nhận Đóng ca</button>`;
}

/* AC2 — tính chênh lệch ngay khi nhập; hao hụt thì tô dòng và mở ô lý do */
function updateInventoryRow(tr, savedLine) {
    const c = Number(tr.dataset.c);
    let diff = null;
    if (savedLine) diff = savedLine.chenhlech;
    else {
        const raw = tr.querySelector('.inv-input').value;
        diff = raw === '' ? null : Number(raw) - c;
    }
    const cell = tr.querySelector('.diff-cell');
    tr.classList.toggle('inv-row-loss', diff !== null && diff < 0);
    tr.classList.toggle('inv-row-surplus', diff !== null && diff > 0);
    if (diff === null) cell.innerHTML = '<span class="diff-val zero">—</span>';
    else if (diff < 0) cell.innerHTML = `<span class="diff-val negative">Hao hụt: ${-diff}</span>`;
    else if (diff > 0) cell.innerHTML = `<span class="diff-val positive">Dư: ${diff}</span>`;
    else cell.innerHTML = '<span class="diff-val zero">Khớp</span>';
}

window.onInventoryInput = function(el) {
    const tr = el.closest('tr');
    updateInventoryRow(tr);
    const err = tr.querySelector('.inv-field-error');
    if (err && el.classList.contains('inv-reason') && el.value.trim()) { err.textContent = ''; el.classList.remove('is-invalid'); }
};

function collectInventoryLines() {
    return [...document.querySelectorAll('#inv-lines-table tbody tr[data-dish]')].map(tr => {
        const raw = tr.querySelector('.inv-input').value;
        return {
            thucdon_id: tr.dataset.dish,
            tonthucte: raw === '' ? null : Number(raw),
            lydo: tr.querySelector('.inv-reason').value.trim() || null,
        };
    });
}

/* AC4 — chặn ngay trên giao diện, KHÔNG gọi API khi còn dòng sai */
function validateInventoryLines(lines) {
    let ok = true;
    document.querySelectorAll('#inv-lines-table tbody tr[data-dish]').forEach((tr, i) => {
        const line = lines[i];
        const input = tr.querySelector('.inv-input');
        const reason = tr.querySelector('.inv-reason');
        const err = tr.querySelector('.inv-field-error');
        input.classList.toggle('is-invalid', line.tonthucte === null || line.tonthucte < 0 || !Number.isInteger(line.tonthucte));
        let msg = '';
        if (line.tonthucte === null) msg = 'Nhập tồn thực tế';
        else if (line.tonthucte < 0 || !Number.isInteger(line.tonthucte)) msg = 'Tồn thực tế phải là số nguyên ≥ 0';
        else if (line.tonthucte < Number(tr.dataset.c) && !line.lydo) msg = INV_LOSS_MSG;
        reason.classList.toggle('is-invalid', msg === INV_LOSS_MSG);
        err.textContent = msg;
        if (msg) ok = false;
    });
    return ok;
}

window.saveInventoryDraft = async function() {
    try {
        const lines = collectInventoryLines().map(l => ({ ...l, tonthucte: Number.isInteger(l.tonthucte) && l.tonthucte >= 0 ? l.tonthucte : null }));
        showInventoryDetail(await invApi('PUT', `/${invCurrent.id}/lines`, { lines }));
        showToast('Đã lưu nháp', 'Số liệu kiểm kê đã được lưu, có thể chốt sau.', 'success');
    } catch (err) {
        showToast('Không lưu được', err.message, 'danger');
    }
};

window.requestInventoryClose = function() {
    if (!validateInventoryLines(collectInventoryLines())) {
        showToast('Chưa thể chốt ca', 'Kiểm tra các dòng báo đỏ trong bảng đối soát.', 'danger');
        return;
    }
    document.getElementById('inv-pin-input').value = '';
    document.getElementById('inv-pin-error').textContent = '';
    document.getElementById('inv-pin-modal').style.display = 'flex';
    document.getElementById('inv-pin-input').focus();
};

window.closeInventoryPinModal = function() {
    document.getElementById('inv-pin-modal').style.display = 'none';
};

/* AC3 + AC5 — gửi PIN Quản lý, chốt ca, chuyển phiếu sang chỉ xem */
window.submitInventoryClose = async function() {
    const pin = document.getElementById('inv-pin-input').value.trim();
    const pinErr = document.getElementById('inv-pin-error');
    if (!pin) { pinErr.textContent = 'Nhập mã PIN Quản lý'; return; }
    const btn = document.getElementById('inv-pin-submit');
    btn.disabled = true;
    try {
        const shift = await invApi('POST', `/${invCurrent.id}/close`, { lines: collectInventoryLines(), manager_pin: pin });
        closeInventoryPinModal();
        showInventoryDetail(shift);
        renderInventorySessions();
        showToast('Đã chốt ca', `Phiếu ${shift.maphieu} đã khóa. Tồn thực tế là tồn đầu ca tiếp theo.`, 'success');
    } catch (err) {
        if (err.error_code === 'INVALID_MANAGER_PIN') { pinErr.textContent = err.message; return; }
        closeInventoryPinModal();
        if (err.error_code === 'LOSS_REASON_REQUIRED' && Array.isArray(err.details)) {
            // Server kiểm tra lại AC4 — chỉ ra đúng dòng vi phạm
            err.details.forEach(d => {
                const tr = document.querySelector(`#inv-lines-table tr[data-dish="${d.thucdon_id}"]`);
                if (tr) { tr.querySelector('.inv-field-error').textContent = INV_LOSS_MSG; tr.querySelector('.inv-reason').classList.add('is-invalid'); }
            });
        }
        showToast('Không chốt được ca', err.message, 'danger');
    } finally {
        btn.disabled = false;
    }
};

document.getElementById('inv-pin-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitInventoryClose();
    if (e.key === 'Escape') closeInventoryPinModal();
});

// Hiển thị Toast
function showToast(title, msg, type = 'primary') {
    const colors = {
        'primary': { border: 'var(--color-primary)' },
        'success': { border: 'var(--color-success)' },
        'warning': { border: 'var(--color-warning)' },
        'danger': { border: 'var(--color-danger)' }
    };
    
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = colors[type].border;
    toast.innerHTML = `
        <h4 class="toast-title" style="color: ${colors[type].border}">${title}</h4>
        <p class="toast-body">${msg}</p>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Khởi tạo
loadMenuItems();
renderIngredients();
renderInventorySessions();
