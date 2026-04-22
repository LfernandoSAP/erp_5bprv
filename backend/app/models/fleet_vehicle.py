from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class FleetVehicle(Base):
    __tablename__ = "fleet_vehicles"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)

    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    category = Column(String(50), nullable=False, default="VIATURA_04_RODAS", index=True)
    brand = Column(String(120), nullable=False, index=True)
    model = Column(String(120), nullable=False, index=True)
    year = Column(String(4), nullable=False, index=True)
    prefix = Column(String(80), nullable=False, index=True)
    group_code = Column(String(80), nullable=True, index=True)
    telemetry = Column(String(10), nullable=True, index=True)
    wheel_count = Column(String(10), nullable=True)
    holder = Column(String(160), nullable=False, index=True)
    patrimony = Column(String(80), nullable=True, index=True)
    rental_company = Column(String(160), nullable=True)
    contract_number = Column(String(80), nullable=True)
    contract_start = Column(String(20), nullable=True)
    contract_end = Column(String(20), nullable=True)
    contract_term = Column(String(80), nullable=True)
    licensing = Column(String(20), nullable=True)
    plate = Column(String(20), nullable=True, index=True)
    fuel_type = Column(String(60), nullable=True)
    current_mileage = Column(String(20), nullable=True)
    current_mileage_date = Column(String(20), nullable=True)
    last_review_date = Column(String(20), nullable=True)
    last_review_mileage = Column(String(20), nullable=True)
    situation = Column(String(120), nullable=True, index=True)
    employment = Column(String(80), nullable=True, index=True)
    renavam = Column(String(40), nullable=True, index=True)
    chassis = Column(String(80), nullable=True, index=True)
    color = Column(String(60), nullable=True)
    manufacture_year = Column(String(4), nullable=True)
    model_year = Column(String(4), nullable=True)
    fixed_driver = Column(String(160), nullable=True)
    notes = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
