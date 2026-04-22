from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ItemMovementBase(BaseModel):
    item_id: int
    movement_type: str
    from_unit_id: int | None = None
    from_sector_id: int | None = None
    from_custody_type: str | None = None
    from_custody_sector_id: int | None = None
    from_police_officer_id: int | None = None
    from_fleet_vehicle_id: int | None = None
    to_unit_id: int | None = None
    to_sector_id: int | None = None
    to_custody_type: str | None = None
    to_custody_sector_id: int | None = None
    to_police_officer_id: int | None = None
    to_fleet_vehicle_id: int | None = None
    from_location: str | None = None
    to_location: str | None = None
    details: str | None = None


class ItemMovementCreate(ItemMovementBase):
    pass


class ItemMovementOut(ItemMovementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    item_name: str | None = None
    user_name: str | None = None
    from_unit_label: str | None = None
    to_unit_label: str | None = None
    from_sector_name: str | None = None
    to_sector_name: str | None = None
    from_custody_sector_name: str | None = None
    to_custody_sector_name: str | None = None
    from_police_officer_re: str | None = None
    to_police_officer_re: str | None = None
    from_police_officer_name: str | None = None
    to_police_officer_name: str | None = None
    from_fleet_vehicle_label: str | None = None
    to_fleet_vehicle_label: str | None = None
