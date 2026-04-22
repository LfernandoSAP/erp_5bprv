from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.police_officer import PoliceOfficer  # noqa: F401
from app.models.sector import Sector  # noqa: F401
from app.models.unit import Unit  # noqa: F401
from app.models.user import User  # noqa: F401


class CopMovement(Base):
    __tablename__ = "cop_movements"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    cop_id = Column(Integer, ForeignKey("logistica.cops.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movement_type = Column(String(40), nullable=False, index=True)
    from_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    to_police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)
    movement_date = Column(String(20), nullable=True)
    observation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    cop = relationship("Cop", back_populates="movements")
    user = relationship("User")
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    to_sector = relationship("Sector", foreign_keys=[to_sector_id])
    to_police_officer = relationship("PoliceOfficer", foreign_keys=[to_police_officer_id])

    @property
    def from_unit_label(self) -> str | None:
        return self.from_unit.display_name if self.from_unit else None

    @property
    def to_unit_label(self) -> str | None:
        return self.to_unit.display_name if self.to_unit else None

    @property
    def to_sector_label(self) -> str | None:
        return self.to_sector.name if self.to_sector else None

    @property
    def to_police_officer_re(self) -> str | None:
        return self.to_police_officer.re_with_digit if self.to_police_officer else None

    @property
    def to_police_officer_name(self) -> str | None:
        if not self.to_police_officer:
            return None
        return self.to_police_officer.war_name or self.to_police_officer.full_name
