from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


def _connect_args(url: str) -> dict:
    # Supabase Transaction pooler (cổng 6543) không hỗ trợ prepared statement của asyncpg.
    # Session pooler (cổng 5432) — cấu hình khuyến nghị trong backend/.env.example — không cần.
    return {"statement_cache_size": 0} if ":6543/" in url else {}


engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_pre_ping=True,  # kết nối cloud có thể bị pooler đóng khi rảnh
    connect_args=_connect_args(settings.async_database_url),
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
