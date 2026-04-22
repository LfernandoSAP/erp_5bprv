from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.modules.logistica.fleet_constants import (
    VALID_FLEET_GROUP_CODES,
    VALID_FLEET_TELEMETRY_OPTIONS,
)


class FleetVehicleBase(BaseModel):
    unit_id: int
    police_officer_id: int | None = None
    category: str = "VIATURA_04_RODAS"
    brand: str
    model: str
    year: str
    prefix: str
    group_code: str | None = None
    telemetry: str | None = None
    wheel_count: str | None = None
    holder: str
    patrimony: str | None = None
    rental_company: str | None = None
    contract_number: str | None = None
    contract_start: str | None = None
    contract_end: str | None = None
    contract_term: str | None = None
    licensing: str | None = None
    plate: str | None = None
    fuel_type: str | None = None
    current_mileage: str | None = None
    current_mileage_date: str | None = None
    last_review_date: str | None = None
    last_review_mileage: str | None = None
    situation: str | None = None
    employment: str | None = None
    renavam: str | None = None
    chassis: str | None = None
    color: str | None = None
    manufacture_year: str | None = None
    model_year: str | None = None
    fixed_driver: str | None = None
    notes: str | None = None
    is_active: bool = True

    @field_validator("brand", "model", "prefix", "holder")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise ValueError("Campo obrigatório.")
        return normalized

    @field_validator("year")
    @classmethod
    def validate_year(cls, value: str) -> str:
        normalized = (value or "").strip()
        if len(normalized) != 4 or not normalized.isdigit():
            raise ValueError("Ano deve conter 4 dígitos.")
        return normalized

    @field_validator("group_code")
    @classmethod
    def validate_group_code(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in VALID_FLEET_GROUP_CODES:
            raise ValueError("Grupo inválido.")
        return normalized

    @field_validator("telemetry")
    @classmethod
    def validate_telemetry(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in VALID_FLEET_TELEMETRY_OPTIONS:
            raise ValueError("Telemetria inválida.")
        return normalized


class FleetVehicleCreate(FleetVehicleBase):
    pass


class FleetVehicleUpdate(BaseModel):
    unit_id: int | None = None
    police_officer_id: int | None = None
    brand: str | None = None
    model: str | None = None
    year: str | None = None
    prefix: str | None = None
    group_code: str | None = None
    telemetry: str | None = None
    wheel_count: str | None = None
    holder: str | None = None
    patrimony: str | None = None
    rental_company: str | None = None
    contract_number: str | None = None
    contract_start: str | None = None
    contract_end: str | None = None
    contract_term: str | None = None
    licensing: str | None = None
    plate: str | None = None
    fuel_type: str | None = None
    current_mileage: str | None = None
    current_mileage_date: str | None = None
    last_review_date: str | None = None
    last_review_mileage: str | None = None
    situation: str | None = None
    employment: str | None = None
    renavam: str | None = None
    chassis: str | None = None
    color: str | None = None
    manufacture_year: str | None = None
    model_year: str | None = None
    fixed_driver: str | None = None
    notes: str | None = None
    is_active: bool | None = None

    @field_validator(
        "brand",
        "model",
        "prefix",
        "holder",
        "group_code",
        "telemetry",
        "wheel_count",
        "patrimony",
        "rental_company",
        "contract_number",
        "contract_start",
        "contract_end",
        "contract_term",
        "licensing",
        "plate",
        "fuel_type",
        "current_mileage",
        "current_mileage_date",
        "last_review_date",
        "last_review_mileage",
        "situation",
        "employment",
        "renavam",
        "chassis",
        "color",
        "manufacture_year",
        "model_year",
        "fixed_driver",
        "notes",
    )
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Campo obrigatório.")
        return normalized

    @field_validator("year")
    @classmethod
    def validate_optional_year(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if len(normalized) != 4 or not normalized.isdigit():
            raise ValueError("Ano deve conter 4 dígitos.")
        return normalized


class FleetVehicleOut(FleetVehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_name: str | None = None
    unit_label: str | None = None
    police_officer_re: str | None = None
    police_officer_name: str | None = None


class FleetVehicleMovementBase(BaseModel):
    movement_type: str
    to_unit_id: int | None = None
    to_police_officer_id: int | None = None
    details: str | None = None


class FleetVehicleMovementCreate(FleetVehicleMovementBase):
    pass


class FleetVehicleMovementOut(FleetVehicleMovementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fleet_vehicle_id: int
    user_id: int
    from_unit_id: int | None = None
    from_police_officer_id: int | None = None
    created_at: datetime
    item_name: str | None = None
    user_name: str | None = None
    from_unit_label: str | None = None
    to_unit_label: str | None = None
    from_officer_re: str | None = None
    to_officer_re: str | None = None
    from_officer_name: str | None = None
    to_officer_name: str | None = None

