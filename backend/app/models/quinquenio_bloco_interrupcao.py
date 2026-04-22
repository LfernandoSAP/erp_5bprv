from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class QuinquenioBlocoInterrupcao(Base):
    __tablename__ = "quinquenio_bloco_interrupcoes"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    policial_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    data_inicio = Column(Date, nullable=False, index=True)
    data_fim = Column(Date, nullable=False, index=True)
    motivo = Column(String(255), nullable=True)
    dias_interrompidos = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    policial = relationship("PoliceOfficer")
