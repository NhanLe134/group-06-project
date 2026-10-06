"""Thực đơn & tồn kho — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

import uuid
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, Numeric, String, Text, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def la_het_hang(trangthaiban: bool | None, soluongton: int | None) -> bool:
    """Hết hàng khi Bếp/Quản lý tắt bán, hoặc món đếm số lượng đã về 0 (REQ-09, BR-03)."""
    return trangthaiban is False or (soluongton is not None and soluongton <= 0)


class ThucDon(Base):
    """Món ăn trên E-Menu (MENU_ITEMS).

    `trangthaiban = false` hoặc `soluongton = 0` nghĩa là Hết hàng (xem `la_het_hang`).
    """

    __tablename__ = "thucdon"
    __table_args__ = (
        CheckConstraint("soluongton >= 0", name="thucdon_soluongton_khong_am"),  # migration 002
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenmon: Mapped[str] = mapped_column(String)
    phanloai: Mapped[str] = mapped_column(String)
    giaban: Mapped[int] = mapped_column(Integer)
    trangthaiban: Mapped[bool | None] = mapped_column(Boolean, server_default=true())
    anhminhhoa: Mapped[str | None] = mapped_column(Text, default=None)
    # Số lượng tồn của món bán nguyên đơn vị (đồ uống chai/lon...). NULL = không đếm số lượng.
    soluongton: Mapped[int | None] = mapped_column(Integer, default=None)

    @property
    def het_hang(self) -> bool:
        return la_het_hang(self.trangthaiban, self.soluongton)


class TonKho(Base):
    """Nguyên liệu trong kho (INVENTORY_ITEMS)."""

    __tablename__ = "tonkho"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tennguyenlieu: Mapped[str] = mapped_column(String)
    donvitinh: Mapped[str] = mapped_column(String)
    tonhethong: Mapped[Decimal | None] = mapped_column(Numeric, server_default="0")
    tonthucte: Mapped[Decimal | None] = mapped_column(Numeric, default=None)


class CongThuc(Base):
    """Định lượng nguyên liệu cho 1 món (MENU_ITEM_INGREDIENTS)."""

    __tablename__ = "congthuc"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    thucdon_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("thucdon.id", ondelete="CASCADE"), default=None
    )
    tonkho_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tonkho.id", ondelete="CASCADE"), default=None
    )
    dinhluong: Mapped[Decimal] = mapped_column(Numeric)
