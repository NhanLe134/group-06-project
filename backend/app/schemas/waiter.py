from pydantic import BaseModel, ConfigDict


class WaiterItemOut(BaseModel):
    id: str
    name: str
    qty: int
    status: str
    statusText: str
    price: str
    isDrink: bool

    model_config = ConfigDict(from_attributes=True)


class WaiterTableOut(BaseModel):
    id: str
    name: str
    status: str
    pax: int
    capacity: int
    time: str
    zone: str | None = None
    items: list[WaiterItemOut]

    model_config = ConfigDict(from_attributes=True)


class ManagerAuthIn(BaseModel):
    pin: str | None = None
    new_quantity: int = 0
