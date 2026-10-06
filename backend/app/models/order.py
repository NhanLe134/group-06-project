"""Phiên bàn, hóa đơn & chi tiết món — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class PhienBan(Base):
    """Phiên ngồi của 1 bàn (TABLES + TABLE_SESSIONS)."""

    __tablename__ = "phienban"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenban: Mapped[str] = mapped_column(String)
    trangthai: Mapped[str | None] = mapped_column(String, server_default="trong")
    giobatdau: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), default=None)
    gioketthuc: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), default=None)


class HoaDon(Base):
    """Đơn / hóa đơn của 1 phiên bàn (ORDERS)."""

    __tablename__ = "hoadon"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    phienban_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("phienban.id", ondelete="CASCADE"), default=None
    )
    tongtien: Mapped[int | None] = mapped_column(Integer, server_default="0")
    trangthai: Mapped[str | None] = mapped_column(String, server_default="ban_nhap")
    thoigian: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), server_default=func.now()
    )
    thoigian_thanhtoan: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), default=None
    )


class ChiTietMon(Base):
    """1 dòng món trong hóa đơn (ORDER_ITEMS).

    `trangthai` là trạng thái món trên KDS (US-03 AC2):
    cho_nau, dang_nau, da_xong, da_phuc_vu, da_huy.
    """

    __tablename__ = "chitietmon"
    __table_args__ = (Index("idx_chitietmon_trangthai_giogoimon", "trangthai", "giogoimon"),)
    # Đọc lại giá trị DB tự sinh (giogoimon, trangthai...) ngay khi insert,
    # tránh lazy-load ngầm trong async session
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    hoadon_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("hoadon.id", ondelete="CASCADE"), default=None
    )
    thucdon_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("thucdon.id"), default=None)
    soluong: Mapped[int | None] = mapped_column(Integer, server_default="1")
    trangthai: Mapped[str | None] = mapped_column(String, server_default="cho_nau")
    ghichu: Mapped[str | None] = mapped_column(Text, default=None)
    # Giờ gọi món (UTC) — migration 001; KDS xếp FIFO và hiển thị "Nhận lúc ..."
    giogoimon: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.now())
