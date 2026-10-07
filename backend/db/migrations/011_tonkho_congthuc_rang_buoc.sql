-- Migration 011 — 2026-10-07 — Ràng buộc cho trừ kho tự động (story-spec-tru-kho-tu-dong.md, Q6)
--   tonkho.tonhethong >= 0           : không cho tồn nguyên liệu âm
--   congthuc.dinhluong > 0           : định lượng phải dương
--   UNIQUE(thucdon_id, tonkho_id)    : mỗi nguyên liệu chỉ xuất hiện 1 lần trong công thức của 1 món
-- Bảng tonkho/congthuc hiện còn trống nên các ràng buộc áp dụng ngay không lỗi dữ liệu cũ.
-- Chạy được nhiều lần: bỏ qua ràng buộc đã có.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tonkho_tonhethong_khong_am') THEN
        ALTER TABLE tonkho
            ADD CONSTRAINT tonkho_tonhethong_khong_am CHECK (tonhethong >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'congthuc_dinhluong_duong') THEN
        ALTER TABLE congthuc
            ADD CONSTRAINT congthuc_dinhluong_duong CHECK (dinhluong > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'congthuc_mon_nguyenlieu_unique') THEN
        ALTER TABLE congthuc
            ADD CONSTRAINT congthuc_mon_nguyenlieu_unique UNIQUE (thucdon_id, tonkho_id);
    END IF;
END $$;
