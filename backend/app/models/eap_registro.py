from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class EapRegistro(Base):
    __tablename__ = "eap_registros"
    __table_args__ = {"schema": "estatistica"}

    id = Column(Integer, primary_key=True, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    re_dc = Column(String(30), nullable=False, index=True)
    policial_nome = Column(String(160), nullable=True)
    posto_graduacao = Column(String(80), nullable=True)
    modulo = Column(String(20), nullable=False, index=True)
    local = Column(String(120), nullable=False)
    periodo_ead_inicio = Column(Date, nullable=True)
    periodo_ead_fim = Column(Date, nullable=True)
    periodo_presencial_inicio = Column(Date, nullable=True)
    periodo_presencial_fim = Column(Date, nullable=True)
    outros = Column(Text, nullable=True)
    unidade_policial = Column(String(120), nullable=True)
    unidade_policial_manual = Column(String(160), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    police_officer = relationship("PoliceOfficer")
    created_by_user = relationship("User")
