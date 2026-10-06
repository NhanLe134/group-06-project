from datetime import UTC, datetime

from pydantic import BaseModel, Field, field_serializer


def _utc(value: datetime | None) -> str | None:
    # DB lưu TIMESTAMP không múi giờ theo UTC → trả ISO có múi giờ để trình duyệt đổi đúng giờ VN
    if value is None:
        return None
    return (value if value.tzinfo else value.replace(tzinfo=UTC)).isoformat()


class ShiftLineOut(BaseModel):
    """1 dòng đối soát (AC1): A = tondauca, B = daban, C = tonlythuyet = A - B."""

    thucdon_id: str
    tenmon: str
    tondauca: int
    daban: int
    tonlythuyet: int
    tonthucte: int | None
    chenhlech: int | None  # tonthucte - tonlythuyet; âm = hao hụt
    lydo: str | None


class ShiftSummaryOut(BaseModel):
    id: str
    maphieu: str  # = id, giữ trường này để frontend không phải đổi
    trangthai: str
    tuluc: datetime
    giotao: datetime
    giochot: datetime | None
    nguoichot: str | None
    so_mon: int
    so_mon_hao_hut: int
    tong_hao_hut: int

    @field_serializer("tuluc", "giotao", "giochot")
    def _ser_time(self, value: datetime | None) -> str | None:
        return _utc(value)


class ShiftDetailOut(ShiftSummaryOut):
    lines: list[ShiftLineOut]


class ShiftLineIn(BaseModel):
    thucdon_id: str
    tonthucte: int | None = Field(default=None, ge=0)
    lydo: str | None = None


class ShiftLinesIn(BaseModel):
    lines: list[ShiftLineIn]


class ShiftCloseIn(ShiftLinesIn):
    manager_pin: str = Field(min_length=1, description="PIN của tài khoản QUAN_LY (AC5)")
