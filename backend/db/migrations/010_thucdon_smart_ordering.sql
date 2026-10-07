-- Migration 010 — Lưu thông tin phục vụ Smart Ordering của từng món
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS thanhphan TEXT;
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS docay VARCHAR(30);
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS loaimon VARCHAR(30);
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS thongtindiung TEXT;
