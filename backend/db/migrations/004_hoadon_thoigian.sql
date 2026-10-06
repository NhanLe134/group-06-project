-- Migration 004: Thêm cột thoigian vào bảng hoadon (dạng datetime / TIMESTAMP)
ALTER TABLE hoadon ADD COLUMN IF NOT EXISTS thoigian TIMESTAMP DEFAULT NOW();
