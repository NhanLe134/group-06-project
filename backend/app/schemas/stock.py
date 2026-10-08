"""Nguyên liệu (`tonkho`) và công thức (`congthuc`). Spec: story-spec-tru-kho-tu-dong.md Mục 4."""

from pydantic import BaseModel, Field


class IngredientIn(BaseModel):
    name: str = Field(min_length=1, max_length=200, description="Tên nguyên liệu")
    unit: str = Field(min_length=1, max_length=30, description="Đơn vị tính, vd. kg, lít, quả")
    stock: float = Field(default=0, ge=0, description="Tồn hệ thống")


class IngredientUpdateIn(BaseModel):
    """Trường không gửi sẽ giữ nguyên; `stock` = tồn mới sau khi nhập hàng."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    unit: str | None = Field(default=None, min_length=1, max_length=30)
    stock: float | None = Field(default=None, ge=0)


class IngredientOut(BaseModel):
    id: str
    name: str
    unit: str
    stock: float
    used_in: list[str] = Field(default_factory=list, description="Tên các món dùng nguyên liệu")


class RecipeLineIn(BaseModel):
    ingredient_id: str
    quantity: float = Field(gt=0, description="Định lượng cho 1 phần, theo đơn vị nguyên liệu")


class RecipeIn(BaseModel):
    lines: list[RecipeLineIn]


class RecipeLineOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    unit: str
    quantity: float
    stock: float


class RecipeOut(BaseModel):
    thucdon_id: str
    tenmon: str
    portions: int | None = Field(description="Số phần còn làm được; null = không giới hạn")
    lines: list[RecipeLineOut]
