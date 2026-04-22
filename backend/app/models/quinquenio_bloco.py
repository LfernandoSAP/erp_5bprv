from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class QuinquenioBloco(Base):
    __tablename__ = "quinquenio_blocos"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    policial_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    numero_bloco = Column(Integer, nullable=False, index=True)
    data_inicio_contagem = Column(Date, nullable=False)
    data_prevista = Column(Date, nullable=False, index=True)
    data_concessao_real = Column(Date, nullable=True)
    bol_geral_concessao = Column(String(120), nullable=True)
    dias_totais_direito = Column(Integer, nullable=False, default=90)
    status = Column(String(20), nullable=False, default="PREVISTO", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    policial = relationship("PoliceOfficer")
    periodos = relationship(
        "QuinquenioPeriodo",
        back_populates="bloco",
        cascade="all, delete-orphan",
        order_by="QuinquenioPeriodo.numero_periodo",
    )

    @property
    def dias_utilizados(self) -> int:
        return sum(periodo.dias_utilizados for periodo in self.periodos)

    @property
    def dias_saldo(self) -> int:
        return max(self.dias_totais_direito - self.dias_utilizados, 0)

    @property
    def percentual_uso(self) -> float:
        if not self.dias_totais_direito:
            return 0
        return round((self.dias_utilizados / self.dias_totais_direito) * 100, 2)
