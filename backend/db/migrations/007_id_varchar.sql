-- Migration 007 — 2026-10-07 — Khóa chính dạng mã đọc được thay cho UUID (ADR-ARCH-004)
-- Quy tắc (Dev duyệt — AI Usage Log A-67/A-68):
--   Danh mục  : TIỀN TỐ + số 3 chữ số        NV001 · MON001 · NL001 · CT001
--   Giao dịch : TIỀN TỐ-YYYYMMDD-số 4 chữ số  PB · HD · CTM · HM · GN · PKK · CTKK
--   Ngày = ngày tạo theo giờ Việt Nam; số thứ tự chạy liên tục (không reset theo ngày);
--   hết chữ số thì số tự dài ra (không cắt). Database tự sinh mã qua sequence → không trùng.
-- Cách làm: sao lưu tạm dữ liệu kèm mã mới → xóa 11 bảng → tạo lại (id đứng đầu, giữ nguyên
-- thứ tự cột, ràng buộc, chỉ mục, RLS) → chép dữ liệu về, khóa ngoại được đổi theo mã mới.
-- Chạy 1 lần duy nhất (scripts/migrate.py ghi vào schema_migrations), trọn trong 1 transaction.

-- ---------- 1. Hàm sinh mã + sequence ----------
CREATE OR REPLACE FUNCTION sinh_ma_danh_muc(tien_to TEXT, ten_seq TEXT) RETURNS VARCHAR
LANGUAGE sql VOLATILE AS $$
    SELECT tien_to || lpad(n, greatest(3, length(n)), '0')
    FROM (SELECT nextval(ten_seq)::text AS n) s
$$;

CREATE OR REPLACE FUNCTION sinh_ma_giao_dich(tien_to TEXT, ten_seq TEXT) RETURNS VARCHAR
LANGUAGE sql VOLATILE AS $$
    SELECT tien_to || '-' || to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD') || '-'
           || lpad(n, greatest(4, length(n)), '0')
    FROM (SELECT nextval(ten_seq)::text AS n) s
$$;

CREATE SEQUENCE seq_ma_nguoidung;
CREATE SEQUENCE seq_ma_thucdon;
CREATE SEQUENCE seq_ma_tonkho;
CREATE SEQUENCE seq_ma_congthuc;
CREATE SEQUENCE seq_ma_phienban;
CREATE SEQUENCE seq_ma_hoadon;
CREATE SEQUENCE seq_ma_chitietmon;
CREATE SEQUENCE seq_ma_loghuymon;
CREATE SEQUENCE seq_ma_loggiongnoi;
CREATE SEQUENCE seq_ma_phieukiemke;
CREATE SEQUENCE seq_ma_chitietkiemke;

-- ---------- 2. Sao lưu tạm dữ liệu + cấp mã mới (theo thứ tự dễ đọc) ----------
CREATE TEMP TABLE bk_nguoidung ON COMMIT DROP AS
    SELECT *, sinh_ma_danh_muc('NV', 'seq_ma_nguoidung') AS ma FROM nguoidung ORDER BY ngaytao NULLS LAST, hoten;
CREATE TEMP TABLE bk_thucdon ON COMMIT DROP AS
    SELECT *, sinh_ma_danh_muc('MON', 'seq_ma_thucdon') AS ma FROM thucdon ORDER BY phanloai, tenmon;
CREATE TEMP TABLE bk_tonkho ON COMMIT DROP AS
    SELECT *, sinh_ma_danh_muc('NL', 'seq_ma_tonkho') AS ma FROM tonkho ORDER BY tennguyenlieu;
CREATE TEMP TABLE bk_congthuc ON COMMIT DROP AS
    SELECT *, sinh_ma_danh_muc('CT', 'seq_ma_congthuc') AS ma FROM congthuc ORDER BY id;
CREATE TEMP TABLE bk_phienban ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('PB', 'seq_ma_phienban') AS ma FROM phienban ORDER BY giobatdau NULLS LAST, tenban;
CREATE TEMP TABLE bk_hoadon ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('HD', 'seq_ma_hoadon') AS ma FROM hoadon ORDER BY thoigian NULLS LAST, id;
CREATE TEMP TABLE bk_chitietmon ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('CTM', 'seq_ma_chitietmon') AS ma FROM chitietmon ORDER BY giogoimon, id;
CREATE TEMP TABLE bk_loghuymon ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('HM', 'seq_ma_loghuymon') AS ma FROM loghuymon ORDER BY id;
CREATE TEMP TABLE bk_loggiongnoi ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('GN', 'seq_ma_loggiongnoi') AS ma FROM loggiongnoi ORDER BY id;
CREATE TEMP TABLE bk_phieukiemke ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('PKK', 'seq_ma_phieukiemke') AS ma FROM phieukiemke ORDER BY giotao;
CREATE TEMP TABLE bk_chitietkiemke ON COMMIT DROP AS
    SELECT *, sinh_ma_giao_dich('CTKK', 'seq_ma_chitietkiemke') AS ma FROM chitietkiemke ORDER BY id;

-- ---------- 3. Xóa bảng cũ (con trước, cha sau) ----------
DROP TABLE chitietkiemke, phieukiemke, loggiongnoi, loghuymon, chitietmon, hoadon, phienban,
           congthuc, tonkho, thucdon, nguoidung;

-- ---------- 4. Tạo lại 11 bảng — id VARCHAR tự sinh mã ----------
CREATE TABLE nguoidung (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_danh_muc('NV', 'seq_ma_nguoidung'),
    hoten VARCHAR NOT NULL,
    vaitro VARCHAR NOT NULL, -- QUAN_LY, PHUC_VU, BEP, THU_NGAN
    mapin VARCHAR,
    ngaytao TIMESTAMP DEFAULT now()
);

CREATE TABLE thucdon (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_danh_muc('MON', 'seq_ma_thucdon'),
    tenmon VARCHAR NOT NULL,
    phanloai VARCHAR NOT NULL,
    giaban INTEGER NOT NULL,
    trangthaiban BOOLEAN DEFAULT true,
    anhminhhoa TEXT,
    soluongton INTEGER CONSTRAINT thucdon_soluongton_khong_am CHECK (soluongton >= 0)
);

CREATE TABLE tonkho (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_danh_muc('NL', 'seq_ma_tonkho'),
    tennguyenlieu VARCHAR NOT NULL,
    donvitinh VARCHAR NOT NULL,
    tonhethong NUMERIC DEFAULT 0,
    tonthucte NUMERIC
);

CREATE TABLE congthuc (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_danh_muc('CT', 'seq_ma_congthuc'),
    thucdon_id VARCHAR(30) CONSTRAINT congthuc_thucdon_id_fkey REFERENCES thucdon(id) ON DELETE CASCADE,
    tonkho_id VARCHAR(30) CONSTRAINT congthuc_tonkho_id_fkey REFERENCES tonkho(id) ON DELETE CASCADE,
    dinhluong NUMERIC NOT NULL
);

CREATE TABLE phienban (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('PB', 'seq_ma_phienban'),
    tenban VARCHAR NOT NULL,
    trangthai VARCHAR DEFAULT 'trong', -- trong, dang_phuc_vu, dang_don_dep
    giobatdau TIMESTAMP,
    gioketthuc TIMESTAMP
);

CREATE TABLE hoadon (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('HD', 'seq_ma_hoadon'),
    phienban_id VARCHAR(30) CONSTRAINT hoadon_phienban_id_fkey REFERENCES phienban(id) ON DELETE CASCADE,
    tongtien INTEGER DEFAULT 0,
    trangthai VARCHAR DEFAULT 'ban_nhap', -- ban_nhap, da_chot, da_thanh_toan, da_huy
    thoigian TIMESTAMP DEFAULT now(),
    thoigian_thanhtoan TIMESTAMP
);

CREATE TABLE chitietmon (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('CTM', 'seq_ma_chitietmon'),
    hoadon_id VARCHAR(30) CONSTRAINT chitietmon_hoadon_id_fkey REFERENCES hoadon(id) ON DELETE CASCADE,
    thucdon_id VARCHAR(30) CONSTRAINT chitietmon_thucdon_id_fkey REFERENCES thucdon(id),
    soluong INTEGER DEFAULT 1,
    trangthai VARCHAR DEFAULT 'cho_nau', -- cho_nau, dang_nau, da_xong, da_phuc_vu, da_huy
    ghichu TEXT,
    giogoimon TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_chitietmon_trangthai_giogoimon ON chitietmon (trangthai, giogoimon);

CREATE TABLE loghuymon (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('HM', 'seq_ma_loghuymon'),
    chitietmon_id VARCHAR(30) CONSTRAINT loghuymon_chitietmon_id_fkey REFERENCES chitietmon(id) ON DELETE CASCADE,
    nguoiduyet_id VARCHAR(30) CONSTRAINT loghuymon_nguoiduyet_id_fkey REFERENCES nguoidung(id),
    lydohuy TEXT NOT NULL
);

CREATE TABLE loggiongnoi (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('GN', 'seq_ma_loggiongnoi'),
    phienban_id VARCHAR(30) CONSTRAINT loggiongnoi_phienban_id_fkey REFERENCES phienban(id) ON DELETE CASCADE,
    vanbangoc TEXT NOT NULL,
    ydinhai JSONB
);

CREATE TABLE phieukiemke (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('PKK', 'seq_ma_phieukiemke'),
    trangthai VARCHAR NOT NULL DEFAULT 'nhap'
        CONSTRAINT phieukiemke_trangthai_hop_le CHECK (trangthai IN ('nhap', 'da_chot')),
    tuluc TIMESTAMP NOT NULL,
    giotao TIMESTAMP NOT NULL DEFAULT now(),
    giochot TIMESTAMP,
    nguoichot_id VARCHAR(30) CONSTRAINT phieukiemke_nguoichot_id_fkey REFERENCES nguoidung(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_phieukiemke_mot_phieu_nhap ON phieukiemke (trangthai) WHERE trangthai = 'nhap';

CREATE TABLE chitietkiemke (
    id VARCHAR(30) PRIMARY KEY DEFAULT sinh_ma_giao_dich('CTKK', 'seq_ma_chitietkiemke'),
    phieukiemke_id VARCHAR(30) NOT NULL CONSTRAINT chitietkiemke_phieukiemke_id_fkey REFERENCES phieukiemke(id) ON DELETE CASCADE,
    thucdon_id VARCHAR(30) NOT NULL CONSTRAINT chitietkiemke_thucdon_id_fkey REFERENCES thucdon(id),
    tondauca INTEGER NOT NULL CONSTRAINT chitietkiemke_tondauca_khong_am CHECK (tondauca >= 0),
    daban INTEGER,
    tonlythuyet INTEGER,
    tonthucte INTEGER CONSTRAINT chitietkiemke_tonthucte_khong_am CHECK (tonthucte >= 0),
    chenhlech INTEGER,
    lydo TEXT,
    CONSTRAINT uq_chitietkiemke_phieu_mon UNIQUE (phieukiemke_id, thucdon_id)
);

-- ---------- 5. Chép dữ liệu về, đổi khóa ngoại sang mã mới ----------
INSERT INTO nguoidung (id, hoten, vaitro, mapin, ngaytao)
    SELECT ma, hoten, vaitro, mapin, ngaytao FROM bk_nguoidung;
INSERT INTO thucdon (id, tenmon, phanloai, giaban, trangthaiban, anhminhhoa, soluongton)
    SELECT ma, tenmon, phanloai, giaban, trangthaiban, anhminhhoa, soluongton FROM bk_thucdon;
INSERT INTO tonkho (id, tennguyenlieu, donvitinh, tonhethong, tonthucte)
    SELECT ma, tennguyenlieu, donvitinh, tonhethong, tonthucte FROM bk_tonkho;
INSERT INTO congthuc (id, thucdon_id, tonkho_id, dinhluong)
    SELECT c.ma, t.ma, k.ma, c.dinhluong FROM bk_congthuc c
    LEFT JOIN bk_thucdon t ON t.id = c.thucdon_id LEFT JOIN bk_tonkho k ON k.id = c.tonkho_id;
INSERT INTO phienban (id, tenban, trangthai, giobatdau, gioketthuc)
    SELECT ma, tenban, trangthai, giobatdau, gioketthuc FROM bk_phienban;
INSERT INTO hoadon (id, phienban_id, tongtien, trangthai, thoigian, thoigian_thanhtoan)
    SELECT h.ma, p.ma, h.tongtien, h.trangthai, h.thoigian, h.thoigian_thanhtoan FROM bk_hoadon h
    LEFT JOIN bk_phienban p ON p.id = h.phienban_id;
INSERT INTO chitietmon (id, hoadon_id, thucdon_id, soluong, trangthai, ghichu, giogoimon)
    SELECT c.ma, h.ma, t.ma, c.soluong, c.trangthai, c.ghichu, c.giogoimon FROM bk_chitietmon c
    LEFT JOIN bk_hoadon h ON h.id = c.hoadon_id LEFT JOIN bk_thucdon t ON t.id = c.thucdon_id;
INSERT INTO loghuymon (id, chitietmon_id, nguoiduyet_id, lydohuy)
    SELECT l.ma, c.ma, n.ma, l.lydohuy FROM bk_loghuymon l
    LEFT JOIN bk_chitietmon c ON c.id = l.chitietmon_id LEFT JOIN bk_nguoidung n ON n.id = l.nguoiduyet_id;
INSERT INTO loggiongnoi (id, phienban_id, vanbangoc, ydinhai)
    SELECT g.ma, p.ma, g.vanbangoc, g.ydinhai FROM bk_loggiongnoi g
    LEFT JOIN bk_phienban p ON p.id = g.phienban_id;
INSERT INTO phieukiemke (id, trangthai, tuluc, giotao, giochot, nguoichot_id)
    SELECT k.ma, k.trangthai, k.tuluc, k.giotao, k.giochot, n.ma FROM bk_phieukiemke k
    LEFT JOIN bk_nguoidung n ON n.id = k.nguoichot_id;
INSERT INTO chitietkiemke (id, phieukiemke_id, thucdon_id, tondauca, daban, tonlythuyet, tonthucte, chenhlech, lydo)
    SELECT c.ma, k.ma, t.ma, c.tondauca, c.daban, c.tonlythuyet, c.tonthucte, c.chenhlech, c.lydo FROM bk_chitietkiemke c
    JOIN bk_phieukiemke k ON k.id = c.phieukiemke_id JOIN bk_thucdon t ON t.id = c.thucdon_id;

-- ---------- 6. Bảo mật + dọn dẹp ----------
-- Giữ như cũ: bật RLS, không policy → chỉ backend (tài khoản chủ DB) đọc/ghi (ADR-ARCH-003)
ALTER TABLE nguoidung ENABLE ROW LEVEL SECURITY;
ALTER TABLE thucdon ENABLE ROW LEVEL SECURITY;
ALTER TABLE tonkho ENABLE ROW LEVEL SECURITY;
ALTER TABLE congthuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE phienban ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoadon ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietmon ENABLE ROW LEVEL SECURITY;
ALTER TABLE loghuymon ENABLE ROW LEVEL SECURITY;
ALTER TABLE loggiongnoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE phieukiemke ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietkiemke ENABLE ROW LEVEL SECURITY;

-- Sequence thuộc về cột id (xóa bảng thì xóa luôn sequence)
ALTER SEQUENCE seq_ma_nguoidung OWNED BY nguoidung.id;
ALTER SEQUENCE seq_ma_thucdon OWNED BY thucdon.id;
ALTER SEQUENCE seq_ma_tonkho OWNED BY tonkho.id;
ALTER SEQUENCE seq_ma_congthuc OWNED BY congthuc.id;
ALTER SEQUENCE seq_ma_phienban OWNED BY phienban.id;
ALTER SEQUENCE seq_ma_hoadon OWNED BY hoadon.id;
ALTER SEQUENCE seq_ma_chitietmon OWNED BY chitietmon.id;
ALTER SEQUENCE seq_ma_loghuymon OWNED BY loghuymon.id;
ALTER SEQUENCE seq_ma_loggiongnoi OWNED BY loggiongnoi.id;
ALTER SEQUENCE seq_ma_phieukiemke OWNED BY phieukiemke.id;
ALTER SEQUENCE seq_ma_chitietkiemke OWNED BY chitietkiemke.id;
