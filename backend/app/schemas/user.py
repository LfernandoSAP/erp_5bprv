from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.security import validate_password_strength
from app.shared.utils.cpf import is_valid_cpf_length, normalize_cpf


class UserBase(BaseModel):
    cpf: str
    name: str
    re: str | None = None
    rank: str | None = None
    unit_id: int
    sector_id: int | None = None
    module_access_codes: list[str] = []
    role_code: str | None = None
    is_admin: bool = False
    is_active: bool = True

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str) -> str:
        normalized = normalize_cpf(value)
        if not is_valid_cpf_length(normalized):
            raise ValueError("CPF deve conter exatamente 11 dígitos.")
        return normalized


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        validate_password_strength(value)
        return value


class UserUpdate(BaseModel):
    name: str | None = None
    re: str | None = None
    rank: str | None = None
    unit_id: int | None = None
    sector_id: int | None = None
    module_access_codes: list[str] | None = None
    role_code: str | None = None
    password: str | None = None
    is_admin: bool | None = None
    is_active: bool | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str | None) -> str | None:
        if value:
            validate_password_strength(value)
        return value


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cpf: str
    name: str
    re: str | None = None
    rank: str | None = None
    unit_id: int
    sector_id: int | None = None
    module_access_codes: list[str] = []
    role_code: str | None = None
    is_admin: bool
    is_active: bool
    require_password_change: bool = False
    created_at: datetime
    updated_at: datetime | None = None
