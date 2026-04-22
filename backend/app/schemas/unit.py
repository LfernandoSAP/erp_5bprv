from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, model_validator


class UnitCreate(BaseModel):
    name: str
    code: str | None = None
    codigo_opm: str | None = None
    type: str | None = None
    parent_unit_id: int | None = None
    parent_id: int | None = None
    can_view_all: bool = False
    is_active: bool = True

    @model_validator(mode="after")
    def sync_parent_fields(self):
        if self.parent_unit_id is None and self.parent_id is not None:
            self.parent_unit_id = self.parent_id
        if self.parent_id is None and self.parent_unit_id is not None:
            self.parent_id = self.parent_unit_id
        return self


class UnitUpdate(BaseModel):
    codigo_opm: str | None = None
    can_view_all: bool | None = None
    is_active: bool | None = None


class UnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None = None
    codigo_opm: str | None = None
    type: str | None = None
    parent_unit_id: int | None = None
    parent_id: int | None = None
    can_view_all: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None


class UnitTree(UnitOut):
    children: List["UnitTree"] = []


UnitTree.model_rebuild()
