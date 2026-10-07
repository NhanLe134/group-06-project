-- Migration 009 — Thêm cột mota (mô tả món) vào bảng thucdon
-- Dùng cho Smart Ordering AI và màn hình Thêm/Sửa món (US-CMS)
ALTER TABLE thucdon ADD COLUMN IF NOT EXISTS mota TEXT;
