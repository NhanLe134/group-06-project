"""Nguyên liệu (`tonkho`) và công thức món (`congthuc`) — trừ kho tự động.

Spec: vault/06-Engineering/story-spec-tru-kho-tu-dong.md Mục 4.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers.menu import broadcast_flipped
from app.schemas.stock import IngredientIn, IngredientOut, IngredientUpdateIn, RecipeIn, RecipeOut
from app.services import stock as service

router = APIRouter(prefix="/inventory/ingredients", tags=["stock"])
recipe_router = APIRouter(prefix="/menu/items", tags=["stock"])
Db = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[IngredientOut])
async def list_ingredients(db: Db) -> list[IngredientOut]:
    """Danh sách nguyên liệu kèm tồn và các món đang dùng."""
    return await service.list_ingredients(db)


@router.post("", response_model=IngredientOut, status_code=201)
async def create_ingredient(body: IngredientIn, db: Db) -> IngredientOut:
    """Thêm nguyên liệu (mã NL001... do database tự sinh — ADR-ARCH-004)."""
    return await service.create_ingredient(db, body)


@router.put("/{ingredient_id}", response_model=IngredientOut)
async def update_ingredient(ingredient_id: str, body: IngredientUpdateIn, db: Db) -> IngredientOut:
    """Sửa tên/đơn vị hoặc nhập hàng (đặt tồn mới); món đổi còn/hết được phát realtime."""
    out, changed = await service.update_ingredient(db, ingredient_id, body)
    await broadcast_flipped(db, changed)
    return out


@router.delete("/{ingredient_id}", status_code=204)
async def delete_ingredient(ingredient_id: str, db: Db) -> Response:
    """Xóa nguyên liệu chưa nằm trong công thức món nào (409 INGREDIENT_IN_USE)."""
    await service.delete_ingredient(db, ingredient_id)
    return Response(status_code=204)


@recipe_router.get("/{item_id}/recipe", response_model=RecipeOut)
async def get_recipe(item_id: str, db: Db) -> RecipeOut:
    """Công thức (định lượng nguyên liệu cho 1 phần) của món."""
    return await service.get_recipe(db, item_id)


@recipe_router.put("/{item_id}/recipe", response_model=RecipeOut)
async def set_recipe(item_id: str, body: RecipeIn, db: Db) -> RecipeOut:
    """Thay toàn bộ công thức của món; danh sách rỗng = món không trừ nguyên liệu."""
    out, changed = await service.set_recipe(db, item_id, body)
    await broadcast_flipped(db, changed)
    return out
