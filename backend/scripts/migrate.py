"""Chạy các file SQL trong backend/db/migrations/ theo thứ tự tên file trên DATABASE_URL.

- Ghi lại file đã chạy vào bảng `schema_migrations`; lần sau chỉ chạy file mới.
  (001–006 viết kiểu chạy lại được nên lần đầu có bảng này chúng chạy lại vô hại.)
- Mỗi file chạy trọn trong 1 transaction: lỗi giữa chừng thì file đó không áp dụng gì.
- Cả file được gửi nguyên khối nên dùng được DO $$ ... $$, hàm, nhiều câu lệnh.

Cách chạy (trong thư mục backend):  uv run python -m scripts.migrate
"""

import asyncio
import sys
from pathlib import Path

from app.db import engine

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "db" / "migrations"

CREATE_TRACKING = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT now()
);
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
"""


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # terminal Windows mặc định cp1252
    async with engine.connect() as sa_conn:
        raw = (await sa_conn.get_raw_connection()).driver_connection  # asyncpg.Connection
        await raw.execute(CREATE_TRACKING)
        applied = {r["filename"] for r in await raw.fetch("SELECT filename FROM schema_migrations")}
        for f in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if f.name in applied:
                print(f"--  {f.name} (đã chạy)")
                continue
            async with raw.transaction():
                await raw.execute(f.read_text(encoding="utf-8"))
                await raw.execute("INSERT INTO schema_migrations (filename) VALUES ($1)", f.name)
            print(f"OK  {f.name}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
