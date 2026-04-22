from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class EapModuloParticipante(Base):
    __tablename__ = "eap_modulo_participantes"
    __table_args__ = (
        UniqueConstraint("modulo_id", "police_officer_id", name="uq_eap_modulo_participante"),
        {"schema": "estatistica"},
    )

    id = Column(Integer, primary_key=True, index=True)
    modulo_id = Column(Integer, ForeignKey("estatistica.eap_modulos.id", ondelete="CASCADE"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    re_dc = Column(String(30), nullable=False, index=True)
    policial_nome = Column(String(160), nullable=True)
    posto_graduacao = Column(String(80), nullable=True)
    unidade_policial = Column(String(160), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    modulo_rel = relationship("EapModulo", back_populates="participantes")
    police_officer = relationship("PoliceOfficer")
