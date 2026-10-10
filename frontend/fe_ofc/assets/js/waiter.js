let tables = [];

async function loadTables() {
    if (tables.length === 0) {
        const grid = document.getElementById('table-grid');
        if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 64px 24px; text-align: center;"><h3 style="margin:0; font-size: 16px; color: #1E293B; font-weight: 800;">Đang lấy dữ liệu<span class="animated-dots"></span></h3><p style="margin: 8px 0 0 0; font-size: 13px; color: #64748B;">Vui lòng chờ trong giây lát.</p><style>.animated-dots::after { content: ""; animation: ellipsis 1.5s infinite; } @keyframes ellipsis { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } 100% { content: ""; } }</style></div>';
    }
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/tables`);
        if (!res.ok) throw new Error('Lỗi tải sơ đồ bàn');
        tables = await res.json();
        renderTables();

        // Sync URL with Drawer on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const tableIdParam = urlParams.get('table');
        if (tableIdParam && !document.getElementById('table-drawer').classList.contains('active')) {
            openTableDrawer(tableIdParam, true);
        }
        
        updateConnectionStatus(true);
    } catch (err) {
        console.error(err);
        const grid = document.getElementById('table-grid');
        if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 64px 24px; text-align: center;"><i class="ph-duotone ph-warning-circle" style="font-size: 48px; color: #E11D48; margin-bottom: 16px;"></i><h3 style="margin:0; font-size: 18px; color: #1E293B; font-weight: 800;">Không thể tải Sơ đồ bàn</h3><p style="margin: 8px 0 0 0; font-size: 14px; color: #64748B;">Máy chủ không phản hồi. Vui lòng kiểm tra lại mạng hoặc báo lại quản lý.</p></div>';
        showToast('Lỗi kết nối', 'Không thể tải Sơ đồ bàn từ Server', 'danger');
        updateConnectionStatus(false);
    }
}

// Logic điều khiển UI Trạng thái kết nối
function updateConnectionStatus(isOk) {
    const connStatus = document.getElementById('conn-status');
    
    if (!connStatus) return;
    
    const dot = connStatus.querySelector('.dot');
    const text = connStatus.querySelector('.text');
    
    if (!navigator.onLine || !isOk) {
        connStatus.style.color = 'var(--color-danger)';
        dot.style.background = 'var(--color-danger)';
        text.textContent = 'Mất kết nối';
    } else {
        connStatus.style.color = 'var(--color-success)';
        dot.style.background = 'var(--color-success)';
        text.textContent = 'Realtime - Đã đồng bộ';
    }
}

window.addEventListener('online', () => {
    updateConnectionStatus(true);
    // Tự động tải lại khi có mạng
    if (tables.length > 0) {
        const grid = document.getElementById('table-grid');
        if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 64px 24px; text-align: center;"><h3 style="margin:0; font-size: 16px; color: #1E293B; font-weight: 800;">Đang đồng bộ lại<span class="animated-dots"></span></h3><p style="margin: 8px 0 0 0; font-size: 13px; color: #64748B;">Đang tải lại dữ liệu mới nhất.</p><style>.animated-dots::after { content: ""; animation: ellipsis 1.5s infinite; } @keyframes ellipsis { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } 100% { content: ""; } }</style></div>';
    }
    loadTables();
});
window.addEventListener('offline', () => updateConnectionStatus(false));

const tableGrid = document.getElementById('table-grid');
const voidModal = document.getElementById('void-modal');
const voidQtyInput = document.getElementById('void-qty-input');
const voidError = document.getElementById('void-error');

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
        const alertBadge = hasReadyItem ? `<div class="action-required-badge"><i class="ph-bold ph-bell-ringing"></i> CẦN LÊN MÓN</div>` : '';

        let progressHtml = '';
        let tableStatusText = '';
        let badgeClass = 'badge-danger';
        
        if (t.status === 'occupied') {
            const totalItems = t.items.length;
            const servedItems = t.items.filter(i => i.status === 'served').length;
            const progressPercent = totalItems === 0 ? 0 : (servedItems / totalItems) * 100;
            
            if (totalItems === 0) {
                tableStatusText = 'Đang chọn món';
                badgeClass = 'badge-danger';
            } else if (hasReadyItem) {
                tableStatusText = 'Cần lên món';
                badgeClass = 'badge-danger';
            } else if (servedItems === totalItems) {
                tableStatusText = 'Đã đủ món';
                badgeClass = 'badge-success';
            } else {
                tableStatusText = 'Bếp đang làm';
                badgeClass = 'badge-warning';
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
            badgeClass = 'badge-warning';
        } else {
            tableStatusText = 'Trống';
            badgeClass = 'badge-success';
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
                <span class="badge ${badgeClass}">${tableStatusText}</span>
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
function openTableDrawer(tableIdOrName, skipPushState = false) {
    // Có thể truyền UUID hoặc truyền Tên bàn (ví dụ "Bàn 06")
    const table = tables.find(t => t.id === tableIdOrName || t.name === tableIdOrName);
    if (!table) return;

    drawerTitle.innerHTML = `${table.name} <span style="font-size: 12px; color: #64748b; font-weight: 500;">(${table.id})</span>`;
    
    // Header Status Badge
    if (table.status === 'occupied') {
        drawerBadge.className = 'badge badge-danger';
        drawerBadge.innerText = 'Đang dùng bữa';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-users"></i> ${table.capacity} Khách • Đã ngồi ${table.time}`;
    } else if (table.status === 'cleaning') {
        drawerBadge.className = 'badge badge-warning';
        drawerBadge.innerText = 'Cần dọn';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-clock"></i> Khách vừa thanh toán rời đi`;
    } else {
        drawerBadge.className = 'badge badge-success';
        drawerBadge.innerText = 'Trống';
        drawerSubtitle.innerHTML = `<i class="ph-bold ph-users"></i> ${table.capacity} Khách`;
    }

    // Body content
    if (table.status === 'empty') {
        drawerEmptyState.style.display = 'block';
        drawerOrderSection.style.display = 'none';
        drawerFooter.innerHTML = `<button class="btn-primary" style="width: 100%;" onclick="window.location.href='customer.html?table=${encodeURIComponent(table.name)}&role=waiter'"><i class="ph-bold ph-plus-circle"></i> Mở App Gọi Món</button>`;
    } else if (table.status === 'cleaning') {
        drawerEmptyState.style.display = 'none';
        drawerOrderSection.style.display = 'none';
        drawerFooter.innerHTML = `<button class="btn-primary" style="width: 100%;" onclick="markTableClean('${table.id}')"><i class="ph-bold ph-check-circle"></i> Xác nhận Đã dọn xong</button>`;
    } else {
        drawerEmptyState.style.display = 'none';
        drawerOrderSection.style.display = 'block';
        renderOrderItems(table);
        drawerFooter.innerHTML = `<button class="btn-primary" style="width: 100%;" onclick="window.location.href='customer.html?table=${encodeURIComponent(table.name)}&role=waiter'"><i class="ph-bold ph-plus-circle"></i> Gọi thêm món</button>`;
    }

    drawerOverlay.classList.add('active');
    tableDrawer.classList.add('active');

    if (!skipPushState) {
        window.history.pushState({table: table.id}, '', `?table=${table.id}`);
    }
}

function closeTableDrawer() {
    drawerOverlay.classList.remove('active');
    tableDrawer.classList.remove('active');
    window.history.pushState({}, '', window.location.pathname);
}

document.getElementById('btn-close-drawer').addEventListener('click', closeTableDrawer);
drawerOverlay.addEventListener('click', closeTableDrawer);

// Handle browser Back/Forward buttons for URL syncing
window.addEventListener('popstate', (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableIdParam = urlParams.get('table');
    if (tableIdParam) {
        openTableDrawer(tableIdParam, true);
    } else {
        drawerOverlay.classList.remove('active');
        tableDrawer.classList.remove('active');
    }
});

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
            actionBtn = `<button class="btn-serve-item" title="Xác nhận" onclick="event.stopPropagation(); markItemServed('${table.id}', '${item.id}')">Phục vụ</button>`;
        }
        
        let cancelBtn = '';
        if (item.status === 'pending' || item.status === 'cooking' || item.status === 'ready') {
            if (item.status === 'cooking' && item.qty <= 1) {
                cancelBtn = `<button class="btn-void-item" title="Không thể hủy món đang nấu có số lượng 1" disabled style="opacity: 0.3; cursor: not-allowed;"><i class="ph-bold ph-trash"></i></button>`;
            } else {
                cancelBtn = `<button class="btn-void-item" title="Điều chỉnh/Hủy món" onclick="event.stopPropagation(); requestVoid('${table.id}', '${item.id}', '${item.name}', '${item.status}', ${item.qty})"><i class="ph-bold ph-trash"></i></button>`;
            }
        } else {
            cancelBtn = `<div style="width: 36px"></div>`; 
        }

        let rowStyle = item.status === 'served' ? 'opacity: 0.5; filter: grayscale(1);' : '';
        let statusColor = '#64748B'; // Default
        if (item.status === 'pending') statusColor = 'var(--color-warning)';
        if (item.status === 'cooking') statusColor = 'var(--color-primary)';
        if (item.status === 'ready') statusColor = 'var(--color-danger)';
        
        let statusWeight = item.status === 'served' ? '500' : '800';

        row.innerHTML = `
            <div class="item-info" style="${rowStyle}">
                <span class="item-name">${item.name} <span style="color: var(--color-primary); font-weight: 800;">x${item.qty}</span></span>
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
    // Optimistic Update
    const table = tables.find(t => t.id === tableId);
    if (table) {
        const item = table.items.find(i => i.id === itemId);
        if (item) item.status = 'served';
        if (document.getElementById('table-drawer').classList.contains('active')) {
            renderOrderItems(table);
        }
        renderTables();
    }

    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/items/${itemId}/serve`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Lỗi cập nhật');
        
        loadTables().then(() => {
            if (document.getElementById('table-drawer').classList.contains('active')) {
                const freshTable = tables.find(t => t.id === tableId);
                if (freshTable) renderOrderItems(freshTable);
            }
        });
    } catch (e) {
        showToast('Lỗi', 'Không thể xác nhận phục vụ', 'danger');
        loadTables().then(() => {
            if (document.getElementById('table-drawer').classList.contains('active')) {
                const freshTable = tables.find(t => t.id === tableId);
                if (freshTable) renderOrderItems(freshTable);
            }
        });
    }
}

// 4. NGHIỆP VỤ: HOÀN TẤT DỌN BÀN
window.markTableClean = async function(tableId) {
    try {
        // Đóng Drawer và hiện Toast ngay lập tức cho mượt (Optimistic UI)
        closeTableDrawer();
        
        // Gọi API chuẩn từ Backend (orders.py) thay vì patch riêng của waiter
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/tables/${tableId}/cleaned`, { method: 'POST' });
        if (!res.ok) throw new Error('Lỗi cập nhật');
        
        showToast('Đã dọn dẹp', `Bàn đã sẵn sàng đón khách mới.`, 'success');
        
        // Tải lại sơ đồ bàn để cập nhật giao diện thành Trống (màu Xanh)
        await loadTables();
    } catch (e) {
        showToast('Lỗi', 'Không thể cập nhật dọn bàn. Hãy thử lại!', 'danger');
        // Nếu lỗi, mở lại hoặc load lại để đồng bộ
        await loadTables();
    }
}

// 5. ĐIỀU CHỈNH SỐ LƯỢNG & HỦY MÓN
window.requestVoid = function(tableId, itemId, itemName, itemStatus, itemQty) {
    if (itemStatus === 'served') {
        showToast('Lỗi', 'Không thể sửa món đã phục vụ', 'danger');
        return;
    }
    
    const modalDesc = document.getElementById('void-modal-desc');
    if(modalDesc) {
        modalDesc.innerHTML = `<span style="color: var(--color-text-main); font-size: 18px; font-weight: 800;">${itemName}</span><br>Đang có <b>${itemQty}</b> phần`;
    }
    
    voidQtyInput.value = itemQty; window.currentMaxVoidQty = itemQty;
    voidError.style.display = 'none';
    
    currentActionCb = async (qtyToKeep) => {
        const qty = qtyToKeep !== undefined ? qtyToKeep : parseInt(voidQtyInput.value, 10);
        if (isNaN(qty) || qty < 0 || qty > itemQty) {
            voidError.innerHTML = `<i class="ph-fill ph-warning-circle"></i> Số lượng không hợp lệ (0 đến ${itemQty})!`;
            voidError.style.display = 'block';
            return;
        }
        
        // Đóng modal ngay lập tức cho mượt
        voidModal.style.display = 'none';

        // Optimistic UI Update: Cập nhật dữ liệu tạm & render lại ngay lập tức
        const table = tables.find(t => t.id === tableId);
        if (table) {
            if (qty === 0) {
                table.items = table.items.filter(i => i.id !== itemId);
            } else {
                const item = table.items.find(i => i.id === itemId);
                if (item) item.qty = qty;
            }
            if (document.getElementById('table-drawer').classList.contains('active')) {
                renderOrderItems(table);
            }
            renderTables();
        }
        
        try {
            const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/waiter/items/${itemId}/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: "", new_quantity: qty })
            });
            if (!res.ok) {
                throw new Error('Không thể cập nhật món');
            }
            
            showToast('Thành công', qty === 0 ? 'Đã hủy món.' : `Đã điều chỉnh thành ${qty} phần.`, 'success');
            
            // Đồng bộ lại ngầm từ Server
            loadTables().then(() => {
                if (document.getElementById('table-drawer').classList.contains('active')) {
                    const freshTable = tables.find(t => t.id === tableId);
                    if (freshTable) renderOrderItems(freshTable);
                }
            });
        } catch (e) {
            showToast('Lỗi', e.message, 'danger');
            // Rollback UI nếu lỗi
            loadTables().then(() => {
                if (document.getElementById('table-drawer').classList.contains('active')) {
                    const freshTable = tables.find(t => t.id === tableId);
                    if (freshTable) renderOrderItems(freshTable);
                }
            });
        }
    };
    
    voidModal.style.display = 'flex';
};

document.getElementById('btn-cancel-void').addEventListener('click', () => { voidModal.style.display = 'none'; });
document.getElementById('btn-full-void').addEventListener('click', () => {
    if (currentActionCb) currentActionCb(0);
});
document.getElementById('btn-confirm-void').addEventListener('click', () => {
    if (voidQtyInput.value !== "") { 
        if (currentActionCb) currentActionCb();
    } else { voidError.style.display = 'block'; }
});
voidQtyInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-confirm-void').click();
});

document.getElementById('btn-void-minus').addEventListener('click', () => {
    let current = parseInt(voidQtyInput.value, 10);
    if (!isNaN(current) && current > 0) {
        voidQtyInput.value = current - 1;
    }
});

document.getElementById('btn-void-plus').addEventListener('click', () => {
    let current = parseInt(voidQtyInput.value, 10);
    if (!isNaN(current) && current < window.currentMaxVoidQty) {
        voidQtyInput.value = current + 1;
    }
});

// ==========================================
// TRÌNH GIẢ LẬP LUỒNG (SIMULATOR ACTIONS)
// ==========================================

const notifList = document.getElementById('notif-list');
const notifCountBadge = document.getElementById('notif-count');
let notifCount = 0;

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
                const groupKey = i.name + '_' + (t.zone || 'unknown');
                if (!grouped[groupKey]) grouped[groupKey] = { isDrink: i.isDrink, itemName: i.name, items: [] };
                grouped[groupKey].items.push({ tableId: t.id, tableName: t.name, item: i });
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

    // 3. Render nhóm 1: Gợi ý Gom đơn (Gom >= 2) - Dạng thanh trượt ngang
    let batchedHtml = '';
    let hasBatched = false;
    Object.keys(grouped).forEach(groupKey => {
        const group = grouped[groupKey];
        const itemName = group.itemName;
        const list = group.items;
        if (list.length > 1) {
            hasBatched = true;
            let qtyByTable = {};
            list.forEach(entry => {
                let shortTable = entry.tableName.replace('Bàn ', 'B.'); // Rút gọn chữ Bàn thành B. cho gọn
                qtyByTable[shortTable] = (qtyByTable[shortTable] || 0) + (entry.item.qty || 1);
            });
            let tablesText = Object.entries(qtyByTable).map(([tbl, q]) => `${tbl} (${q})`).join(', ');
            let totalQty = list.reduce((sum, entry) => sum + (entry.item.qty || 1), 0);
            
            batchedHtml += `
            <div style="flex: 0 0 auto; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 12px; padding: 12px; min-width: 150px; max-width: 180px; display: flex; flex-direction: column; gap: 8px;">
                <span style="color: #B45309; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px;"><i class="ph-fill ph-stack"></i> GOM MÓN</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--color-text-main); line-height: 1.2;">${totalQty}x ${itemName}</span>
                <span style="font-size: 11px; color: #64748B; line-height: 1.3;"><i class="ph-bold ph-map-pin"></i> ${tablesText}</span>
                <button style="width: 100%; margin-top: auto; padding: 8px 12px; font-size: 13px; border-radius: 8px; background: #FF5A36; color: #fff; border: none; font-weight: 700; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#E04826'" onmouseout="this.style.background='#FF5A36'" onclick="event.stopPropagation(); serveBatch('${itemName}')">Lấy xong (${totalQty})</button>
            </div>
            `;
            // KHÔNG xóa khỏi grouped để nó vẫn hiện trong danh sách Từng bàn ở dưới
        }
    });

    if (hasBatched) {
        html += `
        <div style="margin-bottom: 20px;">
            <h4 style="font-size: 12px; font-weight: 800; color: #64748B; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;"><i class="ph-bold ph-lightning"></i> Tiện đường (Gom món)</h4>
            <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; padding-top: 4px;">
                ${batchedHtml}
            </div>
        </div>
        `;
    }

    // 4. Render nhóm 2: Timeline Mới nhất (Bao gồm Phục vụ lẻ + Dọn dẹp)
    let allTimeline = [];

    // Gộp các món lẻ theo Bàn VÀ theo loại (Nước riêng, Đồ ăn riêng)
    let singlesByTableAndType = {};
    Object.keys(grouped).forEach(groupKey => {
        const group = grouped[groupKey];
        const itemName = group.itemName;
        group.items.forEach(entry => {
            const key = entry.tableId + (group.isDrink ? '_drink' : '_food');
            if (!singlesByTableAndType[key]) {
                singlesByTableAndType[key] = { 
                    tableId: entry.tableId, 
                    tableName: entry.tableName, 
                    isDrink: group.isDrink, 
                    items: [] 
                };
            }
            singlesByTableAndType[key].items.push({ itemName: itemName, item: entry.item });
        });
    });

    Object.values(singlesByTableAndType).forEach(tableData => {
        allTimeline.push({ type: 'serve', tableData: tableData });
    });

    cleaningTasks.forEach(t => {
        allTimeline.push({ type: 'clean', data: t });
    });

    if (allTimeline.length > 0) {
        html += `<h4 style="font-size: 12px; font-weight: 800; color: #64748B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;"><i class="ph-bold ph-clock-counter-clockwise"></i> Thông báo mới nhất</h4>`;
        
        allTimeline.reverse().forEach(task => {
            if (task.type === 'serve') {
                const tableData = task.tableData;
                const isDrink = tableData.isDrink;
                
                let icon = isDrink ? '<i class="ph-bold ph-bottle"></i> CẦN LẤY NƯỚC' : '<i class="ph-bold ph-cooking-pot"></i> CẦN BƯNG MÓN';
                let titleColor = isDrink ? '#0284C7' : 'var(--color-success)';
                let bgColor = isDrink ? '#F0F9FF' : '#ffffff';
                let borderColor = isDrink ? '#38BDF8' : 'var(--color-success)';
                
                let qtyByItem = {};
                tableData.items.forEach(i => {
                    qtyByItem[i.itemName] = (qtyByItem[i.itemName] || 0) + (i.item.qty || 1);
                });
                
                let itemsHtml = Object.entries(qtyByItem).map(([name, qty]) => {
                    return `<p style="margin:0 0 4px 0; font-size: 13px; font-weight: 600; color: var(--color-text-main);">${qty}x ${name}</p>`;
                }).join('');
                
                let itemIdsArrayStr = '[' + tableData.items.map(i => `'${i.item.id}'`).join(', ') + ']';
                let serveAction = `event.stopPropagation(); ${itemIdsArrayStr}.forEach(id => markItemServed('${tableData.tableId}', id))`;
                
                html += `
                <div class="notif-card" style="margin-bottom: 8px; background: ${bgColor}; border-color: #E2E8F0; border-left-color: ${borderColor};">
                    <div class="notif-header" style="margin-bottom: 8px;">
                        <span class="notif-table" style="color: ${titleColor}; display: flex; align-items: center; gap: 6px;">
                            ${icon}
                        </span>
                        <span class="notif-time">Vừa xong</span>
                    </div>
                    <div class="notif-desc" style="margin-bottom: 12px;">
                        ${itemsHtml}
                        <p style="margin:4px 0 0 0; font-size:13px; color: #64748B;"><i class="ph-bold ph-map-pin"></i> <span style="font-weight: 600; color: var(--color-text-main);">${tableData.tableName}</span></p>
                    </div>
                    <button style="width: 100%; padding: 8px 12px; font-size: 13px; border-radius: 8px; background: #FF5A36; color: #fff; border: none; font-weight: 700; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#E04826'" onmouseout="this.style.background='#FF5A36'" onclick="${serveAction}"><i class="ph-bold ph-check"></i> Đã hoàn tất</button>
                </div>
                `;
            } else if (task.type === 'clean') {
                const t = task.data;
                html += `
                <div class="notif-card" style="margin-bottom: 8px; background: #FEF2F2; border-color: #E2E8F0; border-left-color: var(--color-danger);">
                    <div class="notif-header" style="margin-bottom: 8px;">
                        <span class="notif-table" style="color: var(--color-danger); display: flex; align-items: center; gap: 6px;">
                            <i class="ph-bold ph-broom"></i> DỌN DẸP BÀN
                        </span>
                        <span class="notif-time">Vừa xong</span>
                    </div>
                    <div class="notif-desc" style="margin-bottom: 12px;">
                        <p style="margin:0; font-size: 13px; font-weight: 600; color: var(--color-text-main);">Khách đã thanh toán rời đi</p>
                        <p style="margin:4px 0 0 0; font-size:13px; color: #64748B;"><i class="ph-bold ph-map-pin"></i> <span style="font-weight: 600; color: var(--color-text-main);">${t.name}</span></p>
                    </div>
                    <button style="width: 100%; padding: 8px 12px; font-size: 13px; border-radius: 8px; background: #FF5A36; color: #fff; border: none; font-weight: 700; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#E04826'" onmouseout="this.style.background='#FF5A36'" onclick="markTableClean('${t.id}')"><i class="ph-bold ph-check"></i> Đã dọn xong</button>
                </div>
                `;
            }
        });
    }

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
    const itemsHtml = items.map(i => `<p style="margin:0 0 4px 0; font-size: 13px;"><i class="ph-bold ph-cooking-pot"></i> <b>${escHtml(i.tenmon)}</b> × ${i.soluong}</p>`).join('');
    
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `
        <div class="notif-header"><span class="notif-table">Bếp Gọi: ${escHtml(ban)}</span><span class="notif-time">${time}</span></div>
        <div class="notif-desc">
            ${itemsHtml}
        </div>
        ${table ? `<button style="width: 100%; margin-top: 8px; padding: 8px 12px; font-size: 13px; border-radius: 8px; background: #FF5A36; color: #fff; border: none; font-weight: 700; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#E04826'" onmouseout="this.style.background='#FF5A36'" onclick="openTableDrawer('${table.id}')"><i class="ph-bold ph-eye"></i> Mở xem ${escHtml(ban)}</button>` : ''}
    `;
    notifList.prepend(card);
    notifCount++; notifCountBadge.innerText = notifCount;
    if (typeof playTing === 'function') playTing();
}

function handleItemReadyEvent({ ban, tenmon, soluong }) {
    // US-11: Lọc bỏ qua thông báo nếu bàn thuộc khu vực khác
    const table = tables.find(t => t.name === ban);
    if (table && currentZone !== 'all' && table.zone !== currentZone) {
        return; // Bỏ qua, không đưa vào danh sách gộp hay kêu chuông
    }

    // Cập nhật UI ngay lập tức để hiển thị ở "Thông báo mới nhất"
    if (typeof loadTables === 'function') loadTables();

    if (!batchingTimers[ban]) {
        batchingTimers[ban] = {
            items: [],
            timerId: setTimeout(() => pushReadyNotifBatch(ban), 10000)
        };
    }
    batchingTimers[ban].items.push({ tenmon, soluong: Number(soluong) || 1 });
}

function handleTableCleaningEvent({ ban, ban_id }) {
    // Lọc theo khu vực
    const table = tables.find(t => t.id === ban_id || t.name === ban);
    if (table && currentZone !== 'all' && table.zone !== currentZone) {
        return; 
    }
    if (typeof playTing === 'function') playTing();
    loadTables(); // Reload lại bảng để cập nhật giao diện
}

if (typeof subscribeChannel === 'function') {
    subscribeChannel('kds:tickets', msg => {
        if (msg.event === 'ITEM_READY') handleItemReadyEvent(msg.payload || {});
        if (msg.event === 'TABLE_CLEANING') handleTableCleaningEvent(msg.payload || {});
    });
}

// Khởi chạy
loadTables();

// TÍNH NĂNG MỞ IFRAME KHÁCH HÀNG & MOBILE NAV
window.openCustomerIframe = function(tableName) {
    const iframe = document.getElementById('customer-iframe');
    const modal = document.getElementById('iframe-modal');
    if (iframe && modal) {
        iframe.src = '../customer/customer.html?table=' + encodeURIComponent(tableName);
        modal.style.display = 'flex';
    }
}
const btnCloseIframe = document.getElementById('btn-close-iframe');
if (btnCloseIframe) {
    btnCloseIframe.addEventListener('click', () => {
        document.getElementById('iframe-modal').style.display = 'none';
        document.getElementById('customer-iframe').src = '';
        loadTables();
    });
}
