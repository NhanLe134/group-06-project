from pydantic import BaseModel, ConfigDict


class TopDishOut(BaseModel):
    name: str
    quantity: int
    revenue: int

    model_config = ConfigDict(from_attributes=True)


class HourlyStatOut(BaseModel):
    hour: str
    revenue: int
    height_percent: int

    model_config = ConfigDict(from_attributes=True)


class OccupancyOut(BaseModel):
    occupied_tables: int
    ready_tables: int
    cleaning_tables: int
    total_tables: int
    rate: float
    description: str

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsOut(BaseModel):
    today_revenue: int
    today_orders: int
    total_revenue: int
    total_orders: int
    occupancy: OccupancyOut
    top_dishes: list[TopDishOut]
    hourly_stats: list[HourlyStatOut]

    model_config = ConfigDict(from_attributes=True)
