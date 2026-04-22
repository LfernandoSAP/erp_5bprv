from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SectorBase(BaseModel):
    unit_id: int
    name: str
    code: str | None = None
    is_active: bool = True


class SectorCreate(SectorBase):
    pass


class SectorUpdate(BaseModel):
    unit_id: int | None = None
    name: str | None = None
    code: str | None = None
    is_active: bool | None = None


class SectorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_id: int
    name: str
    code: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None
