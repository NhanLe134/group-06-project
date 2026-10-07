from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.voice import VoiceInterpretIn, VoiceInterpretOut
from app.services.voice import interpret

router = APIRouter(prefix="/voice", tags=["voice"])
ai_router = APIRouter(prefix="/api/v1/ai", tags=["voice"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/interpret",
    response_model=VoiceInterpretOut,
    summary="Phân tích transcript gọi món",
    description=(
        "Nhận văn bản đã được chuyển từ giọng nói, đối chiếu menu trong database, "
        "trích xuất món/số lượng/ghi chú và cảnh báo dị ứng. Endpoint không nhận file âm thanh."
    ),
)
async def interpret_voice(body: VoiceInterpretIn, db: Db) -> VoiceInterpretOut:
    return await interpret(db, body)


@ai_router.post(
    "/voice-parse",
    response_model=VoiceInterpretOut,
    summary="Phân tích yêu cầu gọi món bằng AI",
    description=(
        "US-02: trích xuất món, số lượng và ghi chú từ transcript;"
        " đối chiếu giá/tồn kho với database."
        " Chỉ cập nhật Order Draft, không gửi đơn xuống KDS."
    ),
)
async def parse_voice_order(body: VoiceInterpretIn, db: Db) -> VoiceInterpretOut:
    return await interpret(db, body)
