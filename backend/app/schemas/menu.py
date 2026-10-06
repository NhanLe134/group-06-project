from pydantic import BaseModel, Field

from app.models.menu import ThucDon


class MenuItemOut(BaseModel):
    """Hợp đồng API `GET /menu` giữ nguyên tên trường tiếng Anh (frontend đang dùng);
    dữ liệu đọc từ bảng `thucdon` trên Supabase và đổi tên ở đây."""

    id: str
    name: str
    description: str | None
    price: float
    image_url: str | None
    category: str | None
    status: str
    # Số lượng tồn (đồ uống chai/lon...); null = món không đếm số lượng
    stock: int | None

    @classmethod
    def from_thucdon(cls, mon: ThucDon) -> "MenuItemOut":
        return cls(
            id=mon.id,
            name=mon.tenmon,
            description=None,  # bảng thucdon chưa có cột mô tả
            price=float(mon.giaban),
            image_url=mon.anhminhhoa,
            category=mon.phanloai,
            # Hết hàng khi trangthaiban = false hoặc soluongton = 0 (REQ-09); NULL coi như đang bán
            status="out_of_stock" if mon.het_hang else "available",
            stock=mon.soluongton,
        )


class StockUpdateIn(BaseModel):
    """Đặt số lượng tồn; null = chuyển món về loại không đếm số lượng."""

    stock: int | None = Field(ge=0)
