from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class RanchoLancamento(Base):
    __tablename__ = "rancho_lancamentos"
    __table_args__ = (
        UniqueConstraint("participante_id", "data", name="uq_rancho_lancamento_participante_data"),
        {"schema": "logistica"},
    )

    id = Column(Integer, primary_key=True, index=True)
    participante_id = Column(Integer, ForeignKey("logistica.rancho_participantes.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(Date, nullable=False, index=True)
    cafe = Column(Boolean, default=False, nullable=False)
    almoco = Column(Boolean, default=False, nullable=False)

    participante = relationship("RanchoParticipante", back_populates="lancamentos")
