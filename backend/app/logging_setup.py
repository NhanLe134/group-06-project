"""Cấu hình log cho backend (giáo trình §12 bước 4 — structured logging; Story Spec US-03 Mục 9).

Mỗi dòng log: `giờ mức module sự_kiện key=value ...` — dễ đọc trên console uvicorn / Render
và dễ lọc (vd. `grep "kds_status"`). Mức log: biến môi trường `LOG_LEVEL` (mặc định INFO).

Quy tắc: KHÔNG ghi secret, chuỗi kết nối DB, PIN hay ghi chú khách nhập — chỉ mã (id), tên bàn,
tên món, số lượng, trạng thái.
"""

import logging

_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"
_configured = False


def configure_logging(level: str = "INFO") -> None:
    """Gắn 1 handler ra console cho logger gốc `app` (gọi nhiều lần cũng chỉ cấu hình 1 lần)."""
    global _configured
    root = logging.getLogger("app")
    root.setLevel(level.upper())
    if _configured:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(_FORMAT))
    root.addHandler(handler)
    _configured = True


def kv(**fields: object) -> str:
    """Ghép `key=value` cho phần nội dung log; giá trị có khoảng trắng được đặt trong ngoặc kép."""
    parts = []
    for key, value in fields.items():
        text = str(value)
        parts.append(f'{key}="{text}"' if " " in text else f"{key}={text}")
    return " ".join(parts)
