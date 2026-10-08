-- ADR-N14: tái cấu trúc DB theo thiết kế của Nhàn
--   ban (master 6 bàn) → phieuban (1 lần gửi bếp = 1 phiếu) → chitietphieu (món trong phiếu)
--   hoadon chỉ sinh khi THANH TOÁN (tổng các phiếu chưa tính tiền)
-- LƯU Ý: xóa dữ liệu test cũ theo yêu cầu. Chạy trên Supabase bằng SQL Editor.

-- 1) Gỡ bảng cũ (theo thứ tự khóa ngoại; log* có FK CASCADE tới bảng cũ)
DROP TABLE IF EXISTS loghuymon CASCADE;
DROP TABLE IF EXISTS loggiongnoi CASCADE;
DROP TABLE IF EXISTS chitietmon CASCADE;
DROP TABLE IF EXISTS phienban CASCADE;
DROP TABLE IF EXISTS hoadon CASCADE;

-- 2) Sequence cho bảng mới (Supabase chưa có seq_ma_hoadon → tạo mới)
CREATE SEQUENCE IF NOT EXISTS seq_ma_ban;
CREATE SEQUENCE IF NOT EXISTS seq_ma_phieuban;
CREATE SEQUENCE IF NOT EXISTS seq_ma_chitietphieu;
CREATE SEQUENCE IF NOT EXISTS seq_ma_hoadon;

-- 3) MASTER: bàn vật lý (6 bàn, seed sẵn)
CREATE TABLE ban (
    ban_id    VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_danh_muc('BAN', 'seq_ma_ban'),
    tenban    VARCHAR NOT NULL,
    trangthai SMALLINT DEFAULT 1  -- 1 = sẵn sàng, 2 = đang phục vụ, 3 = chờ dọn
);
INSERT INTO ban (tenban, trangthai) VALUES
    ('Bàn 01', 1), ('Bàn 02', 1), ('Bàn 03', 1),
    ('Bàn 04', 1), ('Bàn 05', 1), ('Bàn 06', 1);

-- 3) Hóa đơn — sinh khi thanh toán
CREATE TABLE hoadon (
    hoadon_id           VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('HD', 'seq_ma_hoadon'),
    ban_id              VARCHAR(30) REFERENCES ban(ban_id),
    nhanvien_id         VARCHAR(30) REFERENCES nguoidung(id),
    so_phieuban         INT DEFAULT 0,
    tongtien            INT DEFAULT 0,
    trangthai           VARCHAR DEFAULT 'da_thanh_toan',
    thoigianthanhtoan   TIMESTAMP DEFAULT now()
);

-- 4) Phiếu bàn — 1 lần khách gửi bếp = 1 phiếu
CREATE TABLE phieuban (
    phieuban_id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('PB', 'seq_ma_phieuban'),
    ban_id      VARCHAR(30) REFERENCES ban(ban_id),
    giogoimon   TIMESTAMP NOT NULL DEFAULT now(),
    hoadon_id   VARCHAR(30) REFERENCES hoadon(hoadon_id)  -- NULL = khách đang dùng
);
CREATE INDEX idx_phieuban_ban_hoadon ON phieuban (ban_id, hoadon_id);

-- 5) Chi tiết phiếu — món trong phiếu (giờ gọi theo phieuban.giogoimon)
CREATE TABLE chitietphieu (
    chitietphieu_id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('CTP', 'seq_ma_chitietphieu'),
    phieuban_id     VARCHAR(30) NOT NULL REFERENCES phieuban(phieuban_id) ON DELETE CASCADE,
    mon_id          VARCHAR(30) REFERENCES thucdon(id),
    soluong         INT DEFAULT 1 CHECK (soluong >= 0),
    trangthai       VARCHAR DEFAULT 'cho_nau',  -- cho_nau | dang_nau | da_xong | da_phuc_vu | da_huy
    ghichu          TEXT
);
CREATE INDEX idx_chitietphieu_trangthai ON chitietphieu (trangthai);
