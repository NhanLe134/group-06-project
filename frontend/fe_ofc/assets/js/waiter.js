// Cơ sở dữ liệu Table Map mô phỏng với nhiều món ăn để test Tiến độ bưng
const tables = [
    { 
        id: 'T01', name: 'Bàn 01', status: 'occupied', pax: 3, capacity: 4, time: '45 phút',
        items: [
            { id: 'i1', name: 'Bò lúc lắc', status: 'served', statusText: 'Đã bưng', price: '120.000đ' },
            { id: 'i2', name: 'Súp cua tuyết', status: 'served', statusText: 'Đã bưng', price: '85.000đ' },
            { id: 'i3', name: 'Nước ép dưa hấu', status: 'ready', statusText: 'Chờ bưng', price: '45.000đ' },
            { id: 'i4', name: 'Salad cá ngừ', status: 'cooking', statusText: 'Đang nấu', price: '90.000đ' },
            { id: 'i5', name: 'Cơm chiên hải sản', status: 'cooking', statusText: 'Đang nấu', price: '110.000đ' }
        ]
    },
    { id: 'T02', name: 'Bàn 02', status: 'empty', pax: 0, capacity: 2, time: '', items: [] },
    { id: 'T03', name: 'Bàn 03', status: 'cleaning', pax: 0, capacity: 6, time: '', items: [] },
    { 
        id: 'T04', name: 'Bàn 04', status: 'occupied', pax: 5, capacity: 6, time: '15 phút',
        items: [
            { id: 'i6', name: 'Lẩu thái Tomyum', status: 'pending', statusText: 'Chờ nấu', price: '350.000đ' },
            { id: 'i7', name: 'Nước lẩu thêm', status: 'pending', statusText: 'Chờ nấu', price: '30.000đ' }
        ]
    },
    { 
        id: 'T05', name: 'Bàn 05', status: 'occupied', pax: 2, capacity: 4, time: '60 phút',
        items: [
            { id: 'i8', name: 'Gà nướng muối ớt', status: 'served', statusText: 'Đã bưng', price: '180.000đ' },
            { id: 'i9', name: 'Rượu soju', status: 'served', statusText: 'Đã bưng', price: '60.000đ' }
        ]
    },
    { id: 'T06', name: 'Bàn 06', status: 'empty', pax: 0, capacity: 4, time: '', items: [] } 
];

const tableGrid = document.getElementById('table-grid');
const authModal = document.getElementById('auth-modal');
const pinInput = document.getElementById('pin-input');
const authError = document.getElementById('auth-error');

// Drawer DOM
const drawerOverlay = document.getElementById('drawer-overlay');
const tableDrawer = document.getElementById('table-drawer');
const drawerTitle = document.getElementById('drawer-title');
const drawerSubtitle = document.getElementById('drawer-subtitle');
const drawerOrderList = document.getElementById('drawer-order-list');
const drawerOrderSection = document.getElementById('drawer-order-section');
const drawerEmptyState = document.getElementById('drawer-empty-state');
const drawerFooter = document.getElementById('drawer-footer');
const drawerBadge = document.getElementById('drawer-status-badge');

let currentActionCb = null;

// 1. RENDER TABLE MAP CHUYÊN NGHIỆP CÓ TÍNH TOÁN TIẾN ĐỘ LÊN MÓN
function renderTables() {
    tableGrid.innerHTML = '';
    tables.forEach(t => {
        const card = document.createElement('div');
        card.className = 'table-card';
        card.setAttribute('data-status', t.status);
        
        card.addEventListener('click', () => openTableDrawer(t.id));

        // Logic check xem có món nào cần "Bưng" (Trạng thái Ready)
        const hasReadyItem = t.items.some(i => i.status === 'ready');
        const alertBadge = hasReadyItem ? `<div class="action-required-badge"><i class="ph-bold ph-bell-ringing"></i> CẦN BƯNG</div>` : '';

        let progressHtml = '';
        let tableStatusText = '';
        
        if (t.status === 'occupied') {
            const totalItems = t.items.length;
            const servedItems = t.items.filter(i => i.status === 'served').length;
            const progressPercent = totalItems === 0 ? 0 : (servedItems / totalItems) * 100;
            
            // Tính toán Trạng thái tổng quát của Bàn
            if (totalItems === 0) {
                tableStatusText = 'Đang chọn món';
            } else if (servedItems === 0) {
                tableStatusText = 'Chờ lên món';
            } else if (servedItems > 0 && servedItems < totalItems) {
                tableStatusText = 'Đang phục vụ';
            } else {
                tableStatusText = 'Đã đủ món';
            }
            
            progressHtml = `
                <div class="progress-container">
                    <div class="progress-text">
                        <span>Tiến độ lên món</span>
                        <span style="color: ${servedItems === totalItems ? 'var(--color-success)' : 'var(--color-danger)'}">${servedItems}/${totalItems} Món</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${servedItems === totalItems ? 'done' : ''}" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
            `;
        } else if (t.status === 'cleaning') {
            tableStatusText = 'Cần dọn dẹp';
        } else {
            tableStatusText = 'Trống';
        }

        const timeHtml = t.time ? `<span><i class="ph-bold ph-clock"></i> ${t.time}</span>` : '';
        const detailsHtml = `
            <div class="table-details">
                <span><i class="ph-bold ph-user-check"></i> ${t.pax}/${t.capacity} Khách</span>
                ${timeHtml}
            </div>
        `;

        card.innerHTML = `
            ${alertBadge}
            <div class="table-header-row">
                <h3 class="table-name">${t.name}</h3>
                <span class="table-status-badge" style="color: var(--color-${t.status === 'empty' ? 'success' : (t.status === 'occupied' ? 'danger' : 'warning')})">${tableStatusText}</span>
            </div>
            ${detailsHtml}
            ${progressHtml}
        `;
        tableGrid.appendChild(card);
    });
}

// 2. MỞ CHI TIẾT BÀN (DRAWER UI)
function openTableDrawer(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    drawerTitle.innerHTML = `${table.name}`;
    
    // Header Status Badge
    if (table.status === 'occupied') {
        drawerBadge.innerText = 'Đang dùng bữa';
        drawerBadge.style.background = 'var(--color-danger)';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-user-check"></i> ${table.pax}/${table.capacity} Khách • Đã ngồi ${table.time}`;
    } else if (table.status === 'cleaning') {
        drawerBadge.innerText = 'Cần dọn';
        drawerBadge.style.background = 'var(--color-warning)';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-clock"></i> Khách vừa thanh toán rời đi`;
    } else {
        drawerBadge.innerText = 'Trống';
        drawerBadge.style.background = 'var(--color-success)';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-armchair"></i> Sức chứa tối đa: ${table.capacity} Khách`;
    }

    // Body content
    if (table.status === 'empty') {
        drawerEmptyState.style.display = 'block';
        drawerOrderSection.style.display = 'none';
        drawerFooter.innerHTML = `<button class="btn-primary-lg"><i class="ph-bold ph-plus"></i> Mở Bàn & Gọi món</button>`;
    } else if (table.status === 'cleaning') {
        drawerEmptyState.style.display = 'none';
        drawerOrderSection.style.display = 'none';
        drawerFooter.innerHTML = `<button class="btn-clean-lg" onclick="markTableClean('${table.id}')"><i class="ph-bold ph-check-circle"></i> Xác nhận Đã dọn xong</button>`;
    } else {
        drawerEmptyState.style.display = 'none';
        drawerOrderSection.style.display = 'block';
        renderOrderItems(table);
        drawerFooter.innerHTML = `<button class="btn-primary-lg"><i class="ph-bold ph-plus"></i> Gọi thêm món</button>`;
    }

    drawerOverlay.classList.add('active');
    tableDrawer.classList.add('active');
}

function closeTableDrawer() {
    drawerOverlay.classList.remove('active');
    tableDrawer.classList.remove('active');
}

document.getElementById('btn-close-drawer').addEventListener('click', closeTableDrawer);
drawerOverlay.addEventListener('click', closeTableDrawer);

// Render danh sách món trong Drawer (chia theo trạng thái cho dễ nhìn)
function renderOrderItems(table) {
    drawerOrderList.innerHTML = '';
    
    // Sort items để "Cần bưng" lên đầu, "Đã bưng" xuống cuối
    const sortedItems = [...table.items].sort((a, b) => {
        const rank = { 'ready': 1, 'cooking': 2, 'pending': 3, 'served': 4 };
        return rank[a.status] - rank[b.status];
    });

    sortedItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'order-item';
        
        let actionBtn = '';
        if (item.status === 'ready') {
            actionBtn = `<button class="btn-serve-item" title="Bưng ra bàn" onclick="markItemServed('${table.id}', '${item.id}')"><i class="ph-bold ph-check"></i> Xác nhận Bưng</button>`;
        }
        
        row.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <div class="item-meta">
                    <span class="item-status status-${item.status}">${item.statusText}</span>
                    <span style="color: #94A3B8; font-weight: 500;">${item.price}</span>
                </div>
            </div>
            <div class="item-actions">
                ${actionBtn}
                <button class="btn-void-item" title="Hủy món" onclick="requestVoid('${table.id}', '${item.id}', '${item.name}', '${item.status}')">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </div>
        `;
        drawerOrderList.appendChild(row);
    });
}

// 3. NGHIỆP VỤ: ĐÃ BƯNG (SERVED)
window.markItemServed = function(tableId, itemId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const item = table.items.find(i => i.id === itemId);
    if (item) {
        item.status = 'served';
        item.statusText = 'Đã bưng';
        
        // Cập nhật lại Drawer & Table Grid để thanh tiến độ chạy
        renderOrderItems(table);
        renderTables(); 
        
        showToast('Đã bưng món', `Đã phục vụ món <b>${item.name}</b> thành công.`, 'success');
    }
}

// 4. NGHIỆP VỤ: HOÀN TẤT DỌN BÀN
window.markTableClean = function(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (table) {
        table.status = 'empty'; table.pax = 0; table.time = ''; table.items = [];
        closeTableDrawer();
        renderTables();
        showToast('Đã dọn dẹp', `${table.name} đã sẵn sàng đón khách mới.`, 'success');
    }
}

// 5. MANAGER AUTH & VOID
window.requestVoid = function(tableId, itemId, itemName, itemStatus) {
    const extraMsg = (itemStatus === 'cooking' || itemStatus === 'ready') 
        ? `<br><br><span style="color: var(--color-danger); font-weight: 600;"><i class="ph-bold ph-warning-circle"></i> Món đang ở bếp! Hủy món sẽ báo Bếp dừng làm ngay lập tức.</span>` 
        : '';
        
    document.getElementById('auth-desc').innerHTML = `Nhập mã PIN (1234) để xác nhận hủy món <b>${itemName}</b>.${extraMsg}`;

    authModal.style.display = 'flex';
    pinInput.value = '';
    authError.style.display = 'none';
    pinInput.focus();
    
    currentActionCb = () => {
        const table = tables.find(t => t.id === tableId);
        if(table) {
            table.items = table.items.filter(i => i.id !== itemId);
            renderOrderItems(table);
            renderTables();
            showToast('Đã hủy món', `Yêu cầu hủy đã bắn trực tiếp xuống KDS để Bếp ngưng làm.`, 'danger');
        }
    };
};

document.getElementById('btn-cancel-auth').addEventListener('click', () => { authModal.style.display = 'none'; });
document.getElementById('btn-confirm-auth').addEventListener('click', () => {
    if (pinInput.value === '1234') { 
        authModal.style.display = 'none';
        if (currentActionCb) currentActionCb();
    } else { authError.style.display = 'block'; }
});
pinInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-confirm-auth').click();
});

// ==========================================
// TRÌNH GIẢ LẬP LUỒNG (SIMULATOR ACTIONS)
// ==========================================

const notifList = document.getElementById('notif-list');
const notifCountBadge = document.getElementById('notif-count');
let notifCount = 0;

// [SIMULATOR] Bếp báo món xong với TÊN MÓN CỤ THỂ
document.getElementById('btn-mock-kds').addEventListener('click', () => {
    const t01 = tables.find(x => x.id === 'T01');
    if (t01 && t01.items) {
        // Đổi trạng thái 2 món chưa bưng của Bàn 01 thành Ready
        const item1 = t01.items.find(i => i.id === 'i4');
        const item2 = t01.items.find(i => i.id === 'i5');
        
        if (item1) { item1.status = 'ready'; item1.statusText = 'Chờ bưng'; }
        if (item2) { item2.status = 'ready'; item2.statusText = 'Chờ bưng'; }
        
        renderTables();
        
        // Cập nhật Drawer nếu đang mở Bàn 01
        if (tableDrawer.classList.contains('active') && drawerTitle.innerText === 'Bàn 01') {
            renderOrderItems(t01);
        }
        
        // Push Notification
        const emptyState = notifList.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = 'none';
        
        const card = document.createElement('div');
        card.className = 'notif-card';
        card.innerHTML = `
            <div class="notif-header"><span class="notif-table">Bếp Gọi: Bàn 01</span><span class="notif-time">Vừa xong</span></div>
            <div class="notif-desc">
                <p style="margin:0 0 4px 0;"><i class="ph-bold ph-cooking-pot"></i> <b>Salad cá ngừ</b></p>
                <p style="margin:0;"><i class="ph-bold ph-cooking-pot"></i> <b>Cơm chiên hải sản</b></p>
            </div>
            <button class="btn-serve" onclick="openTableDrawer('T01')"><i class="ph-bold ph-eye"></i> Mở xem Bàn 01</button>
        `;
        notifList.prepend(card);
        notifCount++; notifCountBadge.innerText = notifCount;
        
        showToast('KDS Alert', 'Bàn 01 có 2 món vừa nấu xong. Xem ngay!', 'primary');
    }
});

// [SIMULATOR] Thu ngân vừa tính tiền
document.getElementById('btn-mock-payment').addEventListener('click', () => {
    const t05 = tables.find(x => x.id === 'T05'); // Lấy bàn 05 đã đủ món
    if (t05 && t05.status === 'occupied') {
        t05.status = 'cleaning';
        renderTables();
        showToast('Thu ngân', 'Bàn 05 vừa thanh toán thành công. Vui lòng dọn dẹp!', 'warning');
    }
});

// [SIMULATOR] AI Upsell
document.getElementById('btn-mock-upsell').addEventListener('click', () => {
    showToast('AI Gợi ý bán chéo', 'Khách <b>Bàn 01</b> đang ăn món mặn. Đề xuất mời thêm <b>Nước ép / Rượu vang</b>.', 'primary');
});

// Hàm hiển thị Toast chung
function showToast(title, msg, type = 'primary') {
    const colors = {
        'primary': { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1' },
        'success': { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
        'warning': { bg: '#FFFBEB', border: '#D97706', text: '#B45309' },
        'danger': { bg: '#FEF2F2', border: '#DC2626', text: '#B91C1C' }
    };
    const c = colors[type];
    
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.backgroundColor = c.bg;
    toast.style.borderLeftColor = c.border;
    toast.innerHTML = `<h4 class="toast-title" style="color: ${c.border};">${title}</h4><p class="toast-body" style="color: ${c.text};">${msg}</p>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
}

// ==========================================
// REALTIME: BẾP BÁO MÓN XONG (US-03 AC2)
// KDS bấm "Xong" → backend publish ITEM_READY {chitietmon_id, ban, tenmon, soluong}
// lên kênh kds:tickets → hiện thông báo + toast + tiếng "ting".
// ==========================================
const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function pushReadyNotif({ ban, tenmon, soluong }) {
    const emptyState = notifList.querySelector('.empty-state');
    if (emptyState) emptyState.style.display = 'none';

    const table = tables.find(t => t.name === ban);   // sơ đồ bàn hiện còn là dữ liệu mẫu
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `
        <div class="notif-header"><span class="notif-table">Bếp Gọi: ${escHtml(ban)}</span><span class="notif-time">${time}</span></div>
        <div class="notif-desc">
            <p style="margin:0;"><i class="ph-bold ph-cooking-pot"></i> <b>${escHtml(tenmon)}</b> × ${Number(soluong) || 1}</p>
        </div>
        ${table ? `<button class="btn-serve" onclick="openTableDrawer('${table.id}')"><i class="ph-bold ph-eye"></i> Mở xem ${escHtml(ban)}</button>` : ''}
    `;
    notifList.prepend(card);
    notifCount++; notifCountBadge.innerText = notifCount;

    showToast('KDS Alert', `${escHtml(ban)}: <b>${escHtml(tenmon)}</b> × ${Number(soluong) || 1} vừa nấu xong. Mời bưng món!`, 'success');
    if (typeof playTing === 'function') playTing();
}

if (typeof subscribeChannel === 'function') {
    subscribeChannel('kds:tickets', msg => {
        if (msg.event === 'ITEM_READY') pushReadyNotif(msg.payload || {});
    });
}

// Khởi chạy
renderTables();
