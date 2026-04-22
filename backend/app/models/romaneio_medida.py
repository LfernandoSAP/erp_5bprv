from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class RomaneioMedida(Base):
    __tablename__ = "romaneio_medidas"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    policial_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, unique=True, index=True)
    re = Column(String(30), nullable=False, unique=True, index=True)
    calca = Column(String(30), nullable=False)
    cinto_lona_tipo = Column(String(20), nullable=False)
    cinto_lona_medida = Column(String(10), nullable=False)
    fiel_retratil = Column(String(20), nullable=False)
    cinturao_preto_lado = Column(String(20), nullable=False)
    cinturao_preto_medida = Column(String(10), nullable=False)
    calcado = Column(String(20), nullable=False)
    colete_balistico = Column(String(40), nullable=False)
    calca_combat = Column(String(30), nullable=False)
    quepe = Column(String(20), nullable=False)
    boina = Column(String(20), nullable=False)
    camisa = Column(String(30), nullable=False)
    camisa_combat_manga_longa = Column(String(20), nullable=False)
    camiseta_gola_careca = Column(String(20), nullable=False)
    agasalho_blusa = Column(String(20), nullable=False)
    agasalho_calca = Column(String(30), nullable=False)
    meia = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    police_officer = relationship("PoliceOfficer")
