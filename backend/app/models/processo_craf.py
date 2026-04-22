from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ProcessoCraf(Base):
    __tablename__ = "processos_craf"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)

    tipo_craf = Column(String(20), nullable=False, index=True)
    re_dc = Column(String(30), nullable=False, index=True)
    posto_graduacao = Column(String(80), nullable=True)
    nome = Column(String(200), nullable=False, index=True)
    data_entrada = Column(String(20), nullable=True, index=True)
    parte = Column(String(80), nullable=True, index=True)
    pm_l80 = Column(String(40), nullable=True, index=True)
    nbi = Column(String(40), nullable=True, index=True)
    bol_int_res = Column(String(40), nullable=True, index=True)
    xerox_doc = Column(String(40), nullable=True, index=True)
    sigma = Column(String(80), nullable=True, index=True)
    bo = Column(String(120), nullable=True, index=True)
    msg_cmb = Column(String(180), nullable=True)
    data_processo = Column(String(20), nullable=True, index=True)
    observacao = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
