from typing import Literal

from pydantic import BaseModel, Field, field_validator


class VoiceDraftLine(BaseModel):
    item_id: str
    quantity: int = Field(ge=1)
    note: str = ""


class VoicePendingDraftRemoval(BaseModel):
    item_id: str
    allergen: str


class VoiceDraftChange(BaseModel):
    item_id: str
    quantity: int = Field(ge=0, description="Tổng số lượng mới trong giỏ nháp")


class VoiceDraftNoteUpdate(BaseModel):
    item_id: str
    note: str


class VoiceNeedsQuantity(BaseModel):
    """Khi backend cần hỏi lại số lượng trước khi thêm món."""
    item_id: str
    item_name: str


class VoiceInterpretIn(BaseModel):
    """Văn bản transcript do Web Speech API hoặc client STT gửi lên."""

    transcript: str = Field(
        min_length=1, max_length=2000, description="Nội dung khách vừa nói"
    )
    draft: list[VoiceDraftLine] = Field(
        default_factory=list, description="Số lượng món hiện có trong Order Draft"
    )
    pending_draft_removal: VoicePendingDraftRemoval | None = Field(
        default=None, description="Xác nhận dị ứng đang chờ trả lời"
    )
    last_added_item_id: str | None = Field(
        default=None,
        description="ID của món vừa được thêm ở lượt trước — dùng để gán ghi chú bổ sung",
    )
    table_name: str | None = Field(
        default=None, max_length=80, description="Tên bàn để gắn phiên gọi món"
    )

    @field_validator("transcript")
    @classmethod
    def transcript_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Transcript không được để trống.")
        return value


class VoiceAdd(BaseModel):
    id: str
    name: str
    qty: int = Field(ge=1)
    note: str = ""
    price: int


class VoiceAmbiguity(BaseModel):
    qty: int
    candidates: list[str]
    segment: str


class VoiceOos(BaseModel):
    id: str
    qty: int
    suggestions: list[str] = Field(default_factory=list)


class VoiceStockLimit(BaseModel):
    item_id: str
    item_name: str
    requested: int
    available: int


class VoiceWarning(BaseModel):
    code: Literal["ALLERGY_WARNING"] = "ALLERGY_WARNING"
    item_id: str
    item_name: str
    allergen: str
    message: str


class VoiceRecommendation(BaseModel):
    id: str
    name: str
    price: int


class VoiceInterpretOut(BaseModel):
    transcript: str
    intent: Literal[
        "order", "recommendation", "suggestion", "ingredient_search", "finish", "unknown"
    ]
    adds: list[VoiceAdd] = Field(default_factory=list)
    ambiguities: list[VoiceAmbiguity] = Field(default_factory=list)
    oos: list[VoiceOos] = Field(default_factory=list)
    stock_limits: list[VoiceStockLimit] = Field(default_factory=list)
    not_found: list[str] = Field(default_factory=list)
    warnings: list[VoiceWarning] = Field(default_factory=list)
    pending_draft_removal: VoicePendingDraftRemoval | None = None
    needs_quantity_for: VoiceNeedsQuantity | None = Field(
        default=None,
        description="Khi set, AI hỏi lại số lượng cho món này trước khi thêm vào giỏ",
    )
    remove_from_draft: list[str] = Field(default_factory=list)
    draft_changes: list[VoiceDraftChange] = Field(default_factory=list)
    draft_note_updates: list[VoiceDraftNoteUpdate] = Field(default_factory=list)
    recommendations: list[VoiceRecommendation] = Field(default_factory=list)
    suggestions: list[VoiceRecommendation] = Field(default_factory=list)
    done: bool = False
    message: str
