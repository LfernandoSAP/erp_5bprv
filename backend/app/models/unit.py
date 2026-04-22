from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)

    # Legacy field kept temporarily for compatibility with the current database.
    parent_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True)

    # New hierarchical field. This becomes the canonical relationship field.
    parent_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    code = Column(String(50), nullable=True, index=True)
    codigo_opm = Column(String(50), nullable=True, index=True)
    # Canonical values: batalhao, cia, pelotao
    type = Column(String(30), nullable=True, index=True)
    can_view_all = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    parent_unit = relationship("Unit", remote_side=[id], foreign_keys=[parent_unit_id], backref="children")

    @property
    def effective_parent_unit_id(self) -> int | None:
        return self.parent_unit_id if self.parent_unit_id is not None else self.parent_id

    @property
    def display_name(self) -> str:
        if self.type == "pelotao" and self.parent_unit is not None:
            return f"{self.name} da {self.parent_unit.name}"
        return self.name
