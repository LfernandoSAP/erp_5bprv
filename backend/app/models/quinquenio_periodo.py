from datetime import date

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class QuinquenioPeriodo(Base):
    __tablename__ = "quinquenio_periodos"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    bloco_id = Column(Integer, ForeignKey("rh.quinquenio_blocos.id", ondelete="CASCADE"), nullable=False, index=True)
    numero_periodo = Column(Integer, nullable=False, index=True)
    tipo_uso = Column(String(20), nullable=True, index=True)
    fracionamento = Column(String(2), nullable=True)
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    boletim = Column(String(120), nullable=True)
    status = Column(String(20), nullable=False, default="PENDENTE", index=True)
    observacao = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bloco = relationship("QuinquenioBloco", back_populates="periodos")

    @property
    def dias_utilizados(self) -> int:
        if self.tipo_uso == "PECUNIA":
            return 30
        if self.tipo_uso == "FRUICAO" and self.fracionamento:
            return int(self.fracionamento)
        return 0

    @property
    def em_andamento(self) -> bool:
        if not self.data_inicio or not self.data_fim:
            return False
        today = date.today()
        return self.data_inicio <= today <= self.data_fim
