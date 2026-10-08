"""Thực đơn & tồn kho — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    FetchedValue,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    event,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class ThucDon(Base):
    """Món ăn trên E-Menu (MENU_ITEMS).

    Cách tính tồn theo TỪNG MÓN (phương án A — story-spec-tru-kho-tu-dong.md Mục 3):
    - Món MUA SẴN (`soluongton` khác NULL, vd. sữa chua hũ, Coca lon): đếm theo số lượng.
    - Món CHẾ BIẾN (`soluongton` NULL): tồn theo nguyên liệu (`congthuc` × `tonkho`).
    `trangthaiban = false` hoặc hết số phần còn nghĩa là Hết hàng (xem `het_hang`).
    """

    __tablename__ = "thucdon"
    __table_args__ = (
        CheckConstraint("soluongton >= 0", name="thucdon_soluongton_khong_am"),  # migration 002
    )

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    tenmon: Mapped[str] = mapped_column(String)
    phanloai: Mapped[str] = mapped_column(String)
    giaban: Mapped[int] = mapped_column(Integer)
    trangthaiban: Mapped[bool | None] = mapped_column(Boolean, server_default=true())
    anhminhhoa: Mapped[str | None] = mapped_column(Text, default=None)
    mota: Mapped[str | None] = mapped_column(Text, default=None)
    thanhphan: Mapped[str | None] = mapped_column(Text, default=None)
    docay: Mapped[str | None] = mapped_column(String(30), default=None)
    loaimon: Mapped[str | None] = mapped_column(String(30), default=None)
    thongtindiung: Mapped[str | None] = mapped_column(Text, default=None)
    soluongton: Mapped[int | None] = mapped_column(Integer, default=None)
    # Món bán chạy — nhãn 🔥 Bán chạy trên E-Menu (ADR-002)
    banchay: Mapped[bool | None] = mapped_column(Boolean, default=None)

    # Công thức nạp sẵn cùng món (selectin) để tính số phần còn mà không lazy-load trong async
    congthuc: Mapped[list["CongThuc"]] = relationship(
        lazy="selectin", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def mua_san(self) -> bool:
        """Món mua sẵn: có nhập số lượng tồn → đếm theo `soluongton`, không trừ nguyên liệu."""
        return self.soluongton is not None

    @property
    def so_phan_con(self) -> int | None:
        """Số phần còn bán được; None = không giới hạn (món chế biến chưa có công thức).

        - Mua sẵn: `soluongton`.
        - Chế biến: min(⌊tồn nguyên liệu ÷ định lượng⌋) theo công thức.
        Story Spec: vault/06-Engineering/story-spec-tru-kho-tu-dong.md Mục 3.
        """
        if self.mua_san:
            return max(self.soluongton, 0)
        gioi_han = [
            max(int((ct.nguyenlieu.tonhethong or 0) // ct.dinhluong), 0)
            for ct in self.congthuc
            if ct.dinhluong and ct.dinhluong > 0
        ]
        return min(gioi_han) if gioi_han else None

    @property
    def het_hang(self) -> bool:
        """Hết hàng khi bếp báo hết, hoặc không còn đủ hàng/nguyên liệu cho 1 phần."""
        return self.trangthaiban is False or self.so_phan_con == 0


@event.listens_for(ThucDon, "init")
def _mon_moi_chua_co_cong_thuc(target: ThucDon, args, kwargs) -> None:
    """Món tạo mới chưa có công thức: gán sẵn danh sách rỗng để `so_phan_con` không
    lazy-load (không được phép trong async session) sau khi insert."""
    kwargs.setdefault("congthuc", [])


class TonKho(Base):
    """Nguyên liệu trong kho (INVENTORY_ITEMS)."""

    __tablename__ = "tonkho"
    __table_args__ = (
        CheckConstraint("tonhethong >= 0", name="tonkho_tonhethong_khong_am"),  # migration 011
    )

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    tennguyenlieu: Mapped[str] = mapped_column(String)
    donvitinh: Mapped[str] = mapped_column(String)
    tonhethong: Mapped[Decimal | None] = mapped_column(Numeric, server_default="0")
    tonthucte: Mapped[Decimal | None] = mapped_column(Numeric, default=None)


class CongThuc(Base):
    """Định lượng nguyên liệu cho 1 món (MENU_ITEM_INGREDIENTS)."""

    __tablename__ = "congthuc"
    __table_args__ = (
        CheckConstraint("dinhluong > 0", name="congthuc_dinhluong_duong"),  # migration 011
        UniqueConstraint("thucdon_id", "tonkho_id", name="congthuc_mon_nguyenlieu_unique"),
    )

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    thucdon_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("thucdon.id", ondelete="CASCADE"), default=None
    )
    tonkho_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("tonkho.id", ondelete="CASCADE"), default=None
    )
    dinhluong: Mapped[Decimal] = mapped_column(Numeric)

    nguyenlieu: Mapped[TonKho] = relationship(lazy="selectin")
