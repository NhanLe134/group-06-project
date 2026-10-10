"""Phiếu kiểm kê & đối soát tồn kho cuối ca (US-08) — migration 006.

Xem vault/06-Engineering/story-spec-us08-inventory.md và frontend/fe_ofc/dtb.md.
"""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    FetchedValue,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

NHAP, DA_CHOT = "nhap", "da_chot"


class PhieuKiemKe(Base):
    """1 phiếu = 1 ca kiểm kê. `da_chot` thì bất biến (BR-07)."""

    __tablename__ = "phieukiemke"
    __table_args__ = (
        CheckConstraint("trangthai IN ('nhap', 'da_chot')", name="phieukiemke_trangthai_hop_le"),
        # Chỉ 1 phiếu nháp tại một thời điểm
        Index(
            "uq_phieukiemke_mot_phieu_nhap",
            "trangthai",
            unique=True,
            postgresql_where=text("trangthai = 'nhap'"),
            sqlite_where=text("trangthai = 'nhap'"),
        ),
    )
    __mapper_args__ = {"eager_defaults": True}

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    trangthai: Mapped[str] = mapped_column(String, server_default=NHAP)
    tuluc: Mapped[datetime] = mapped_column(DateTime(timezone=False))  # đầu kỳ (UTC)
    giotao: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.now())
    giochot: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), default=None)
    nguoichot_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("nguoidung.id", ondelete="SET NULL"), default=None
    )


class ChiTietKiemKe(Base):
    """1 dòng đối soát cho 1 món đếm số lượng: A, B, C = A - B, tồn thực tế, chênh lệch."""

    __tablename__ = "chitietkiemke"
    __table_args__ = (
        UniqueConstraint("phieukiemke_id", "thucdon_id", name="uq_chitietkiemke_phieu_mon"),
        CheckConstraint("tondauca >= 0", name="chitietkiemke_tondauca_khong_am"),
        CheckConstraint("tonthucte >= 0", name="chitietkiemke_tonthucte_khong_am"),
    )

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    phieukiemke_id: Mapped[str] = mapped_column(String(30), ForeignKey("phieukiemke.id", ondelete="CASCADE"))
    thucdon_id: Mapped[str] = mapped_column(String(30), ForeignKey("thucdon.id"))
    tondauca: Mapped[int] = mapped_column(Integer)
    daban: Mapped[int | None] = mapped_column(Integer, default=None)
    tonlythuyet: Mapped[int | None] = mapped_column(Integer, default=None)
    tonthucte: Mapped[int | None] = mapped_column(Integer, default=None)
    chenhlech: Mapped[int | None] = mapped_column(Integer, default=None)
    lydo: Mapped[str | None] = mapped_column(Text, default=None)
