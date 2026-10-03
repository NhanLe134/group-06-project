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

const menuTableBody = document.querySelector('#menu-table tbody');

function renderMenu() {
    menuTableBody.innerHTML = '';
    menuItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="mock-img" style="background-image: url('${item.img}')"></div></td>
            <td><b>${item.name}</b></td>
            <td>${item.category}</td>
            <td>${item.price.toLocaleString('vi-VN')}đ</td>
            <td><span class="badge ${item.statusClass}">${item.status}</span></td>
            <td>
                <button class="btn-icon" title="Sửa món" onclick="showToast('Tính năng', 'Tính năng sửa món đang được bảo trì.', 'warning')"><i class="ph-bold ph-pencil-simple"></i></button>
                <button class="btn-icon" title="Xóa món" style="color: var(--color-danger);" onclick="deleteMenu('${item.id}')"><i class="ph-bold ph-trash"></i></button>
            </td>
        `;
        menuTableBody.appendChild(tr);
    });
}

// Tính năng Thêm Món (Modal)
const addMenuModal = document.getElementById('add-menu-modal');

window.openAddMenuModal = function() {
    addMenuModal.style.display = 'flex';
    document.getElementById('menu-name').value = '';
    document.getElementById('menu-price').value = '';
}
window.closeAddMenuModal = function() {
    addMenuModal.style.display = 'none';
}
window.submitAddMenu = function() {
    const name = document.getElementById('menu-name').value;
    const category = document.getElementById('menu-category').value;
    const priceStr = document.getElementById('menu-price').value;

    if (!name || !priceStr) {
        showToast('Lỗi nhập liệu', 'Vui lòng nhập Tên món và Giá bán!', 'danger');
        return;
    }

    const newItem = {
        id: 'M0' + (menuItems.length + 1),
        name: name,
        category: category,
        price: parseInt(priceStr),
        status: 'Đang bán',
        statusClass: 'badge-success',
        img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' // Ảnh giả lập mặc định
    };

    menuItems.push(newItem);
    renderMenu();
    closeAddMenuModal();
    showToast('Thêm món thành công', `Đã thêm món ${name} vào thực đơn.`, 'success');
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
// NGHIỆP VỤ: ĐỐI SOÁT TỒN KHO (INVENTORY - REQ-12)
// ==========================================
const inventoryData = [
    { id: 'INV01', name: 'Thịt Bò Kobe (Kg)', unit: 'Kg', sysStock: 15.5 },
    { id: 'INV02', name: 'Rượu Vang Đỏ (Chai)', unit: 'Chai', sysStock: 24 },
    { id: 'INV03', name: 'Thịt Gà Ta (Con)', unit: 'Con', sysStock: 10 },
    { id: 'INV04', name: 'Cá Hồi NaUy (Kg)', unit: 'Kg', sysStock: 8.2 }
];

const invTableBody = document.querySelector('#inventory-table tbody');

function renderInventory() {
    invTableBody.innerHTML = '';
    inventoryData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${item.name}</b><br><small style="color: #94A3B8;">Mã: ${item.id}</small></td>
            <td>${item.unit}</td>
            <td><b>${item.sysStock}</b></td>
            <td>
                <input type="number" step="0.1" class="inv-input" data-id="${item.id}" placeholder="0" oninput="calculateDiff('${item.id}', ${item.sysStock}, this.value)">
            </td>
            <td id="diff-${item.id}" class="diff-val zero">0</td>
        `;
        invTableBody.appendChild(tr);
    });
}

window.calculateDiff = function(id, sysStock, actualStr) {
    const diffCell = document.getElementById(`diff-${id}`);
    if (actualStr === '') {
        diffCell.innerText = '0';
        diffCell.className = 'diff-val zero';
        return;
    }
    const actual = parseFloat(actualStr);
    const diff = (actual - sysStock).toFixed(1);

    if (diff < 0) {
        diffCell.innerText = `${diff} (Hụt)`;
        diffCell.className = 'diff-val negative';
    } else if (diff > 0) {
        diffCell.innerText = `+${diff} (Dư)`;
        diffCell.className = 'diff-val positive';
    } else {
        diffCell.innerText = '0 (Khớp)';
        diffCell.className = 'diff-val zero';
    }
}

window.saveInventory = function() {
    let allFilled = true;
    const inputs = document.querySelectorAll('.inv-input');
    inputs.forEach(input => { if(input.value === '') allFilled = false; });

    if(!allFilled) {
        showToast('Lỗi Kiểm kê', 'Vui lòng nhập đầy đủ số lượng tồn thực tế cho tất cả mặt hàng trước khi Chốt ca.', 'danger');
        return;
    }
    showToast('Lưu thành công', 'Đã lưu biên bản đối soát tồn kho và chốt ca thành công.', 'success');
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
renderInventory();
