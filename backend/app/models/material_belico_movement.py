from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class MaterialBelicoMovement(Base):
    __tablename__ = "material_belico_movements"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    material_belico_id = Column(
        Integer,
        ForeignKey("logistica.material_belico.id"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movement_type = Column(String(30), nullable=False)
    from_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    to_unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    from_custody_type = Column(String(30), nullable=True)
    to_custody_type = Column(String(30), nullable=True)
    from_custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    to_custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
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
    quantity_transferred = Column(Integer, nullable=True)
    details = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    material_belico = relationship("MaterialBelico")
    user = relationship("User")
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    from_custody_sector = relationship("Sector", foreign_keys=[from_custody_sector_id])
    to_custody_sector = relationship("Sector", foreign_keys=[to_custody_sector_id])
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
        return self.material_belico.category if self.material_belico else None

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
        return self.from_police_officer.war_name or self.from_police_officer.full_name

    @property
    def to_officer_name(self) -> str | None:
        if not self.to_police_officer:
            return None
        return self.to_police_officer.war_name or self.to_police_officer.full_name

    @property
    def from_custody_sector_name(self) -> str | None:
        return self.from_custody_sector.name if self.from_custody_sector else None

    @property
    def to_custody_sector_name(self) -> str | None:
        return self.to_custody_sector.name if self.to_custody_sector else None
