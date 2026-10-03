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
// NGHIỆP VỤ: THỰC PHẨM (NGUYÊN LIỆU)
// ==========================================
let ingredientsData = [
    { id: 'NVL001', name: 'Thịt bò Mỹ', unit: 'Kg', category: 'Thịt tươi sống' },
    { id: 'NVL002', name: 'Gạo ST25', unit: 'Kg', category: 'Nông sản' }
];

function renderIngredients() {
    const tbody = document.querySelector('#ingredients-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    ingredientsData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><b>${item.name}</b></td>
            <td>${item.unit}</td>
            <td>${item.category}</td>
            <td>
                <button class="btn-icon" title="Sửa" onclick="showToast('Tính năng', 'Tính năng sửa thực phẩm đang được bảo trì.', 'warning')"><i class="ph-bold ph-pencil-simple"></i></button>
                <button class="btn-icon" style="color:var(--color-danger)" title="Xóa" onclick="deleteIngredient('${item.id}')"><i class="ph-bold ph-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
