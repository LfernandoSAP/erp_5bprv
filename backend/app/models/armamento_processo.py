from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ArmamentoProcesso(Base):
    __tablename__ = "armamento_processos"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)

    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)

    police_status = Column(String(20), nullable=False, index=True)
    re_dc = Column(String(20), nullable=True, index=True)
    rank = Column(String(80), nullable=True)
    full_name = Column(String(180), nullable=True, index=True)
    unit_name_snapshot = Column(String(160), nullable=True)

    entry_date = Column(String(20), nullable=False)
    caliber = Column(String(20), nullable=False, index=True)
    process_text = Column(Text, nullable=True)
    internal_bulletin = Column(String(160), nullable=True)
    observations = Column(Text, nullable=True)

    status = Column(String(40), nullable=False, index=True)
    cmb_sent_date = Column(String(20), nullable=True)
    result = Column(String(60), nullable=True)
    result_date = Column(String(20), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
