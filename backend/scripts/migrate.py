"""Chạy các file SQL trong backend/db/migrations/ theo thứ tự tên file trên DATABASE_URL.

Mỗi migration phải viết để chạy lại nhiều lần không lỗi (IF NOT EXISTS...).
Cách chạy (trong thư mục backend):  uv run python -m scripts.migrate
"""

import asyncio
from pathlib import Path

from sqlalchemy import text

from app.db import engine

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "db" / "migrations"


def _statements(sql: str) -> list[str]:
    # Bỏ comment "--" rồi tách theo dấu ";" (migration của dự án không chứa ";" trong chuỗi)
    lines = [line.split("--", 1)[0] for line in sql.splitlines()]
    return [s.strip() for s in "\n".join(lines).split(";") if s.strip()]


async def main() -> None:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    async with engine.begin() as conn:  # 1 transaction: lỗi giữa chừng thì không áp dụng gì
        for f in files:
            for stmt in _statements(f.read_text(encoding="utf-8")):
                await conn.execute(text(stmt))
            print(f"OK  {f.name}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
