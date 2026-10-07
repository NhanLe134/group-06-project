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
    stock: int | None
    listed: bool = True

    @classmethod
    def from_thucdon(cls, mon: ThucDon) -> "MenuItemOut":
        return cls(
            id=mon.id,
            name=mon.tenmon,
            description=mon.mota,
            price=float(mon.giaban),
            image_url=mon.anhminhhoa,
            category=mon.phanloai,
            status="out_of_stock" if mon.het_hang else "available",
            stock=mon.soluongton,
            listed=mon.trangthaiban is not False,
        )


class StockUpdateIn(BaseModel):
    """Đặt số lượng tồn; null = chuyển món về loại không đếm số lượng."""
    stock: int | None = Field(ge=0)


class MenuItemCreateIn(BaseModel):
    """Body tạo món mới (POST /menu/items)."""
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    price: int = Field(gt=0)
    description: str | None = None
    image_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    listed: bool = True


class MenuItemUpdateIn(BaseModel):
    """Body cập nhật món (PATCH /menu/items/{id}) — tất cả trường tùy chọn."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price: int | None = Field(default=None, gt=0)
    description: str | None = None
    image_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    listed: bool | None = None


class MenuCreate(BaseModel):
    """Dữ liệu tạo món cho REST API /api/menu."""

    name: str = Field(min_length=1, max_length=200, description="Tên món ăn")
    description: str | None = Field(default=None, description="Mô tả món ăn")
    price: int = Field(gt=0, description="Giá bán, đơn vị VND")
    category: str = Field(min_length=1, max_length=100, description="Danh mục món")
    image_url: str | None = Field(default=None, description="URL hình ảnh")
    is_available: bool = Field(default=True, description="Món hiện có thể bán hay không")
    stock: int | None = Field(default=None, ge=0, description="Số lượng tồn; để trống nếu không theo dõi")
    ingredients: str | None = Field(default=None, description="Thành phần món ăn")
    spicy: str | None = Field(default=None, max_length=30, description="Mức độ cay")
    diet: str | None = Field(default=None, max_length=30, description="Loại món, ví dụ Mặn hoặc Chay")
    allergens: str | None = Field(default=None, description="Thông tin chất gây dị ứng")


class MenuUpdate(BaseModel):
    """Các trường gửi lên sẽ được cập nhật; trường bỏ qua được giữ nguyên."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price: int | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    image_url: str | None = None
    is_available: bool | None = None
    stock: int | None = Field(default=None, ge=0, description="Số lượng tồn; null nếu không theo dõi")
    ingredients: str | None = None
    spicy: str | None = Field(default=None, max_length=30)
    diet: str | None = Field(default=None, max_length=30)
    allergens: str | None = None


class MenuRead(BaseModel):
    """Thông tin món ăn trả về bởi REST API /api/menu."""

    id: str
    name: str
    description: str | None
    price: int
    category: str
    image_url: str | None
    is_available: bool
    stock: int | None = None
    ingredients: str | None = None
    spicy: str | None = None
    diet: str | None = None
    allergens: str | None = None

    @classmethod
    def from_thucdon(cls, mon: ThucDon) -> "MenuRead":
        return cls(
            id=mon.id,
            name=mon.tenmon,
            description=mon.mota,
            price=mon.giaban,
            category=mon.phanloai,
            image_url=mon.anhminhhoa,
            is_available=not mon.het_hang,
            stock=mon.soluongton,
            ingredients=mon.thanhphan,
            spicy=mon.docay,
            diet=mon.loaimon,
            allergens=mon.thongtindiung,
        )
