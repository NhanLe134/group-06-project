-- Migration 006 — 2026-10-06 — US-08 Đối soát tồn kho & Đóng ca
-- phieukiemke   : 1 phiếu = 1 ca kiểm kê. trangthai: nhap (đang kiểm) | da_chot (bất biến — BR-07)
-- chitietkiemke : 1 dòng = 1 món đếm số lượng (thucdon.soluongton khác NULL)
--   tondauca (A) | daban (B) | tonlythuyet (C = A - B) | tonthucte | chenhlech (= tonthucte - C; âm = hao hụt)
-- Thời gian lưu UTC (TIMESTAMP không múi giờ) như các bảng khác. Chạy được nhiều lần (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS phieukiemke (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maphieu VARCHAR NOT NULL UNIQUE,
    trangthai VARCHAR NOT NULL DEFAULT 'nhap'
        CONSTRAINT phieukiemke_trangthai_hop_le CHECK (trangthai IN ('nhap', 'da_chot')),
    tuluc TIMESTAMP NOT NULL,
    giotao TIMESTAMP NOT NULL DEFAULT now(),
    giochot TIMESTAMP,
    nguoichot_id UUID REFERENCES nguoidung(id) ON DELETE SET NULL
);

-- Chỉ được có 1 phiếu đang kiểm (nháp) tại một thời điểm
CREATE UNIQUE INDEX IF NOT EXISTS uq_phieukiemke_mot_phieu_nhap
    ON phieukiemke (trangthai) WHERE trangthai = 'nhap';

CREATE TABLE IF NOT EXISTS chitietkiemke (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phieukiemke_id UUID NOT NULL REFERENCES phieukiemke(id) ON DELETE CASCADE,
    thucdon_id UUID NOT NULL REFERENCES thucdon(id),
    tondauca INTEGER NOT NULL CONSTRAINT chitietkiemke_tondauca_khong_am CHECK (tondauca >= 0),
    daban INTEGER,
    tonlythuyet INTEGER,
    tonthucte INTEGER CONSTRAINT chitietkiemke_tonthucte_khong_am CHECK (tonthucte >= 0),
    chenhlech INTEGER,
    lydo TEXT,
    CONSTRAINT uq_chitietkiemke_phieu_mon UNIQUE (phieukiemke_id, thucdon_id)
);

-- Đồng bộ với 9 bảng cũ: bật RLS, chỉ backend (tài khoản chủ DB) đọc/ghi — ADR-ARCH-003
ALTER TABLE phieukiemke ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietkiemke ENABLE ROW LEVEL SECURITY;
