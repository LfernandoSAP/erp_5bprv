from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class ItemStatus(str, Enum):
    EM_USO = "EM_USO"
    EM_ESTOQUE = "EM_ESTOQUE"
    MANUTENCAO = "MANUTENCAO"
    BAIXADO = "BAIXADO"


class ItemBase(BaseModel):
    name: str
    modelo: Optional[str] = None
    unit_id: Optional[int] = None
    sector_id: Optional[int] = None
    custody_type: str = "RESERVA_UNIDADE"
    custody_sector_id: Optional[int] = None
    police_officer_id: Optional[int] = None
    fleet_vehicle_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    asset_tag: Optional[str] = None
    detentor: Optional[str] = None
    detentor_outros: Optional[str] = None
    status: ItemStatus = ItemStatus.EM_USO
    value: float = 0
    location: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("detentor", "detentor_outros", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_detentor_outros(self):
        if self.detentor == "OUTROS" and not self.detentor_outros:
            raise ValueError("Informe o detentor quando selecionar OUTROS")
        return self


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    modelo: Optional[str] = None
    unit_id: Optional[int] = None
    sector_id: Optional[int] = None
    custody_type: Optional[str] = None
    custody_sector_id: Optional[int] = None
    police_officer_id: Optional[int] = None
    fleet_vehicle_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    asset_tag: Optional[str] = None
    detentor: Optional[str] = None
    detentor_outros: Optional[str] = None
    status: Optional[ItemStatus] = None
    value: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("detentor", "detentor_outros", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_detentor_outros(self):
        if self.detentor == "OUTROS" and not self.detentor_outros:
            raise ValueError("Informe o detentor quando selecionar OUTROS")
        return self


class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_id: int
    unit_label: Optional[str] = None
    sector_id: Optional[int] = None
    custody_type: str
    custody_sector_id: Optional[int] = None
    custody_sector_name: Optional[str] = None
    police_officer_id: Optional[int] = None
    police_officer_re: Optional[str] = None
    police_officer_name: Optional[str] = None
    fleet_vehicle_id: Optional[int] = None
    fleet_vehicle_label: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
