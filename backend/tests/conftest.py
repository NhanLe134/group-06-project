from collections.abc import AsyncGenerator
from itertools import count

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base, get_db
from app.main import app

# Trên Supabase, id dạng mã (MON001, HD-20261006-0001...) do database tự sinh bằng sequence
# (migration 007). SQLite dùng trong test không có sequence → giả lập mã tương tự ở đây.
ID_PREFIX = {
    "nguoidung": "NV",
    "thucdon": "MON",
    "tonkho": "NL",
    "congthuc": "CT",
    "phienban": "PB",
    "hoadon": "HD",
    "chitietmon": "CTM",
    "loghuymon": "HM",
    "loggiongnoi": "GN",
    "phieukiemke": "PKK",
    "chitietkiemke": "CTKK",
}
_id_counter = count(1)


@event.listens_for(Base, "before_insert", propagate=True)
def _fake_db_generated_id(mapper, connection, target) -> None:
    if getattr(target, "id", None) is None:
        target.id = f"{ID_PREFIX[mapper.local_table.name]}-TEST-{next(_id_counter):04d}"


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
