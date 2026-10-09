"""Bàn, phiếu bàn, chi tiết phiếu & hóa đơn — khớp thiết kế mới (ADR-N14).

Xem vault/08-Decisions/decision_log_Nhan.md ADR-N14 và frontend/fe_ofc/dtb.md.

- `ban`           : MASTER — 6 bàn vật lý, trangthai 1=sẵn sàng, 2=đang phục vụ, 3=chờ dọn
- `hoadon`        : TRANSACTION — chỉ tạo khi THANH TOÁN, tổng hợp các phiếu bàn
- `phieuban`      : TRANSACTION — 1 lần khách gửi bếp = 1 phiếu; hoadon_id NULL = khách đang dùng
- `chitietphieu`  : TRANSACTION — món trong phiếu (giờ gọi theo phieuban.giogoimon)
"""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    FetchedValue,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Ban(Base):
    """Bàn vật lý (TABLES — master data)."""

    __tablename__ = "ban"

    ban_id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    tenban: Mapped[str] = mapped_column(String)
    # 1 = sẵn sàng, 2 = đang phục vụ, 3 = chờ dọn (lưu số để giảm dữ liệu)
    trangthai: Mapped[int | None] = mapped_column(SmallInteger, server_default="1")


class HoaDon(Base):
    """Hóa đơn — tạo khi THANH TOÁN, tổng hợp các phiếu bàn chưa tính tiền (BILLS)."""

    __tablename__ = "hoadon"

    hoadon_id: Mapped[str] = mapped_column(
        String(30), primary_key=True, server_default=FetchedValue()
    )
    ban_id: Mapped[str | None] = mapped_column(String(30), ForeignKey("ban.ban_id"), default=None)
    # Thu ngân xác nhận thu tiền (RBAC sau này); NULL = chưa gán
    nhanvien_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("nguoidung.id"), default=None
    )
    so_phieuban: Mapped[int | None] = mapped_column(Integer, server_default="0")
    tongtien: Mapped[int | None] = mapped_column(Integer, server_default="0")
    # Hóa đơn chỉ sinh khi chốt tiền → mặc định đã thanh toán
    trangthai: Mapped[str | None] = mapped_column(String, server_default="da_thanh_toan")
    thoigianthanhtoan: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), server_default=func.now()
    )


class PhieuBan(Base):
    """Phiếu bàn = 1 lần khách gửi bếp (TABLE_TICKETS).

    `hoadon_id = NULL` → phiếu của khách ĐANG sử dụng (chưa tính tiền);
    có `hoadon_id` → phiếu đã thuộc hóa đơn khách trước (ADR-N14).
    """

    __tablename__ = "phieuban"

    phieuban_id: Mapped[str] = mapped_column(
        String(30), primary_key=True, server_default=FetchedValue()
    )
    ban_id: Mapped[str | None] = mapped_column(String(30), ForeignKey("ban.ban_id"), default=None)
    giogoimon: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.now())
    hoadon_id: Mapped[str | None] = mapped_column(
        ForeignKey("hoadon.hoadon_id", ondelete="CASCADE"), default=None
    )


class ChiTietPhieu(Base):
    """1 dòng món trong phiếu bàn (ORDER_ITEMS).

    Giờ gọi của món = `phieuban.giogoimon` (cả phiếu chung 1 giờ gọi) — không lưu trùng.
    `trangthai` là trạng thái món trên KDS (US-03 AC2):
    cho_nau, dang_nau, da_xong, da_phuc_vu, da_huy.
    """

    __tablename__ = "chitietphieu"

    chitietphieu_id: Mapped[str] = mapped_column(
        String(30), primary_key=True, server_default=FetchedValue()
    )
    phieuban_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("phieuban.phieuban_id", ondelete="CASCADE"), default=None
    )
    mon_id: Mapped[str | None] = mapped_column(ForeignKey("thucdon.id"), default=None)
    soluong: Mapped[int | None] = mapped_column(Integer, server_default="1")
    trangthai: Mapped[str | None] = mapped_column(String, server_default="cho_nau")
    ghichu: Mapped[str | None] = mapped_column(Text, default=None)
