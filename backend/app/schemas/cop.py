from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CopBase(BaseModel):
    unit_id: int
    name: str = Field(min_length=1)
    model: str = Field(min_length=1)
    serial_number: str | None = None
    patrimony: str | None = None
    responsibility_type: str | None = None
    material_sector_id: int | None = None
    responsible_sector_id: int | None = None
    police_officer_id: int | None = None
    fleet_vehicle_id: int | None = None
    holder: str | None = None
    holder_concessionaria: str | None = None
    status: str = "Ativo"
    location: str | None = None
    notes: str | None = None


class CopCreate(CopBase):
    pass


class CopUpdate(BaseModel):
    unit_id: int | None = None
    name: str | None = None
    model: str | None = None
    serial_number: str | None = None
    patrimony: str | None = None
    responsibility_type: str | None = None
    material_sector_id: int | None = None
    responsible_sector_id: int | None = None
    police_officer_id: int | None = None
    fleet_vehicle_id: int | None = None
    holder: str | None = None
    holder_concessionaria: str | None = None
    status: str | None = None
    location: str | None = None
    notes: str | None = None


class CopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_id: int
    unit_label: str | None = None
    name: str
    model: str
    serial_number: str | None = None
    patrimony: str | None = None
    responsibility_type: str | None = None
    material_sector_id: int | None = None
    material_sector_label: str | None = None
    responsible_sector_id: int | None = None
    responsible_sector_label: str | None = None
    police_officer_id: int | None = None
    police_officer_re: str | None = None
    police_officer_name: str | None = None
    police_officer_rank: str | None = None
    fleet_vehicle_id: int | None = None
    fleet_vehicle_prefix: str | None = None
    fleet_vehicle_plate: str | None = None
    fleet_vehicle_model: str | None = None
    holder: str | None = None
    holder_concessionaria: str | None = None
    holder_display: str | None = None
    status: str
    location: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CopMovementCreate(BaseModel):
    to_unit_id: int | None = None
    to_sector_id: int | None = None
    to_police_officer_id: int | None = None
    movement_type: str
    movement_date: str | None = None
    observation: str | None = None


class CopMovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cop_id: int
    user_id: int
    movement_type: str
    from_unit_id: int | None = None
    from_unit_label: str | None = None
    to_unit_id: int | None = None
    to_unit_label: str | None = None
    to_sector_id: int | None = None
    to_sector_label: str | None = None
    to_police_officer_id: int | None = None
    to_police_officer_re: str | None = None
    to_police_officer_name: str | None = None
    movement_date: str | None = None
    observation: str | None = None
    created_at: datetime
