import logging
import time
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

import app.models  # noqa: F401 — đăng ký toàn bộ bảng vào Base.metadata
from app.config import settings
from app.db import Base, async_session_factory, engine, get_db
from app.errors import register_error_handlers
from app.logging_setup import configure_logging, kv
from app.models.menu import ThucDon
from app.models.user import NguoiDung
from app.routers import auth, ingredients, inventory, kds, menu, orders, sepay, voice, waiter
from app.ws import router as ws_router

SEED_MENU_ITEMS = [
    {"tenmon": "Phở bò tái lăn", "phanloai": "Món chính", "giaban": 65000, "trangthaiban": True},
    {"tenmon": "Bún chả Hà Nội", "phanloai": "Món chính", "giaban": 55000, "trangthaiban": True},
    {"tenmon": "Trà đá", "phanloai": "Đồ uống", "giaban": 5000, "trangthaiban": True},
]

SEED_USERS = [
    {
        "id": "NV001",
        "hoten": "Nhàn & Ny (Khách demo)",
        "vaitro": "KHACH",
        "tendangnhap": "customer",
        "matkhau": "Abcd@1234",
    },
    {
        "id": "NV002",
        "hoten": "Nhã (Bếp)",
        "vaitro": "BEP",
        "tendangnhap": "kitchen",
        "matkhau": "Abcd@1234",
    },
    {
        "id": "NV003",
        "hoten": "Trang (Phục vụ)",
        "vaitro": "PHUC_VU",
        "tendangnhap": "waiter",
        "matkhau": "Abcd@1234",
    },
    {
        "id": "NV004",
        "hoten": "Nhàn (Thu ngân)",
        "vaitro": "THU_NGAN",
        "tendangnhap": "cashier",
        "matkhau": "Abcd@1234",
    },
    {
        "id": "NV005",
        "hoten": "Trang & Ny & Nhã (Quản lý)",
        "vaitro": "QUAN_LY",
        "tendangnhap": "manager",
        "matkhau": "Abcd@1234",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Chỉ dành cho PostgreSQL local trống (Docker). Supabase dùng chung đã có schema sẵn
    # (ADR-ARCH-003) — không tự tạo bảng hay chèn dữ liệu mẫu vào database của cả nhóm.
    if settings.auto_create_schema:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with async_session_factory() as session:
            existing = await session.execute(select(ThucDon.id).limit(1))
            if existing.first() is None:
                session.add_all(ThucDon(**item) for item in SEED_MENU_ITEMS)
                await session.commit()

            existing_user = await session.execute(select(NguoiDung.id).limit(1))
            if existing_user.first() is None:
                session.add_all(NguoiDung(**user) for user in SEED_USERS)
                await session.commit()
    yield


configure_logging(settings.log_level)
http_log = logging.getLogger("app.http")

app = FastAPI(title="Restaurant Smart Ordering API", lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """1 dòng log mỗi request: phương thức, đường dẫn, mã trạng thái, thời gian xử lý (ms)."""
    started = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - started) * 1000)
    level = logging.WARNING if response.status_code >= 500 else logging.INFO
    http_log.log(
        level,
        "request %s",
        kv(
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            ms=ms,
        ),
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
app.include_router(menu.router)
app.include_router(menu.api_router)
app.include_router(kds.router)
app.include_router(inventory.router)
app.include_router(ingredients.router)
app.include_router(ingredients.recipe_router)
app.include_router(orders.router)
app.include_router(sepay.router)
app.include_router(voice.router)
app.include_router(voice.ai_router)
app.include_router(waiter.router)
app.include_router(ws_router.router)
app.include_router(auth.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
async def health_db(db: Annotated[AsyncSession, Depends(get_db)]):
    """Kiểm tra backend kết nối được database (Supabase hoặc local) — dùng cho smoke test."""
    try:
        await db.execute(text("SELECT 1"))
    except (SQLAlchemyError, OSError):
        return JSONResponse(status_code=503, content={"database": "unreachable"})
    return {"database": "ok"}
