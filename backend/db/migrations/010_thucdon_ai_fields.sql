-- Migration 010 — Thêm các cột phục vụ Smart Ordering AI (US-02)
-- thanhphan: nguyên liệu chính (VD: "thịt bò, hành, tiêu")
-- thongtindiung: cảnh báo dị ứng (VD: "hải sản, đậu phộng")
-- docay: mức độ cay: 'khong_cay' | 'cay_nhe' | 'cay_vua' | 'cay_nhieu'
-- loaimon: 'man' | 'chay'
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS thanhphan    TEXT;
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS thongtindiung TEXT;
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS docay        VARCHAR(20);
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS loaimon      VARCHAR(10);
