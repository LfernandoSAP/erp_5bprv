from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class RanchoParticipante(Base):
    __tablename__ = "rancho_participantes"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    configuracao_id = Column(Integer, ForeignKey("logistica.rancho_configuracoes.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo_pessoa = Column(String(20), nullable=False, index=True)
    re = Column(String(30), nullable=True, index=True)
    rg = Column(String(30), nullable=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    graduacao = Column(String(80), nullable=True)
    ordem = Column(Integer, nullable=False, default=0, index=True)

    configuracao = relationship("RanchoConfiguracao", back_populates="participantes")
    lancamentos = relationship(
        "RanchoLancamento",
        back_populates="participante",
        cascade="all, delete-orphan",
        order_by="RanchoLancamento.data.asc()",
    )

    @property
    def display_name(self) -> str:
        if self.graduacao:
            return f"{self.graduacao} {self.nome}".strip()
        return self.nome
