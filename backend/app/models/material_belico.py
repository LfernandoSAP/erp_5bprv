from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy import Date
from sqlalchemy.orm import relationship

from app.db.database import Base


class MaterialBelico(Base):
    __tablename__ = "material_belico"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    custody_sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    police_officer_id = Column(
        Integer,
        ForeignKey("rh.police_officers.id"),
        nullable=True,
        index=True,
    )
    custody_type = Column(String(30), nullable=False, default="RESERVA_UNIDADE")

    ordem = Column(Integer, nullable=False)
    posto_grad = Column(String(100), nullable=False)
    re = Column(String(50), nullable=False)
    nome = Column(String(200), nullable=False)
    cia_em = Column(String(50), nullable=False)
    opm_atual = Column(String(50), nullable=False)

    armamento_num_serie = Column(String(100), nullable=True)
    armamento_patrimonio = Column(String(100), nullable=True)
    municao_lote = Column(String(100), nullable=True)

    algema_num_serie = Column(String(100), nullable=True)
    algema_patrimonio = Column(String(100), nullable=True)

    category = Column(String(100), nullable=False, index=True, default="")
    colete_num_serie = Column(String(100), nullable=True)
    colete_patrimonio = Column(String(100), nullable=True)
    item_name = Column(String(200), nullable=True)
    lot_number = Column(String(100), nullable=True)
    expiration_date = Column(Date, nullable=True)
    quantity = Column(Integer, nullable=True)
    item_brand = Column(String(100), nullable=True)
    item_model = Column(String(100), nullable=True)
    item_model_other = Column(String(150), nullable=True)
    item_type = Column(String(60), nullable=True)
    item_gender = Column(String(30), nullable=True)
    item_size = Column(String(40), nullable=True)
    item_holder = Column(String(60), nullable=True)
    item_holder_other = Column(String(150), nullable=True)
    cdc_material_type = Column(String(60), nullable=True)
    cdc_exoskeleton_size = Column(String(10), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    custody_sector = relationship("Sector", foreign_keys=[custody_sector_id])
    police_officer = relationship("PoliceOfficer")

    @property
    def unit_label(self) -> str | None:
        return self.unit.display_name if self.unit else None

    @property
    def assigned_officer_re(self) -> str | None:
        return self.police_officer.re_with_digit if self.police_officer else None

    @property
    def assigned_officer_name(self) -> str | None:
        return self.police_officer.full_name if self.police_officer else None

    @property
    def custody_sector_name(self) -> str | None:
        return self.custody_sector.name if self.custody_sector else None
