import uuid
from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_serializer

# Trạng thái món mà KDS hiển thị/được đổi (giá trị DB, xem frontend/fe_ofc/dtb.md)
KdsStatus = Literal["cho_nau", "dang_nau", "da_xong"]


class KdsItemOut(BaseModel):
    """1 thẻ món trên KDS = 1 dòng chitietmon kèm tên bàn, tên món."""

    id: uuid.UUID
    hoadon_id: uuid.UUID | None
    ban: str | None
    thucdon_id: uuid.UUID | None
    tenmon: str | None
    soluong: int
    ghichu: str | None
    trangthai: str
    giogoimon: datetime
    het_hang: bool

    @field_serializer("giogoimon")
    def _utc(self, value: datetime) -> str:
        # DB lưu TIMESTAMP không múi giờ theo UTC → trả ISO có "Z" để trình duyệt đổi đúng giờ VN
        return (value if value.tzinfo else value.replace(tzinfo=UTC)).isoformat()


class StatusUpdateIn(BaseModel):
    trangthai: KdsStatus


class SplitIn(BaseModel):
    soluong: int = Field(ge=1, description="Số suất tách ra để chuyển trạng thái")
    trangthai: KdsStatus


class SplitOut(BaseModel):
    goc: KdsItemOut
    moi: KdsItemOut
