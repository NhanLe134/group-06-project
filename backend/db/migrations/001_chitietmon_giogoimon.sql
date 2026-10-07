-- Migration 001 — 2026-10-06 — US-03 (KDS)
-- Thêm giờ gọi món cho từng dòng chitietmon: KDS cần xếp món theo thứ tự đến trước (FIFO)
-- và hiển thị "Nhận lúc ..." trên thẻ món (data-model.md Mục 5, khoảng trống #1).
-- Lưu theo giờ UTC (TIMESTAMP không múi giờ, giống các cột thời gian khác; now() của Supabase là UTC).
-- Chạy được nhiều lần (IF NOT EXISTS). Các dòng đã có sẵn được gán giờ chạy migration.

ALTER TABLE chitietmon
    ADD COLUMN IF NOT EXISTS giogoimon TIMESTAMP NOT NULL DEFAULT now();

-- KDS truy vấn món theo trạng thái rồi sắp theo giờ gọi
CREATE INDEX IF NOT EXISTS idx_chitietmon_trangthai_giogoimon
    ON chitietmon (trangthai, giogoimon);
