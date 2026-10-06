"""Nhật ký giọng nói — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

import uuid
from typing import Any

from sqlalchemy import JSON, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LogGiongNoi(Base):
    """Transcript + ý định AI của 1 lượt nói (VOICE_TRANSCRIPTS).

    Bị xóa khi đóng phiên bàn (NFR-RO-02).
    """

    __tablename__ = "loggiongnoi"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    phienban_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("phienban.id", ondelete="CASCADE"), default=None
    )
    vanbangoc: Mapped[str] = mapped_column(Text)
    # jsonb trên Postgres/Supabase; JSON thường khi test bằng SQLite in-memory
    ydinhai: Mapped[dict[str, Any] | None] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"), default=None
    )
