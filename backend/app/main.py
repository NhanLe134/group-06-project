from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.db import Base, async_session_factory, engine
from app.models.menu_item import MenuItem
from app.routers import menu

SEED_MENU_ITEMS = [
    {
        "name": "Pho Bo",
        "description": "Pho bo truyen thong",
        "price": 65000,
        "category": "Mon chinh",
        "status": "available",
    },
    {
        "name": "Bo Luc Lac",
        "description": "Bo xao tieu den",
        "price": 89000,
        "category": "Mon chinh",
        "status": "available",
    },
    {
        "name": "Pepsi",
        "description": "Nuoc ngot lon 330ml",
        "price": 15000,
        "category": "Do uong",
        "status": "available",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as session:
        existing = await session.execute(select(MenuItem.id).limit(1))
        if existing.first() is None:
            session.add_all(MenuItem(**item) for item in SEED_MENU_ITEMS)
            await session.commit()
    yield


app = FastAPI(title="Restaurant Smart Ordering API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
