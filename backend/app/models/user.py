"""Người dùng & nhật ký hủy món — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

from datetime import datetime

from sqlalchemy import DateTime, FetchedValue, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class NguoiDung(Base):
    """Tài khoản nhân viên (USERS). `vaitro`: QUAN_LY, PHUC_VU, BEP, THU_NGAN."""

    __tablename__ = "nguoidung"

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    hoten: Mapped[str] = mapped_column(String)
    vaitro: Mapped[str] = mapped_column(String)
    tendangnhap: Mapped[str | None] = mapped_column(String, unique=True, default=None)
    matkhau: Mapped[str | None] = mapped_column(String, default=None)
    mapin: Mapped[str | None] = mapped_column(String, default=None)
    ngaytao: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), server_default=func.now())


class LogHuyMon(Base):
    """Nhật ký hủy món có người duyệt (VOID_REFUND_LOGS)."""

    __tablename__ = "loghuymon"

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    chitietphieu_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("chitietphieu.chitietphieu_id", ondelete="CASCADE"), default=None
    )
    nguoiduyet_id: Mapped[str | None] = mapped_column(String(30), ForeignKey("nguoidung.id"), default=None)
    lydohuy: Mapped[str] = mapped_column(Text)
