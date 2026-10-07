"""Nhật ký giọng nói — khớp bảng trên Supabase.

Xem ADR-ARCH-003, vault/06-Engineering/data-model.md Mục 5 và frontend/fe_ofc/dtb.md.
"""

from typing import Any

from sqlalchemy import JSON, FetchedValue, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LogGiongNoi(Base):
    """Transcript + ý định AI của 1 lượt nói (VOICE_TRANSCRIPTS).

    Bị xóa khi đóng phiên bàn (NFR-RO-02).
    """

    __tablename__ = "loggiongnoi"

    # Mã do database tự sinh (migration 007, ADR-ARCH-004), vd. MON001, HD-20261006-0001
    id: Mapped[str] = mapped_column(String(30), primary_key=True, server_default=FetchedValue())
    phienban_id: Mapped[str | None] = mapped_column(
        String(30), ForeignKey("phienban.id", ondelete="CASCADE"), default=None
    )
    vanbangoc: Mapped[str] = mapped_column(Text)
    # jsonb trên Postgres/Supabase; JSON thường khi test bằng SQLite in-memory
    ydinhai: Mapped[dict[str, Any] | None] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"), default=None
    )
