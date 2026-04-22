from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class PlanilhaAcidenteViatura(Base):
    __tablename__ = "planilha_acidente_viatura"
    __table_args__ = {"schema": "estatistica"}

    id = Column(Integer, primary_key=True, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    portaria_sindicancia = Column(String(80), nullable=False)
    re_dc = Column(String(30), nullable=False, index=True)
    policial_nome = Column(String(160), nullable=True)
    posto_graduacao = Column(String(80), nullable=True)
    re_enc = Column(String(30), nullable=True)
    data_hora_fato = Column(String(30), nullable=True)
    rodovia_sp = Column(String(60), nullable=True)
    km = Column(String(30), nullable=True)
    quantidade_policial_militar = Column(Integer, nullable=False, default=0)
    quantidade_civil = Column(Integer, nullable=False, default=0)
    observacao = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    police_officer = relationship("PoliceOfficer")
    created_by_user = relationship("User")
