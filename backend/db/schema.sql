-- =====================================================================
-- Schema gốc của database Supabase (ADR-ARCH-003) — script tạo bảng của nhóm.
-- Dùng để dựng lại database trống (local Docker hoặc project Supabase mới).
-- Thay đổi sau thời điểm này ghi thành file riêng trong db/migrations/ và chạy theo thứ tự số.
-- Mô tả từng cột: frontend/fe_ofc/dtb.md. Ánh xạ với ERD thiết kế: vault/06-Engineering/data-model.md Mục 5.
-- =====================================================================

-- Kích hoạt extension để sử dụng kiểu dữ liệu UUID (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng NguoiDung (Tài khoản & Phân quyền)
CREATE TABLE NguoiDung (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    HoTen VARCHAR NOT NULL,
    VaiTro VARCHAR NOT NULL, -- QUAN_LY, PHUC_VU, BEP, THU_NGAN
    MaPin VARCHAR,
    NgayTao TIMESTAMP DEFAULT NOW()
);

-- 2. Bảng ThucDon (Thực đơn - Món ăn thành phẩm)
CREATE TABLE ThucDon (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    TenMon VARCHAR NOT NULL,
    PhanLoai VARCHAR NOT NULL,
    GiaBan INT NOT NULL,
    TrangThaiBan BOOLEAN DEFAULT TRUE,
    AnhMinhHoa TEXT
);

-- 3. Bảng TonKho (Kho nguyên liệu thô)
CREATE TABLE TonKho (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    TenNguyenLieu VARCHAR NOT NULL,
    DonViTinh VARCHAR NOT NULL,
    TonHeThong DECIMAL DEFAULT 0,
    TonThucTe DECIMAL
);

-- 4. Bảng CongThuc (Định lượng / Công thức nấu)
CREATE TABLE CongThuc (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ThucDon_Id UUID REFERENCES ThucDon(Id) ON DELETE CASCADE,
    TonKho_Id UUID REFERENCES TonKho(Id) ON DELETE CASCADE,
    DinhLuong DECIMAL NOT NULL
);

-- 5. Bảng PhienBan (Phiên ăn tại bàn)
CREATE TABLE PhienBan (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    TenBan VARCHAR NOT NULL,
    TrangThai VARCHAR DEFAULT 'trong', -- trong, dang_phuc_vu, dang_don_dep
    SoKhach INT DEFAULT 0,
    GioBatDau TIMESTAMP,
    GioKetThuc TIMESTAMP
);

-- 6. Bảng HoaDon (Hóa đơn tổng)
CREATE TABLE HoaDon (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    PhienBan_Id UUID REFERENCES PhienBan(Id) ON DELETE CASCADE,
    TongTien INT DEFAULT 0,
    TrangThai VARCHAR DEFAULT 'ban_nhap' -- ban_nhap, da_chot, da_thanh_toan, da_huy
);

-- 7. Bảng ChiTietMon (Chi tiết từng món - Kết nối KDS)
CREATE TABLE ChiTietMon (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    HoaDon_Id UUID REFERENCES HoaDon(Id) ON DELETE CASCADE,
    ThucDon_Id UUID REFERENCES ThucDon(Id),
    SoLuong INT DEFAULT 1,
    TrangThai VARCHAR DEFAULT 'cho_nau', -- cho_nau, dang_nau, da_xong, da_phuc_vu, da_huy
    GhiChu TEXT
);

-- 8. Bảng LogHuyMon (Nhật ký Hủy món - Chống gian lận)
CREATE TABLE LogHuyMon (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ChiTietMon_Id UUID REFERENCES ChiTietMon(Id) ON DELETE CASCADE,
    NguoiDuyet_Id UUID REFERENCES NguoiDung(Id),
    LyDoHuy TEXT NOT NULL
);

-- 9. Bảng LogGiongNoi (Nhật ký Hội thoại AI Voice)
CREATE TABLE LogGiongNoi (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    PhienBan_Id UUID REFERENCES PhienBan(Id) ON DELETE CASCADE,
    VanBanGoc TEXT NOT NULL,
    YdinhAI JSONB
);
