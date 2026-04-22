from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ProcessoApaf(Base):
    __tablename__ = "processos_apaf"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)

    re_dc = Column(String(30), nullable=False, index=True)
    posto_graduacao = Column(String(80), nullable=True)
    nome = Column(String(200), nullable=False, index=True)
    cia_entregou = Column(String(160), nullable=True, index=True)
    data_entrada = Column(String(20), nullable=True, index=True)
    parte = Column(String(80), nullable=True, index=True)
    sigma = Column(String(80), nullable=True, index=True)
    data_cadastro = Column(String(20), nullable=True, index=True)
    solic_consulta_pi = Column(String(40), nullable=True, index=True)
    sei = Column(String(120), nullable=True, index=True)
    envio_cprv_link = Column(Text, nullable=True)
    cert_1 = Column(String(40), nullable=True, index=True)
    cert_2 = Column(String(40), nullable=True, index=True)
    cert_3 = Column(String(40), nullable=True, index=True)
    rg = Column(String(30), nullable=True)
    cpf = Column(String(20), nullable=True)
    comp_residencia = Column(String(40), nullable=True, index=True)
    boletim_geral = Column(String(80), nullable=True, index=True)
    apafi = Column(String(80), nullable=True, index=True)
    data_entrega = Column(String(20), nullable=True, index=True)
    observacao = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
