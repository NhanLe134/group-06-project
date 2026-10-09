-- =====================================================================================
-- SUPABASE POSTGRESQL SCHEMA CƠ BẢN CHO DỰ ÁN SMART RESTAURANT
-- Copy toàn bộ nội dung này dán vào mục "SQL Editor" trên Supabase và bấm "Run"
-- =====================================================================================

-- 1. BẢNG USERS (Tài khoản & Phân quyền RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'WAITER', 'KITCHEN', 'CASHIER')),
    pin_code VARCHAR(10), -- VD: '1234' dùng để Manager duyệt Hủy món
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG MENU_ITEMS (Thực đơn - Món ăn thành phẩm bán cho khách)
-- Chứa: Lẩu Thái Tomyum, Bò Lúc Lắc, ...
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price INT NOT NULL, -- Giá bán
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG INVENTORY (Kho nguyên liệu thô)
-- Chứa: Thịt bò Kobe (Kg), Tôm sú (Kg), Rượu Vang (Chai)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_name VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- Kg, Gram, Lít, Chai
    system_stock DECIMAL(10, 2) DEFAULT 0, -- Tồn lý thuyết hệ thống tự tính
    actual_stock DECIMAL(10, 2), -- Tồn thực tế Quản lý đếm cuối ngày
    last_reconciled_at TIMESTAMP WITH TIME ZONE
);

-- 4. BẢNG RECIPES (Định lượng món ăn / Bill of Materials)
-- Bảng trung gian kết nối Món Ăn và Nguyên Liệu.
-- VD: Để nấu 1 "Lẩu Thái" (menu_item_id) cần 0.5 Kg "Tôm Sú" (inventory_id)
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10, 2) NOT NULL, -- Số lượng nguyên liệu cần dùng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG TABLE_SESSIONS (Phiên ăn tại bàn)
CREATE TABLE table_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(20) NOT NULL, -- VD: 'Bàn 01'
    status VARCHAR(20) DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'cleaning')),
    pax INT DEFAULT 0, -- Số lượng khách
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 6. BẢNG ORDERS (Đơn hàng của mỗi phiên bàn)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE,
    total_amount INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BẢNG ORDER_ITEMS (Chi tiết từng món trong Đơn)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready', 'served', 'void')),
    special_instructions TEXT, -- Ghi chú: "Không hành, ít cay"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BẢNG VOID_REFUND_LOGS (Nhật ký Hủy món)
CREATE TABLE void_refund_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id),
    manager_id UUID REFERENCES users(id), -- Người duyệt (Manager)
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BẢNG VOICE_TRANSCRIPTS (Nhật ký hội thoại AI - NFR-RO-02)
CREATE TABLE voice_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL, -- "Cho chị 1 lẩu thái không cay"
    ai_intent JSONB, -- Kết quả AI bóc tách (Structured Command)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
