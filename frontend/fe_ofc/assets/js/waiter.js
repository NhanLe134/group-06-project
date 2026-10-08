let tables = [];

async function loadTables() {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/tables`);
        if (!res.ok) throw new Error('Lỗi tải sơ đồ bàn');
        tables = await res.json();
        renderTables();
    } catch (err) {
        console.error(err);
        showToast('Lỗi kết nối', 'Không thể tải Sơ đồ bàn từ Server', 'danger');
    }
}

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

let currentZone = 'all';

// Initialize Zone Filter Event Listener
function initZoneFilter() {
    const zoneFilter = document.getElementById('zone-filter');
    if (zoneFilter) {
        zoneFilter.addEventListener('change', (e) => {
            currentZone = e.target.value;
            renderTables();
        });
    }
}
initZoneFilter();

// 1. RENDER TABLE MAP CHUYÊN NGHIỆP CÓ TÍNH TOÁN TIẾN ĐỘ LÊN MÓN
function renderTables() {
    tableGrid.innerHTML = '';
    tables.forEach(t => {
        if (currentZone !== 'all' && t.zone !== currentZone) return; // Lọc theo khu vực
        
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
        if (item.status === 'pending' || item.status === 'cooking' || item.status === 'ready') {
            cancelBtn = `<button class="btn-void-item" title="Điều chỉnh/Hủy món" onclick="requestVoid('${table.id}', '${item.id}', '${item.name}', '${item.status}')"><i class="ph-bold ph-trash"></i></button>`;
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
window.markItemServed = async function(tableId, itemId) {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/items/${itemId}/serve`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Lỗi cập nhật');
        await loadTables();
        
        if (document.getElementById('table-drawer').classList.contains('active')) {
            const table = tables.find(t => t.id === tableId);
            if (table) renderOrderItems(table);
        }
    } catch (e) {
        showToast('Lỗi', 'Không thể xác nhận phục vụ', 'danger');
    }
}

// 4. NGHIỆP VỤ: HOÀN TẤT DỌN BÀN
window.markTableClean = async function(tableId) {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/tables/${tableId}/clean`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Lỗi cập nhật');
        
        closeTableDrawer();
        await loadTables();
        showToast('Đã dọn dẹp', `Bàn đã sẵn sàng đón khách mới.`, 'success');
    } catch (e) {
        showToast('Lỗi', 'Không thể cập nhật dọn bàn', 'danger');
    }
}

// 5. ĐIỀU CHỈNH SỐ LƯỢNG & HỦY MÓN
window.requestVoid = function(tableId, itemId, itemName, itemStatus) {
    if (itemStatus === 'served') {
        showToast('Lỗi', 'Không thể sửa món đã phục vụ', 'danger');
        return;
    }
    
    const qtyStr = prompt(`Nhập số lượng bạn muốn giữ lại cho món [${itemName}].\n(Nhập 0 để HỦY hoàn toàn món này):`, "0");
    if (qtyStr === null) return; // User cancelled
    
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty < 0) {
        alert("Số lượng không hợp lệ!");
        return;
    }
    
    currentActionCb = async () => {
        try {
            const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/items/${itemId}/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: "", new_quantity: qty })
            });
            if (!res.ok) {
                throw new Error('Không thể cập nhật món');
            }
            
            await loadTables();
            
            if (document.getElementById('table-drawer').classList.contains('active')) {
                const table = tables.find(t => t.id === tableId);
                if (table) renderOrderItems(table);
            }
            showToast('Thành công', qty === 0 ? 'Đã hủy món.' : `Đã điều chỉnh thành ${qty} phần.`, 'success');
        } catch (e) {
            showToast('Lỗi', e.message, 'danger');
        }
    };
    
    currentActionCb();
};

document.getElementById('btn-cancel-auth').addEventListener('click', () => { authModal.style.display = 'none'; });
document.getElementById('btn-confirm-auth').addEventListener('click', () => {
    if (pinInput.value) { 
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
        // Lọc thông báo nhiệm vụ theo khu vực Waiter đang chọn
        if (currentZone !== 'all' && t.zone !== currentZone) return;

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

window.serveBatch = async function(itemName) {
    const itemsToServe = [];
    tables.forEach(t => {
        t.items.forEach(i => {
            if (i.status === 'ready' && i.name === itemName) {
                itemsToServe.push(i.id);
            }
        });
    });
    
    if (itemsToServe.length === 0) return;
    
    try {
        await Promise.all(itemsToServe.map(id => 
            fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/items/${id}/serve`, { method: 'PATCH' })
        ));
        
        await loadTables();
        
        if (document.getElementById('table-drawer').classList.contains('active')) {
            const titleText = document.getElementById('drawer-title').innerText;
            const activeTable = tables.find(t => t.name.includes(titleText));
            if (activeTable) renderOrderItems(activeTable);
        }
        showToast('Hoàn tất', `Đã bưng <b>${itemName}</b> đến các bàn.`, 'success');
    } catch (e) {
        showToast('Lỗi', 'Không thể gom bưng món', 'danger');
    }
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

// Smart Batching (US-10) Buffer
const batchingTimers = {};

function pushReadyNotifBatch(ban) {
    const batch = batchingTimers[ban];
    if (!batch || batch.items.length === 0) return;
    
    const items = batch.items;
    delete batchingTimers[ban];
    
    const emptyState = notifList.querySelector('.empty-state');
    if (emptyState) emptyState.style.display = 'none';

    const table = tables.find(t => t.name === ban);
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const totalItems = items.reduce((sum, i) => sum + i.soluong, 0);
    const itemsHtml = items.map(i => `<p style="margin:0 0 4px 0;"><i class="ph-bold ph-cooking-pot"></i> <b>${escHtml(i.tenmon)}</b> × ${i.soluong}</p>`).join('');
    
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `
        <div class="notif-header"><span class="notif-table">Bếp Gọi: ${escHtml(ban)}</span><span class="notif-time">${time}</span></div>
        <div class="notif-desc">
            ${itemsHtml}
        </div>
        ${table ? `<button class="btn-serve" onclick="openTableDrawer('${table.id}')"><i class="ph-bold ph-eye"></i> Mở xem ${escHtml(ban)}</button>` : ''}
    `;
    notifList.prepend(card);
    notifCount++; notifCountBadge.innerText = notifCount;

    showToast('KDS Alert', `${escHtml(ban)}: <b>${totalItems} món</b> đã sẵn sàng. Mời bưng món!`, 'success');
    if (typeof playTing === 'function') playTing();
}

function handleItemReadyEvent({ ban, tenmon, soluong }) {
    // US-11: Lọc bỏ qua thông báo nếu bàn thuộc khu vực khác
    const table = tables.find(t => t.name === ban);
    if (table && currentZone !== 'all' && table.zone !== currentZone) {
        return; // Bỏ qua, không đưa vào danh sách gộp hay kêu chuông
    }

    if (!batchingTimers[ban]) {
        batchingTimers[ban] = {
            items: [],
            timerId: setTimeout(() => pushReadyNotifBatch(ban), 10000)
        };
    }
    batchingTimers[ban].items.push({ tenmon, soluong: Number(soluong) || 1 });
}

if (typeof subscribeChannel === 'function') {
    subscribeChannel('kds:tickets', msg => {
        if (msg.event === 'ITEM_READY') handleItemReadyEvent(msg.payload || {});
    });
}

// Khởi chạy
loadTables();
