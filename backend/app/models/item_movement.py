from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ItemMovement(Base):
    __tablename__ = "item_movements"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)

    item_id = Column(Integer, ForeignKey("logistica.items.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    movement_type = Column(String(30), nullable=False)
    from_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    from_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    from_custody_type = Column(String(30), nullable=True)
    from_custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    from_police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    from_fleet_vehicle_id = Column(Integer, ForeignKey("logistica.fleet_vehicles.id"), nullable=True, index=True)
    to_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    to_custody_type = Column(String(30), nullable=True)
    to_custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    to_police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    to_fleet_vehicle_id = Column(Integer, ForeignKey("logistica.fleet_vehicles.id"), nullable=True, index=True)
    from_location = Column(String(200), nullable=True)
    to_location = Column(String(200), nullable=True)
    details = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("Item")
    user = relationship("User")
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    from_sector = relationship("Sector", foreign_keys=[from_sector_id])
    to_sector = relationship("Sector", foreign_keys=[to_sector_id])
    from_custody_sector = relationship("Sector", foreign_keys=[from_custody_sector_id])
    to_custody_sector = relationship("Sector", foreign_keys=[to_custody_sector_id])
    from_police_officer = relationship("PoliceOfficer", foreign_keys=[from_police_officer_id])
    to_police_officer = relationship("PoliceOfficer", foreign_keys=[to_police_officer_id])
    from_fleet_vehicle = relationship("FleetVehicle", foreign_keys=[from_fleet_vehicle_id])
    to_fleet_vehicle = relationship("FleetVehicle", foreign_keys=[to_fleet_vehicle_id])

    @property
    def item_name(self) -> str | None:
        return self.item.name if self.item else None

    @property
    def user_name(self) -> str | None:
        return self.user.name if self.user else None

    @property
    def from_unit_label(self) -> str | None:
        return self.from_unit.display_name if self.from_unit else None

    @property
    def to_unit_label(self) -> str | None:
        return self.to_unit.display_name if self.to_unit else None

    @property
    def from_sector_name(self) -> str | None:
        return self.from_sector.name if self.from_sector else None

    @property
    def to_sector_name(self) -> str | None:
        return self.to_sector.name if self.to_sector else None

    @property
    def from_custody_sector_name(self) -> str | None:
        return self.from_custody_sector.name if self.from_custody_sector else None

    @property
    def to_custody_sector_name(self) -> str | None:
        return self.to_custody_sector.name if self.to_custody_sector else None

    @property
    def from_police_officer_re(self) -> str | None:
        return self.from_police_officer.re_with_digit if self.from_police_officer else None

    @property
    def to_police_officer_re(self) -> str | None:
        return self.to_police_officer.re_with_digit if self.to_police_officer else None

    @property
    def from_police_officer_name(self) -> str | None:
        return self.from_police_officer.war_name if self.from_police_officer else None

    @property
    def to_police_officer_name(self) -> str | None:
        return self.to_police_officer.war_name if self.to_police_officer else None

    @property
    def from_fleet_vehicle_label(self) -> str | None:
        if not self.from_fleet_vehicle:
            return None
        if self.from_fleet_vehicle.prefix:
            return self.from_fleet_vehicle.prefix
        if self.from_fleet_vehicle.plate:
            return self.from_fleet_vehicle.plate
        return "Viatura sem identificação"

    @property
    def to_fleet_vehicle_label(self) -> str | None:
        if not self.to_fleet_vehicle:
            return None
        if self.to_fleet_vehicle.prefix:
            return self.to_fleet_vehicle.prefix
        if self.to_fleet_vehicle.plate:
            return self.to_fleet_vehicle.plate
        return "Viatura sem identificação"
