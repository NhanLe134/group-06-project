import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_dashboard_stats_endpoint(client: AsyncClient, db_session: AsyncSession):
    response = await client.get("/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "today_revenue" in data
    assert "today_orders" in data
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "occupancy" in data
    assert "top_dishes" in data
    assert "hourly_stats" in data
    assert isinstance(data["top_dishes"], list)
    assert isinstance(data["hourly_stats"], list)
    assert "rate" in data["occupancy"]


@pytest.mark.asyncio
async def test_dashboard_stats_api_alias(client: AsyncClient, db_session: AsyncSession):
    response = await client.get("/api/dashboard/stats")
    assert response.status_code == 200
