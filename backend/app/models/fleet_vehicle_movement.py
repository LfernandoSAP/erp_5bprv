from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class FleetVehicleMovement(Base):
    __tablename__ = "fleet_vehicle_movements"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    fleet_vehicle_id = Column(
        Integer,
        ForeignKey("logistica.fleet_vehicles.id"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movement_type = Column(String(30), nullable=False)
    from_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    from_police_officer_id = Column(
        Integer,
        ForeignKey("rh.police_officers.id"),
        nullable=True,
        index=True,
    )
    to_police_officer_id = Column(
        Integer,
        ForeignKey("rh.police_officers.id"),
        nullable=True,
        index=True,
    )
    details = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    fleet_vehicle = relationship("FleetVehicle")
    user = relationship("User")
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    from_police_officer = relationship(
        "PoliceOfficer",
        foreign_keys=[from_police_officer_id],
    )
    to_police_officer = relationship(
        "PoliceOfficer",
        foreign_keys=[to_police_officer_id],
    )

    @property
    def item_name(self) -> str | None:
        if not self.fleet_vehicle:
            return None
        return f"{self.fleet_vehicle.brand} {self.fleet_vehicle.model}".strip()

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
    def from_officer_re(self) -> str | None:
        if not self.from_police_officer:
            return None
        return self.from_police_officer.re_with_digit

    @property
    def to_officer_re(self) -> str | None:
        if not self.to_police_officer:
            return None
        return self.to_police_officer.re_with_digit

    @property
    def from_officer_name(self) -> str | None:
        if not self.from_police_officer:
            return None
        return self.from_police_officer.full_name

    @property
    def to_officer_name(self) -> str | None:
        if not self.to_police_officer:
            return None
        return self.to_police_officer.full_name
