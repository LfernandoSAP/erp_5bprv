from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class PoliceOfficerMovement(Base):
    __tablename__ = "police_officer_movements"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    police_officer_id = Column(
        Integer,
        ForeignKey("rh.police_officers.id"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    from_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    from_external_unit_name = Column(String(180), nullable=True)
    to_external_unit_name = Column(String(180), nullable=True)
    details = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    police_officer = relationship("PoliceOfficer")
    user = relationship("User")
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])

    @property
    def officer_name(self) -> str | None:
        if not self.police_officer:
            return None
        return self.police_officer.war_name or self.police_officer.full_name

    @property
    def user_name(self) -> str | None:
        return self.user.name if self.user else None

    @property
    def from_unit_label(self) -> str | None:
        if self.from_external_unit_name:
            return self.from_external_unit_name
        return self.from_unit.display_name if self.from_unit else None

    @property
    def to_unit_label(self) -> str | None:
        if self.to_external_unit_name:
            return self.to_external_unit_name
        return self.to_unit.display_name if self.to_unit else None
