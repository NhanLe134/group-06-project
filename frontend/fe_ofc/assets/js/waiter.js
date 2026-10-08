// Cơ sở dữ liệu Table Map mô phỏng với nhiều món ăn để test Tiến độ bưng
const tables = [
    { 
        id: 'T01', name: 'Bàn 01', status: 'occupied', pax: 3, capacity: 4, time: '45 phút',
        items: [
            { id: 'i1', name: 'Bò lúc lắc', status: 'served', statusText: 'Đã phục vụ', price: '120.000đ' },
            { id: 'i2', name: 'Súp cua tuyết', status: 'served', statusText: 'Đã phục vụ', price: '85.000đ' },
            { id: 'i3', name: 'Bia Tiger (Chai)', status: 'ready', statusText: 'Chưa phục vụ', price: '45.000đ', isDrink: true },
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
            { id: 'i7', name: 'Nước lẩu thêm', status: 'pending', statusText: 'Chờ nấu', price: '30.000đ' },
            { id: 'i10', name: 'Coca Cola x2', status: 'ready', statusText: 'Chờ lấy (Quầy Nước)', price: '40.000đ' }
        ]
    },
    { 
        id: 'T05', name: 'Bàn 05', status: 'occupied', pax: 2, capacity: 4, time: '60 phút',
        items: [
            { id: 'i8', name: 'Gà nướng muối ớt', status: 'served', statusText: 'Đã phục vụ', price: '180.000đ' },
            { id: 'i9', name: 'Rượu soju', status: 'served', statusText: 'Đã phục vụ', price: '60.000đ' }
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
        const alertBadge = hasReadyItem ? `<div class="action-required-badge"><i class="ph-bold ph-bell-ringing"></i> CẦN PHỤC VỤ</div>` : '';

        let progressHtml = '';
        let tableStatusText = '';
        
        if (t.status === 'occupied') {
            const totalItems = t.items.length;
            const servedItems = t.items.filter(i => i.status === 'served').length;
            const progressPercent = totalItems === 0 ? 0 : (servedItems / totalItems) * 100;
            
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
                <div class="progress-container" style="margin-top: 12px; border-top: 1px dashed #E2E8F0; padding-top: 12px;">
                    <div class="progress-text" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                        <span style="color:#64748B; font-weight:600;">Tiến trình món</span>
                        <span style="font-weight:700; color: ${servedItems === totalItems ? 'var(--color-success)' : 'var(--color-danger)'}">${servedItems}/${totalItems} Món</span>
                    </div>
                    <div class="progress-bar-bg" style="background:#F1F5F9; height:6px; border-radius:10px; overflow:hidden;">
                        <div class="progress-bar-fill" style="width: ${progressPercent}%; background: ${servedItems === totalItems ? 'var(--color-success)' : 'var(--color-primary)'}; height:100%; transition:width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        } else if (t.status === 'cleaning') {
            tableStatusText = 'Cần dọn dẹp';
        } else {
            tableStatusText = 'Trống';
        }

        const detailsHtml = `
            <div class="table-details">
                <span><i class="ph-bold ph-users"></i> ${t.capacity}</span>
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
    
    if (typeof renderTasks === 'function') {
        renderTasks();
    }
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
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-users"></i> ${table.capacity} Khách • Đã ngồi ${table.time}`;
    } else if (table.status === 'cleaning') {
        drawerBadge.innerText = 'Cần dọn';
        drawerBadge.style.background = 'var(--color-warning)';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-clock"></i> Khách vừa thanh toán rời đi`;
    } else {
        drawerBadge.innerText = 'Trống';
        drawerBadge.style.background = 'var(--color-success)';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-users"></i> ${table.capacity} Khách`;
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
            actionBtn = `<button class="btn-serve-item" title="Xác nhận" onclick="markItemServed('${table.id}', '${item.id}')">Phục vụ</button>`;
        }
        
        let cancelBtn = '';
        if (item.status === 'pending') {
            cancelBtn = `<button class="btn-void-item" title="Hủy món" onclick="requestVoid('${table.id}', '${item.id}', '${item.name}', '${item.status}')"><i class="ph-bold ph-trash"></i></button>`;
        } else if (item.status === 'cooking' || item.status === 'ready') {
            cancelBtn = `<button class="btn-void-item" title="Không thể tự hủy" style="opacity: 0.3; cursor: not-allowed;" onclick="alert('Món này Bếp đang làm hoặc đã xong! Không thể tự hủy, vui lòng gọi Manager.')"><i class="ph-bold ph-trash"></i></button>`;
        } else {
            cancelBtn = `<div style="width: 36px"></div>`; 
        }

        // Tạo UI màu sắc theo yêu cầu: Đã phục vụ -> Xám, Còn lại (chưa phục vụ) -> Đỏ nổi bật
        let rowStyle = item.status === 'served' ? 'opacity: 0.5; filter: grayscale(1);' : '';
        let statusColor = item.status === 'served' ? '#64748B' : 'var(--color-danger)';
        let statusWeight = item.status === 'served' ? '500' : '800';

        row.innerHTML = `
            <div class="item-info" style="${rowStyle}">
                <span class="item-name">${item.name}</span>
                <div class="item-meta">
                    <span style="color: ${statusColor}; font-weight: ${statusWeight};">${item.statusText}</span>
                    <span style="color: #94A3B8; font-weight: 500;">${item.price}</span>
                </div>
            </div>
            <div class="item-actions">
                ${actionBtn}
                ${cancelBtn}
            </div>
        `;
        drawerOrderList.appendChild(row);
    });
}

// 3. NGHIỆP VỤ: ĐÃ PHỤC VỤ (SERVED)
window.markItemServed = function(tableId, itemId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const item = table.items.find(i => i.id === itemId);
    if (item) {
        item.status = 'served';
        item.statusText = 'Đã phục vụ';
        
        // Cập nhật lại Drawer & Table Grid
        renderOrderItems(table);
        renderTables(); 
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
        
        if (item1) { item1.status = 'ready'; item1.statusText = 'Đã nấu'; }
        if (item2) { item2.status = 'ready'; item2.statusText = 'Đã nấu'; }
        
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

// [SIMULATOR] Khách gọi món nước (Routing Không qua Bếp)
document.getElementById('btn-mock-drink').addEventListener('click', () => {
    // Thêm 1 món nước vào Bàn 02 (mô phỏng bàn đang trống có khách mới vào gọi nước)
    const t02 = tables.find(x => x.id === 'T02');
    if (t02) {
        if (t02.status === 'empty') {
            t02.status = 'occupied';
            t02.pax = 2;
            t02.time = 'Vừa xong';
        }
        
        t02.items.push({ 
            id: 'i_drink_' + Date.now(), 
            name: 'Coca Cola x2', 
            status: 'ready', 
            statusText: 'Chưa phục vụ', 
            price: '40.000đ',
            isDrink: true 
        });
        
        renderTables();
        
        // Nếu Drawer đang mở đúng bàn 02 thì update lại
        if (tableDrawer.classList.contains('active') && drawerTitle.innerText.includes('Bàn 02')) {
            renderOrderItems(t02);
        }
        
        // Push Notification ảo báo đích danh "Khu Vực A"
        const emptyState = notifList.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = 'none';
        
        const card = document.createElement('div');
        card.className = 'notif-card';
        card.innerHTML = `
            <div class="notif-header"><span class="notif-table" style="color: var(--color-primary)"><i class="ph-bold ph-map-pin"></i> Khu Vực A: Bàn 02</span><span class="notif-time">Vừa xong</span></div>
            <div class="notif-desc">
                <p style="margin:0;"><i class="ph-bold ph-coffee"></i> <b>Coca Cola x2</b></p>
                <p style="margin:4px 0 0 0; font-size:12px; color: #64748B;">Lấy tại Tủ Mát (Quầy Pha chế)</p>
            </div>
            <button class="btn-serve" onclick="openTableDrawer('T02')"><i class="ph-bold ph-eye"></i> Mở xem Bàn 02</button>
        `;
        notifList.prepend(card);
        notifCount++; notifCountBadge.innerText = notifCount;
        
        showToast('Đơn nước mới', 'Bàn 02 vừa gọi Đồ uống. Vui lòng lấy tại Quầy và phục vụ!', 'primary');
    }
});

// [SIMULATOR] Thu ngân vừa tính tiền
document.getElementById('btn-mock-payment').addEventListener('click', () => {
    const t05 = tables.find(x => x.id === 'T05'); // Lấy bàn 05 đã đủ món
    if (t05 && t05.status === 'occupied') {
        t05.status = 'cleaning';
        renderTables();
        
        // Push Notification
        const emptyState = notifList.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = 'none';
        
        const card = document.createElement('div');
        card.className = 'notif-card';
        card.innerHTML = `
            <div class="notif-header"><span class="notif-table" style="color: var(--color-warning)"><i class="ph-bold ph-broom"></i> Bàn 05 Trống</span><span class="notif-time">Vừa xong</span></div>
            <div class="notif-desc">
                <p style="margin:0;"><i class="ph-bold ph-receipt"></i> Khách đã thanh toán.</p>
                <p style="margin:4px 0 0 0; font-size:12px; color: #64748B;">Vui lòng dọn dẹp bàn để đón khách mới!</p>
            </div>
            <button class="btn-serve" style="background:#FFFBEB; color:#B45309; border-color:#FDE68A;" onclick="openTableDrawer('T05')"><i class="ph-bold ph-check"></i> Xác nhận đã dọn</button>
        `;
        notifList.prepend(card);
        // Lưu ý: Việc tăng notifCount được xử lý ở originalNotifListPrepend bên dưới
        
        showToast('Thu ngân', 'Bàn 05 vừa thanh toán thành công. Vui lòng dọn dẹp!', 'warning');
    }
});

// [SIMULATOR] AI Upsell
document.getElementById('btn-mock-upsell').addEventListener('click', () => {
    const emptyState = notifList.querySelector('.empty-state');
    if (emptyState) emptyState.style.display = 'none';
    
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `
        <div class="notif-header"><span class="notif-table" style="color: #8B5CF6"><i class="ph-bold ph-sparkle"></i> AI Gợi Ý</span><span class="notif-time">Vừa xong</span></div>
        <div class="notif-desc">
            <p style="margin:0;"><b>Bàn 01</b> đang ăn món mặn.</p>
            <p style="margin:4px 0 0 0; font-size:12px; color: #64748B;">Tỷ lệ Upsell 85%: Mời khách dùng thêm Nước ép hoặc Rượu Vang.</p>
        </div>
        <button class="btn-serve" style="background:#F5F3FF; color:#7C3AED; border-color:#DDD6FE;" onclick="openTableDrawer('T01')"><i class="ph-bold ph-wine"></i> Lại bàn tư vấn</button>
    `;
    notifList.prepend(card);
    
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
// TÍNH NĂNG: GOM MÓN THÔNG MINH (SMART BATCHING)
// ==========================================

function renderTasks() {
    const container = document.getElementById('smart-batching-container');
    if (!container) return;
    
    let grouped = {};
    let cleaningTasks = [];
    let totalTasks = 0;
    
    // 1. Phân loại tasks
    tables.forEach(t => {
        if (t.status === 'cleaning') {
            cleaningTasks.push(t);
            totalTasks++;
        }
        
        t.items.forEach(i => {
            if (i.status === 'ready') {
                if (!grouped[i.name]) grouped[i.name] = { isDrink: i.isDrink, items: [] };
                grouped[i.name].items.push({ tableId: t.id, tableName: t.name, item: i });
                totalTasks++;
            }
        });
    });
    
    // 2. Cập nhật Badge đỏ dưới Bottom Nav (Mobile)
    const bottomNotifBadge = document.getElementById('bottom-notif-badge');
    if (bottomNotifBadge) {
        if (totalTasks > 0) {
            bottomNotifBadge.innerText = totalTasks;
            bottomNotifBadge.style.display = 'inline-block';
        } else {
            bottomNotifBadge.style.display = 'none';
        }
    }

    let html = '';

    // 3. Render nhóm 1: Gợi ý Gom đơn (Gom >= 2)
    let hasBatched = false;
    Object.keys(grouped).forEach(itemName => {
        const group = grouped[itemName];
        const list = group.items;
        if (list.length > 1) {
            if (!hasBatched) {
                html += '<h4 style="font-size: 12px; font-weight: 800; color: #64748B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;"><i class="ph-bold ph-lightning"></i> Gợi ý tiện đường</h4>';
                hasBatched = true;
            }
            let tablesText = list.map(entry => entry.tableName).join(', ');
            
            html += `
            <div class="notif-card" style="margin-top: 0; background: #FFFBEB; border-color: #E2E8F0; border-left-color: var(--color-warning);">
                <div class="notif-header" style="margin-bottom: 8px;">
                    <span class="notif-table" style="color: #B45309; display: flex; align-items: center; gap: 6px;">
                        <i class="ph-fill ph-stack"></i> GOM MÓN
                    </span>
                    <span class="notif-time">Mới nhất</span>
                </div>
                <div class="notif-desc" style="margin-bottom: 12px;">
                    <p style="margin:0; font-size: 16px; color: var(--color-text-main);"><b>${list.length}x ${itemName}</b></p>
                    <p style="margin:4px 0 0 0; font-size:13px; color: #64748B; display: flex; align-items: center; gap: 4px;"><i class="ph-bold ph-map-pin"></i> Giao đến: <b style="color: var(--color-text-main);">${tablesText}</b></p>
                </div>
                <button class="btn-serve" style="background: #B45309; color: #fff;" onclick="serveBatch('${itemName}')"><i class="ph-bold ph-check"></i> Đã lấy xong (${list.length})</button>
            </div>
            `;
            delete grouped[itemName]; // Xóa để không bị render lại ở dưới
        }
    });

    // 4. Render nhóm 2: Phục vụ lẻ & Lấy nước
    let hasSingles = false;
    Object.keys(grouped).forEach(itemName => {
        const group = grouped[itemName];
        const list = group.items;
        if (!hasSingles) {
            html += `<h4 style="font-size: 12px; font-weight: 800; color: #64748B; margin: ${hasBatched ? '16px' : '0'} 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;"><i class="ph-bold ph-tray"></i> Cần phục vụ</h4>`;
            hasSingles = true;
        }
        
        list.forEach(entry => {
            const isDrink = group.isDrink;
            const icon = isDrink ? '<i class="ph-bold ph-coffee"></i> CẦN LẤY NƯỚC' : '<i class="ph-bold ph-cooking-pot"></i> CẦN BƯNG MÓN';
            const titleColor = isDrink ? '#0284C7' : 'var(--color-success)';
            const bgColor = isDrink ? '#F0F9FF' : '#ffffff';
            const borderColor = isDrink ? '#38BDF8' : 'var(--color-success)';
            
            html += `
            <div class="notif-card" style="margin-top: 8px; background: ${bgColor}; border-color: #E2E8F0; border-left-color: ${borderColor};">
                <div class="notif-header" style="margin-bottom: 8px;">
                    <span class="notif-table" style="color: ${titleColor}; display: flex; align-items: center; gap: 6px;">
                        ${icon}
                    </span>
                    <span class="notif-time">Vừa xong</span>
                </div>
                <div class="notif-desc" style="margin-bottom: 12px;">
                    <p style="margin:0; font-size: 16px; color: var(--color-text-main);"><b>1x ${itemName}</b></p>
                    <p style="margin:4px 0 0 0; font-size:13px; color: #64748B;"><i class="ph-bold ph-map-pin"></i> Bàn: <b style="color: var(--color-text-main);">${entry.tableName}</b></p>
                </div>
                <button class="btn-serve" style="background: ${titleColor}; color: #fff;" onclick="markItemServed('${entry.tableId}', '${entry.item.id}')"><i class="ph-bold ph-check"></i> Đã hoàn tất</button>
            </div>
            `;
        });
    });

    // 5. Render nhóm 3: Dọn dẹp bàn
    let hasCleaning = false;
    cleaningTasks.forEach(t => {
        if (!hasCleaning) {
            html += `<h4 style="font-size: 12px; font-weight: 800; color: #64748B; margin: ${(hasBatched || hasSingles) ? '16px' : '0'} 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;"><i class="ph-bold ph-broom"></i> Cần dọn dẹp</h4>`;
            hasCleaning = true;
        }
        
        html += `
        <div class="notif-card" style="margin-top: 8px; background: #FEF2F2; border-color: #E2E8F0; border-left-color: var(--color-danger);">
            <div class="notif-header" style="margin-bottom: 8px;">
                <span class="notif-table" style="color: var(--color-danger); display: flex; align-items: center; gap: 6px;">
                    <i class="ph-bold ph-broom"></i> DỌN DẸP BÀN
                </span>
                <span class="notif-time">Vừa xong</span>
            </div>
            <div class="notif-desc" style="margin-bottom: 12px;">
                <p style="margin:0; font-size: 16px; color: var(--color-text-main);">Khách đã thanh toán rời đi</p>
                <p style="margin:4px 0 0 0; font-size:13px; color: #64748B;"><i class="ph-bold ph-map-pin"></i> Vị trí: <b style="color: var(--color-text-main);">${t.name}</b></p>
            </div>
            <button class="btn-serve" style="background: var(--color-danger); color: #fff;" onclick="markTableClean('${t.id}')"><i class="ph-bold ph-check"></i> Đã dọn xong</button>
        </div>
        `;
    });

    container.innerHTML = html;
    
    // 6. Xử lý Empty State
    const emptyState = document.querySelector('#notif-list .empty-state');
    if (totalTasks > 0) {
        if (emptyState) emptyState.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'block';
    }
}

window.serveBatch = function(itemName) {
    tables.forEach(t => {
        t.items.forEach(i => {
            if (i.status === 'ready' && i.name === itemName) {
                i.status = 'served';
                i.statusText = 'Đã phục vụ';
            }
        });
    });
    
    renderTables();
    
    // Update drawer if active
    if (document.getElementById('table-drawer').classList.contains('active')) {
        const titleText = document.getElementById('drawer-title').innerText;
        const tableName = titleText.split('Đang')[0].trim();
        const activeTable = tables.find(t => t.name.includes(tableName));
        if (activeTable) renderOrderItems(activeTable);
    }
    
    showToast('Hoàn tất', `Đã bưng <b>${itemName}</b> đến các bàn.`, 'success');
}

// TÍNH NĂNG: THÔNG BÁO (NOTIFICATION BELL & BOTTOM NAV)
const sidePanel = document.getElementById('side-panel');
const mainContent = document.querySelector('.main-content');
const navNotif = document.getElementById('nav-notif');
const navTables = document.getElementById('nav-tables');
const bottomNotifBadge = document.getElementById('bottom-notif-badge');

if (navNotif && navTables) {
    navNotif.addEventListener('click', () => {
        navNotif.classList.add('active');
        navTables.classList.remove('active');
        sidePanel.classList.add('tab-active');
        sidePanel.classList.remove('tab-hidden');
        mainContent.classList.add('tab-hidden');
        mainContent.classList.remove('tab-active');
        
        // Reset badge khi mở tab thông báo
        bottomNotifBadge.style.display = 'none';
        bottomNotifBadge.innerText = '0';
    });

    navTables.addEventListener('click', () => {
        navTables.classList.add('active');
        navNotif.classList.remove('active');
        mainContent.classList.add('tab-active');
        mainContent.classList.remove('tab-hidden');
        sidePanel.classList.add('tab-hidden');
        sidePanel.classList.remove('tab-active');
    });
}

// Ghi đè lại hành vi push thông báo để cập nhật Badge màu đỏ
const originalNotifListPrepend = notifList.prepend;
notifList.prepend = function(node) {
    originalNotifListPrepend.call(notifList, node);
    
    // Nếu đang ở tab Bàn (side-panel bị ẩn) trên mobile, hiện badge đỏ ở dưới cùng
    if (window.innerWidth <= 900 && (!navNotif.classList.contains('active'))) {
        let currentCount = parseInt(bottomNotifBadge.innerText) || 0;
        bottomNotifBadge.innerText = currentCount + 1;
        bottomNotifBadge.style.display = 'inline-block';
    }
};

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
