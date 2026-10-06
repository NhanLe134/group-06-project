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
let menuItems = [
    { id: 'M01', name: 'Lẩu Thái Tomyum', category: 'Món chính', price: 350000, status: 'Đang bán', statusClass: 'badge-success', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200' },
    { id: 'M02', name: 'Súp cua tuyết', category: 'Khai vị', price: 850000, status: 'Tạm ẩn', statusClass: 'badge-danger', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200' },
    { id: 'M03', name: 'Cơm chiên hải sản', category: 'Món chính', price: 110000, status: 'Đang bán', statusClass: 'badge-success', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200' }
];

// Only drinks use tracked stock; keep the rest of the menu stock-free.
menuItems.forEach(item => { if (item.category === 'Đồ uống') item.stock = 12; });
const menuFilters = { price: 'all', status: 'all', stock: 'all' };

const menuTableBody = document.querySelector('#menu-table tbody');

function renderMenu() {
    menuTableBody.innerHTML = '';
    const search = (document.querySelector('#tab-menu-cms .search-box input')?.value || '').trim().toLocaleLowerCase('vi');
    let visibleItems = menuItems.filter(item => {
        if (search && !item.name.toLocaleLowerCase('vi').includes(search)) return false;
        if (menuFilters.status !== 'all' && item.status !== menuFilters.status) return false;
        if (menuFilters.stock !== 'all') {
            if (item.category !== 'Đồ uống') return false;
            if (menuFilters.stock === 'out' && item.stock !== 0) return false;
            if (menuFilters.stock === 'low' && !(item.stock > 0 && item.stock < 20)) return false;
            if (menuFilters.stock === 'available' && item.stock < 20) return false;
        }
        return true;
    });
    if (menuFilters.price === 'high-low') visibleItems.sort((a, b) => b.price - a.price);
    if (menuFilters.price === 'low-high') visibleItems.sort((a, b) => a.price - b.price);
    visibleItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><div class="mock-img" style="background-image: url('${item.img}')"></div></td>
            <td><b>${item.name}</b></td>
            <td>${item.category}</td>
            <td>${item.price.toLocaleString('vi-VN')}đ</td>
            <td><span class="badge ${item.statusClass}">${item.status}</span></td>
            <td>${item.category === 'Đồ uống' ? `<input class="inv-input menu-stock-input" type="number" min="0" value="${item.stock ?? 0}" aria-label="Số lượng tồn" onchange="updateMenuStock('${item.id}', this.value)">` : '<span class="stock-na">—</span>'}</td>
            <td><div class="menu-row-actions"><button class="btn-icon" title="Xem chi tiết" aria-label="Xem chi tiết" onclick="showMenuDetail('${item.id}')"><i class="ph-bold ph-eye"></i></button><button class="btn-icon" title="Sửa món" aria-label="Sửa món" onclick="openEditMenuModal('${item.id}')"><i class="ph-bold ph-pencil-simple"></i></button><button class="btn-icon danger-icon" title="Xóa món" aria-label="Xóa món" onclick="deleteMenu('${item.id}')"><i class="ph-bold ph-trash"></i></button></div></td>
        `;
        menuTableBody.appendChild(tr);
    });
}

window.updateMenuStock = function(id, value) {
    const item = menuItems.find(menuItem => menuItem.id === id);
    if (item) item.stock = Math.max(0, Number.parseInt(value, 10) || 0);
    renderMenu();
};
window.showMenuDetail = function(id) {
    const item = menuItems.find(menuItem => menuItem.id === id);
    if (!item) return;

    const spicyLabel = { 'Không cay': '🌿 Không cay', 'Cay nhẹ': '🌶 Cay nhẹ', 'Cay vừa': '🌶🌶 Cay vừa', 'Cay nhiều': '🌶🌶🌶 Cay nhiều' };
    const dietLabel = item.diet === 'Chay'
        ? '<span style="background:#DCFCE7;color:#15803D;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">🥦 Chay</span>'
        : '<span style="background:#FEE2E2;color:#B91C1C;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">🥩 Mặn</span>';

    const isDrink = item.category === 'Đồ uống';

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

            ${isDrink ? `
            <div class="form-group">
                <label>Số lượng tồn</label>
                <input type="text" class="form-control" value="${item.stock ?? 0}" readonly>
            </div>` : ''}

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
                <div class="upload-box has-image" style="cursor:default;">
                    <img src="${item.img}" alt="${item.name}" style="max-height:140px; max-width:100%; border-radius:8px;">
                    <p style="margin-top:8px; font-size:12px;">${item.name}</p>
                </div>
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
    const isDrink = item.category === 'Đồ uống';
    document.getElementById('edit-stock-group').hidden = !isDrink;
    document.getElementById('edit-menu-stock').value = isDrink ? (item.stock ?? 0) : '';

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

    document.getElementById('edit-menu-modal').style.display = 'flex';
};

window.closeEditMenuModal = function() {
    document.getElementById('edit-menu-modal').style.display = 'none';
};

document.getElementById('edit-menu-category')?.addEventListener('change', e => {
    const isDrink = e.target.value === 'Đồ uống';
    document.getElementById('edit-stock-group').hidden = !isDrink;
});

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

window.submitEditMenu = function() {
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

    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    const previewEl = document.getElementById('edit-upload-preview');
    const imgSrc = previewEl.src || item.img;

    const status = document.getElementById('edit-menu-status').value;
    item.name = name;
    item.category = category;
    item.price = parseInt(priceStr);
    item.status = status;
    item.statusClass = status === 'Đang bán' ? 'badge-success' : 'badge-danger';
    item.description = description;
    item.ingredients = ingredients;
    item.spicy = document.getElementById('edit-menu-spicy').value;
    item.diet = document.querySelector('input[name="edit-menu-diet"]:checked').value;
    item.allergens = allergens;
    item.img = imgSrc;
    if (category === 'Đồ uống') {
        item.stock = Number.parseInt(document.getElementById('edit-menu-stock').value, 10) || 0;
    } else {
        delete item.stock;
    }

    renderMenu();
    closeEditMenuModal();
    showToast('Cập nhật thành công', `Đã lưu thay đổi cho món "${name}".`, 'success');
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

document.getElementById('menu-category')?.addEventListener('change', event => {
    const isDrink = event.target.value === 'Đồ uống';
    document.getElementById('menu-stock-group').hidden = !isDrink;
    document.getElementById('menu-stock').required = isDrink;
});

window.submitAddMenu = function() {
    const name = document.getElementById('menu-name').value.trim();
    const category = document.getElementById('menu-category').value;
    const priceStr = document.getElementById('menu-price').value.trim();
    const stock = document.getElementById('menu-stock').value;
    const description = document.getElementById('menu-description').value.trim();
    const isDrink = category === 'Đồ uống';

    // Validate bắt buộc (*)
    if (!name) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên món!', 'danger'); document.getElementById('menu-name').focus(); return; }
    if (!priceStr) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Giá bán!', 'danger'); document.getElementById('menu-price').focus(); return; }
    if (!description) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Mô tả!', 'danger'); document.getElementById('menu-description').focus(); return; }
    const ingredients = document.getElementById('menu-ingredients').value.trim();
    const allergens = document.getElementById('menu-allergens').value.trim();
    if (!ingredients) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thành phần!', 'danger'); document.getElementById('menu-ingredients').focus(); return; }
    if (!allergens) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Thông tin dị ứng!', 'danger'); document.getElementById('menu-allergens').focus(); return; }

    // Lấy ảnh preview nếu có, fallback sang ảnh mặc định
    const previewEl = document.getElementById('upload-preview');
    const imgSrc = (previewEl.src && previewEl.style.display !== 'none')
        ? previewEl.src
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';

    const newItem = {
        id: 'M0' + (menuItems.length + 1),
        name,
        category,
        price: parseInt(priceStr),
        status: 'Đang bán',
        statusClass: 'badge-success',
        description,
        ingredients,
        spicy: document.getElementById('menu-spicy').value,
        diet: document.querySelector('input[name="menu-diet"]:checked').value,
        allergens,
        ...(isDrink ? { stock: Number.parseInt(stock, 10) || 0 } : {}),
        img: imgSrc
    };

    menuItems.push(newItem);
    renderMenu();
    closeAddMenuModal();
    showToast('Thêm món thành công', `Đã thêm món "${name}" vào thực đơn.`, 'success');
}

window.deleteMenu = function(id) {
    if(confirm('Bạn có chắc chắn muốn xóa món này?')) {
        menuItems = menuItems.filter(i => i.id !== id);
        renderMenu();
        showToast('Xóa thành công', 'Món ăn đã bị gỡ khỏi thực đơn.', 'success');
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
// NGHIỆP VỤ: THỰC PHẨM (NGUYÊN LIỆU)
// ==========================================
let ingredientsData = [
    { id: 'NVL001', name: 'Thịt bò Mỹ', unit: 'Kg', category: 'Thịt tươi sống', stock: 50, threshold: 10, img: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=200', notes: 'Nhập từ Vissan' },
    { id: 'NVL002', name: 'Gạo ST25', unit: 'Kg', category: 'Nông sản', stock: 120, threshold: 20, img: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=200', notes: 'Gạo tẻ thơm' },
    { id: 'NVL003', name: 'Cà chua Đà Lạt', unit: 'Kg', category: 'Nông sản', stock: 5, threshold: 10, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200', notes: 'Dùng cho Salad' }
];

function renderIngredients() {
    const tbody = document.getElementById('ingredients-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const search = (document.getElementById('ingredient-search')?.value || '').trim().toLowerCase();
    
    let visibleItems = ingredientsData.filter(item => {
        if (search && !item.name.toLowerCase().includes(search)) return false;
        return true;
    });

    visibleItems.forEach(item => {
        const isLowStock = item.stock <= item.threshold;
        const stockStyle = isLowStock ? 'color: var(--color-danger); font-weight: bold;' : '';
        const stockBadge = isLowStock ? ' <span style="background:var(--color-danger); color:#fff; font-size:10px; padding:2px 4px; border-radius:4px; margin-left:4px;">Sắp hết</span>' : '';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="mock-img" style="background-image: url('${item.img || ''}'); width:40px; height:40px; border-radius:8px; flex-shrink:0;"></div>
                    <b>${item.name}</b>
                </div>
            </td>
            <td>${item.unit}</td>
            <td>${item.category}</td>
            <td style="${stockStyle}">${item.stock} ${item.unit}${stockBadge}</td>
            <td>
                <button class="btn-icon" title="Xem chi tiết" onclick="showIngredientDetail('${item.id}')"><i class="ph-bold ph-eye"></i></button>
                <button class="btn-icon" title="Sửa" onclick="openEditIngredientModal('${item.id}')"><i class="ph-bold ph-pencil-simple"></i></button>
                <button class="btn-icon" style="color:var(--color-danger)" title="Xóa" onclick="deleteIngredient('${item.id}')"><i class="ph-bold ph-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
document.getElementById('ingredient-search')?.addEventListener('input', renderIngredients);

// Preview Image cho Ingredient
window.previewIngImage = function(event, prefix) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(`${prefix}-upload-preview`);
        const icon = document.getElementById(`${prefix}-upload-icon`);
        const label = document.getElementById(`${prefix}-upload-label`);
        const uploadBox = document.getElementById(`${prefix}-upload-box`);
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
        label.textContent = file.name;
        uploadBox.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// 1. THÊM NGUYÊN LIỆU
window.openAddIngredientModal = function() {
    document.getElementById('add-ingredient-modal').style.display = 'flex';
    document.getElementById('ing-name').value = '';
    document.getElementById('ing-category').value = 'Thịt tươi sống';
    document.getElementById('ing-unit').value = 'Kg';
    document.getElementById('ing-stock').value = '';
    document.getElementById('ing-threshold').value = '5';
    document.getElementById('ing-notes').value = '';
    
    const preview = document.getElementById('ing-upload-preview');
    const icon = document.getElementById('ing-upload-icon');
    const label = document.getElementById('ing-upload-label');
    const uploadBox = document.getElementById('ing-upload-box');
    preview.style.display = 'none';
    preview.src = '';
    icon.style.display = 'block';
    label.textContent = 'Click hoặc Kéo thả ảnh vào đây';
    uploadBox.classList.remove('has-image');
    document.getElementById('ing-image-input').value = '';
}
window.closeAddIngredientModal = function() { document.getElementById('add-ingredient-modal').style.display = 'none'; }
window.submitAddIngredient = function() {
    const name = document.getElementById('ing-name').value.trim();
    const category = document.getElementById('ing-category').value;
    const unit = document.getElementById('ing-unit').value;
    const stock = document.getElementById('ing-stock').value;
    const threshold = document.getElementById('ing-threshold').value;
    const notes = document.getElementById('ing-notes').value.trim();
    
    if (!name) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên nguyên liệu!', 'danger'); document.getElementById('ing-name').focus(); return; }
    if (!stock) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tồn kho ban đầu!', 'danger'); document.getElementById('ing-stock').focus(); return; }
    
    const previewEl = document.getElementById('ing-upload-preview');
    const imgSrc = (previewEl.src && previewEl.style.display !== 'none') ? previewEl.src : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
    
    const newId = 'NVL' + String(ingredientsData.length + 1).padStart(3, '0');
    ingredientsData.push({
        id: newId, name, category, unit, 
        stock: parseInt(stock), threshold: parseInt(threshold), 
        notes, img: imgSrc
    });
    renderIngredients();
    closeAddIngredientModal();
    showToast('Thành công', `Đã thêm nguyên liệu "${name}".`, 'success');
}

// 2. XEM CHI TIẾT
window.showIngredientDetail = function(id) {
    const item = ingredientsData.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('ingredient-detail-body').innerHTML = `
        <div class="modal-body">
            <div class="form-group">
                <label>Mã / Tên nguyên liệu</label>
                <input type="text" class="form-control" value="[${item.id}] ${item.name}" readonly>
            </div>
            <div class="form-group">
                <label>Nhóm / Đơn vị tính</label>
                <input type="text" class="form-control" value="${item.category} - ${item.unit}" readonly>
            </div>
            <div class="form-group">
                <label>Tồn kho hiện tại</label>
                <input type="text" class="form-control" value="${item.stock} ${item.unit} ${item.stock <= item.threshold ? '(Sắp hết!)' : ''}" readonly style="${item.stock <= item.threshold ? 'color: red; font-weight: bold;' : ''}">
            </div>
            <div class="form-group">
                <label>Ngưỡng cảnh báo</label>
                <input type="text" class="form-control" value="${item.threshold} ${item.unit}" readonly>
            </div>
            <div class="form-group">
                <label>Ghi chú</label>
                <textarea class="form-control" rows="2" readonly style="resize:none;">${item.notes || '—'}</textarea>
            </div>
            <div class="form-group">
                <label>Hình ảnh Minh họa</label>
                <div class="upload-box has-image" style="cursor:default;">
                    <img src="${item.img}" alt="${item.name}" style="max-height:140px; max-width:100%; border-radius:8px;">
                </div>
            </div>
        </div>
    `;
    document.getElementById('detail-edit-ing-btn').onclick = () => {
        closeIngredientDetail();
        openEditIngredientModal(id);
    };
    document.getElementById('ingredient-detail-modal').style.display = 'flex';
}
window.closeIngredientDetail = function() { document.getElementById('ingredient-detail-modal').style.display = 'none'; }

// 3. SỬA NGUYÊN LIỆU
window.openEditIngredientModal = function(id) {
    const item = ingredientsData.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('edit-ing-id').value = item.id;
    document.getElementById('edit-ing-name').value = item.name;
    document.getElementById('edit-ing-category').value = item.category;
    document.getElementById('edit-ing-unit').value = item.unit;
    document.getElementById('edit-ing-stock').value = item.stock;
    document.getElementById('edit-ing-threshold').value = item.threshold;
    document.getElementById('edit-ing-notes').value = item.notes || '';
    
    const preview = document.getElementById('edit-ing-upload-preview');
    const icon = document.getElementById('edit-ing-upload-icon');
    const label = document.getElementById('edit-ing-upload-label');
    const box = document.getElementById('edit-ing-upload-box');
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
    document.getElementById('edit-ing-image-input').value = '';
    
    document.getElementById('edit-ingredient-modal').style.display = 'flex';
}
window.closeEditIngredientModal = function() { document.getElementById('edit-ingredient-modal').style.display = 'none'; }
window.submitEditIngredient = function() {
    const id = document.getElementById('edit-ing-id').value;
    const item = ingredientsData.find(i => i.id === id);
    if (!item) return;
    
    const name = document.getElementById('edit-ing-name').value.trim();
    if (!name) { showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên nguyên liệu!', 'danger'); document.getElementById('edit-ing-name').focus(); return; }
    
    item.name = name;
    item.category = document.getElementById('edit-ing-category').value;
    item.unit = document.getElementById('edit-ing-unit').value;
    item.stock = parseInt(document.getElementById('edit-ing-stock').value || 0);
    item.threshold = parseInt(document.getElementById('edit-ing-threshold').value || 0);
    item.notes = document.getElementById('edit-ing-notes').value.trim();
    
    const previewEl = document.getElementById('edit-ing-upload-preview');
    item.img = previewEl.src || item.img;
    
    renderIngredients();
    closeEditIngredientModal();
    showToast('Cập nhật thành công', `Đã lưu thay đổi cho "${name}".`, 'success');
}

window.deleteIngredient = function(id) {
    if(confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) {
        ingredientsData = ingredientsData.filter(i => i.id !== id);
        renderIngredients();
        showToast('Xóa thành công', 'Nguyên liệu đã bị xóa.', 'success');
    }
}

// ==========================================
// NGHIỆP VỤ: PHIẾU KIỂM KÊ (INVENTORY SESSIONS)
// ==========================================
let inventorySessionsData = [
    { id: 'PKK-1010', date: '10/10/2026 23:00', manager: 'Quản lý Admin', status: 'Đã chốt', bg: '#BBF7D0', color: '#166534' },
    { id: 'PKK-1110', date: '11/10/2026 23:00', manager: 'Quản lý Admin', status: 'Đang nháp', bg: '#FEF3C7', color: '#D97706' }
];

function renderInventorySessions() {
    const tbody = document.querySelector('#inventory-sessions-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    inventorySessionsData.forEach(session => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${session.id}</b></td>
            <td>${session.date}</td>
            <td>${session.manager}</td>
            <td><span class="status-badge" style="background:${session.bg}; color:${session.color}; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:700">${session.status}</span></td>
            <td>
                <button class="btn-icon" title="${session.status === 'Đang nháp' ? 'Tiếp tục kiểm' : 'Xem chi tiết'}" onclick="showToast('Tính năng', 'Đang mở chi tiết phiếu kiểm kê...', 'primary')"><i class="ph-bold ${session.status === 'Đang nháp' ? 'ph-pencil-simple' : 'ph-eye'}"></i></button>
                <button class="btn-icon" style="color:var(--color-danger)" title="Xóa phiếu" onclick="deleteSession('${session.id}')"><i class="ph-bold ph-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteSession = function(id) {
    if(confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) {
        inventorySessionsData = inventorySessionsData.filter(s => s.id !== id);
        renderInventorySessions();
        showToast('Xóa thành công', 'Phiếu kiểm kê đã bị xóa.', 'success');
    }
}

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
renderMenu();
renderIngredients();
renderInventorySessions();
