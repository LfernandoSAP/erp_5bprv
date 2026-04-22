from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.cop_movement import CopMovement  # noqa: F401
from app.models.fleet_vehicle import FleetVehicle  # noqa: F401
from app.models.police_officer import PoliceOfficer  # noqa: F401
from app.models.sector import Sector  # noqa: F401
from app.models.unit import Unit  # noqa: F401


class Cop(Base):
    __tablename__ = "cops"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    name = Column(String(180), nullable=False, index=True)
    model = Column(String(180), nullable=False, index=True)
    serial_number = Column(String(120), nullable=True, index=True)
    patrimony = Column(String(120), nullable=True, index=True)
    responsibility_type = Column(String(40), nullable=True, index=True)
    material_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    responsible_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    fleet_vehicle_id = Column(Integer, ForeignKey("logistica.fleet_vehicles.id"), nullable=True, index=True)
    holder = Column(String(40), nullable=True, index=True)
    holder_concessionaria = Column(String(180), nullable=True)
    status = Column(String(40), nullable=False, default="Ativo", index=True)
    location = Column(String(240), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    material_sector = relationship("Sector", foreign_keys=[material_sector_id])
    responsible_sector = relationship("Sector", foreign_keys=[responsible_sector_id])
    police_officer = relationship("PoliceOfficer")
    fleet_vehicle = relationship("FleetVehicle")
    movements = relationship(
        "CopMovement",
        back_populates="cop",
        cascade="all, delete-orphan",
        order_by="CopMovement.created_at.desc()",
    )

    @property
    def unit_label(self) -> str | None:
        if self.unit:
            return self.unit.display_name
        return None

    @property
    def material_sector_label(self) -> str | None:
        return self.material_sector.name if self.material_sector else None

    @property
    def responsible_sector_label(self) -> str | None:
        return self.responsible_sector.name if self.responsible_sector else None

    @property
    def police_officer_re(self) -> str | None:
        return self.police_officer.re_with_digit if self.police_officer else None

    @property
    def police_officer_name(self) -> str | None:
        if not self.police_officer:
            return None
        return self.police_officer.war_name or self.police_officer.full_name

    @property
    def police_officer_rank(self) -> str | None:
        return self.police_officer.rank if self.police_officer else None

    @property
    def fleet_vehicle_prefix(self) -> str | None:
        return self.fleet_vehicle.prefix if self.fleet_vehicle else None

    @property
    def fleet_vehicle_plate(self) -> str | None:
        return self.fleet_vehicle.plate if self.fleet_vehicle else None

    @property
    def fleet_vehicle_model(self) -> str | None:
        if not self.fleet_vehicle:
            return None
        return self.fleet_vehicle.model

    @property
    def holder_display(self) -> str | None:
        if self.holder == "Concessionária" and self.holder_concessionaria:
            return self.holder_concessionaria
        return self.holder
