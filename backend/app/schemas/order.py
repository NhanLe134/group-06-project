"""Hợp đồng API cho US-01 (gửi bếp), US-09 (hóa đơn tạm tính) và US-05 (thu ngân).

Quy ước trạng thái khớp Supabase (frontend/fe_ofc/dtb.md):
- phienban.trangthai: 'trong' | 'dang_phuc_vu'
- hoadon.trangthai:   'ban_nhap' | 'da_chot' | 'da_thanh_toan'
- chitietmon.trangthai: 'cho_nau' | 'dang_nau' | 'da_xong' | 'da_phuc_vu' | 'da_huy'
"""

from datetime import UTC, datetime

from pydantic import BaseModel, Field, field_serializer


class OrderItemIn(BaseModel):
    """1 món khách gọi từ E-Menu (US-01)."""

    thucdon_id: str
    soluong: int = Field(ge=1)
    ghichu: str | None = None


class OrderCreateIn(BaseModel):
    table_name: str = Field(min_length=1, examples=["Bàn 06"])
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    """1 dòng chitietmon kèm tên món + giá đọc từ thucdon."""

    id: str
    tenmon: str | None
    soluong: int
    gia: int
    thanhtien: int
    ghichu: str | None
    trangthai: str
    dot: int | None = None  # đợt gọi (1, 2...) — nhóm theo mốc giogoimon (ADR-N13)
    giogoimon: datetime | None = None

    @field_serializer("giogoimon")
    def _utc(self, value: datetime | None) -> str | None:
        # DB lưu TIMESTAMP không múi giờ theo UTC → trả ISO có "Z" để trình duyệt đổi đúng giờ VN
        if value is None:
            return None
        return (value if value.tzinfo else value.replace(tzinfo=UTC)).isoformat()


class OrderCurrentOut(BaseModel):
    """Hóa đơn tạm tính (tổng các phiếu chưa tính tiền) — US-09 + chi tiết Thu ngân."""

    phieuban_id: str
    hoadon_id: str
    table_name: str
    tongtien: int
    items: list[OrderItemOut]
    # US-09 AC2/AC3: True khi mọi món đã 'da_phuc_vu' → mới cho yêu cầu thanh toán
    all_served: bool


class PayQrOut(BaseModel):
    """US-05: dữ liệu QR thanh toán cho các phiếu chưa tính tiền của 1 bàn."""

    ban_id: str
    table_name: str
    amount: int
    so_phieuban: int
    hoadon_id: str
    qr_data: str
    qr_url: str


class TableOut(BaseModel):
    """1 dòng của `GET /cashier/tables` — bàn master + tiến độ món + tổng tiền."""

    id: str
    tenban: str
    trangthai: str | None
    gio_vao: str | None
    tongtien: int
    so_phieuban: int = 0
    tong_mon: int = 0        # tổng dòng món chưa tính tiền
    mon_phuc_vu: int = 0     # món đã phục vụ (da_phuc_vu)
    mon_da_xong: int = 0     # món bếp xong chờ bưng (da_xong)


class CloseTableOut(BaseModel):
    phienban_id: str
    table_name: str
    hoadon_id: str
    tongtien: int
    message: str
