-- Migration 002 — 2026-10-06 — Tồn kho theo số lượng cho món bán nguyên đơn vị (đồ uống chai/lon...)
-- soluongton:
--   NULL  = món không đếm số lượng (món chế biến — nguyên liệu quản lý ở bảng tonkho/congthuc)
--   >= 0  = số lượng còn bán được; = 0 thì món được coi là Hết hàng (cùng hiệu ứng trangthaiban = false)
-- Tên cột không dùng "tonkho" để tránh nhầm với bảng tonkho (kho nguyên liệu).
-- Chạy được nhiều lần: cả câu ADD COLUMN (kèm CHECK) bị bỏ qua nếu cột đã có.

ALTER TABLE thucdon
    ADD COLUMN IF NOT EXISTS soluongton INTEGER
    CONSTRAINT thucdon_soluongton_khong_am CHECK (soluongton >= 0);
