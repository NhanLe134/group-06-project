-- Migration 003: Xóa cột sokhach trong bảng phienban
ALTER TABLE phienban DROP COLUMN IF EXISTS sokhach;
