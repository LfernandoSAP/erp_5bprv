from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class TpdTalonario(Base):
    __tablename__ = "tpd_talonarios"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)

    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    fleet_vehicle_id = Column(Integer, ForeignKey("logistica.fleet_vehicles.id"), nullable=True, index=True)
    custody_type = Column(String(30), nullable=False, default="RESERVA_UNIDADE")

    name = Column(String(200), nullable=False, index=True)
    modelo = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    description = Column(String(500), nullable=True)
    serial_number = Column(String, unique=True, index=True)

    asset_tag = Column(String(120), nullable=True, index=True)
    detentor = Column(String(160), nullable=True, index=True)
    detentor_outros = Column(String(160), nullable=True)
    status = Column(String(30), nullable=False, default="EM_USO")
    value = Column(Numeric(12, 2), nullable=True)
    location = Column(String(200), nullable=True)
    notes = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    sector = relationship("Sector", foreign_keys=[sector_id])
    custody_sector = relationship("Sector", foreign_keys=[custody_sector_id])
    police_officer = relationship("PoliceOfficer")
    fleet_vehicle = relationship("FleetVehicle")

    @property
    def unit_label(self) -> str | None:
        return self.unit.display_name if self.unit else None

    @property
    def police_officer_re(self) -> str | None:
        return self.police_officer.re_with_digit if self.police_officer else None

    @property
    def police_officer_name(self) -> str | None:
        return self.police_officer.war_name if self.police_officer else None

    @property
    def custody_sector_name(self) -> str | None:
        return self.custody_sector.name if self.custody_sector else None

    @property
    def fleet_vehicle_label(self) -> str | None:
        if not self.fleet_vehicle:
            return None
        if self.fleet_vehicle.prefix:
            return self.fleet_vehicle.prefix
        if self.fleet_vehicle.plate:
            return self.fleet_vehicle.plate
        return "Viatura sem identificação"
