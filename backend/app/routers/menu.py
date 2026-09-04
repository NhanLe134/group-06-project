from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.menu_item import MenuItem
from app.schemas.menu import MenuItemOut

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=list[MenuItemOut])
async def list_menu_items(db: Annotated[AsyncSession, Depends(get_db)]) -> list[MenuItem]:
    """US-01 (vault/04-User-Stories/user-stories.md): khach xem E-Menu."""
    result = await db.execute(select(MenuItem).order_by(MenuItem.category, MenuItem.name))
    return list(result.scalars().all())
