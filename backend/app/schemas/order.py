"""Hợp đồng API cho US-01 (gửi bếp), US-09 (hóa đơn tạm tính) và US-05 (thu ngân).

Quy ước trạng thái khớp Supabase (frontend/fe_ofc/dtb.md):
- phienban.trangthai: 'trong' | 'dang_phuc_vu'
- hoadon.trangthai:   'ban_nhap' | 'da_chot' | 'da_thanh_toan'
- chitietmon.trangthai: 'cho_nau' | 'dang_nau' | 'da_xong' | 'da_phuc_vu' | 'da_huy'
"""

from pydantic import BaseModel, Field


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
    dot: int | None = None  # đợt gọi (1, 2...) — chitietmon chưa có cột này nên tạm theo giogoimon


class OrderCurrentOut(BaseModel):
    """Hóa đơn đang mở ('da_chot') của phiên bàn — dùng cho US-09 + chi tiết Thu ngân."""

    phienban_id: str
    hoadon_id: str
    table_name: str
    tongtien: int
    items: list[OrderItemOut]
    # US-09 AC2/AC3: True khi mọi món đã 'da_phuc_vu' → mới cho yêu cầu thanh toán
    all_served: bool


class PayQrOut(BaseModel):
    """US-05: dữ liệu QR thanh toán cho 1 hóa đơn."""

    hoadon_id: str
    table_name: str
    amount: int
    qr_data: str
    qr_url: str


class TableOut(BaseModel):
    """1 dòng của `GET /cashier/tables` — phiên bàn kèm hóa đơn đang mở (nếu có)."""

    id: str
    tenban: str
    trangthai: str | None
    giobatdau: str | None
    hoadon_id: str | None
    hoadon_trangthai: str | None
    tongtien: int


class CloseTableOut(BaseModel):
    phienban_id: str
    table_name: str
    hoadon_id: str
    tongtien: int
    message: str
