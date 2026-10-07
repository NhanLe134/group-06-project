-- Migration 005: Thêm cột thoigian_thanhtoan vào bảng hoadon
ALTER TABLE hoadon ADD COLUMN IF NOT EXISTS thoigian_thanhtoan TIMESTAMP DEFAULT NULL;
