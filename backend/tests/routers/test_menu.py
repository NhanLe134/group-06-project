from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu_item import MenuItem


async def test_list_menu_items_empty(client: AsyncClient):
    """GIVEN chua co menu item nao, WHEN GET /menu, THEN tra ve list rong."""
    resp = await client.get("/menu")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_menu_items_returns_seeded_items(client: AsyncClient, db_session: AsyncSession):
    """GIVEN co 1 menu item trong DB, WHEN GET /menu, THEN tra ve dung item do."""
    db_session.add(MenuItem(name="Pho Bo", price=65000, status="available"))
    await db_session.commit()

    resp = await client.get("/menu")

    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "Pho Bo"
    assert body[0]["status"] == "available"


async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
