from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class EapModulo(Base):
    __tablename__ = "eap_modulos"
    __table_args__ = {"schema": "estatistica"}

    id = Column(Integer, primary_key=True, index=True)
    modulo = Column(String(20), nullable=False, index=True)
    tipo = Column(String(40), nullable=False, default="Cb/Sd")
    local = Column(String(120), nullable=False)
    periodo_ead_inicio = Column(Date, nullable=True)
    periodo_ead_fim = Column(Date, nullable=True)
    periodo_presencial_inicio = Column(Date, nullable=True)
    periodo_presencial_fim = Column(Date, nullable=True)
    outros = Column(Text, nullable=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unit = relationship("Unit")
    created_by_user = relationship("User")
    participantes = relationship(
        "EapModuloParticipante",
        back_populates="modulo_rel",
        cascade="all, delete-orphan",
        order_by="EapModuloParticipante.policial_nome.asc()",
    )
