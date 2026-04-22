from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class RanchoConfiguracao(Base):
    __tablename__ = "rancho_configuracoes"
    __table_args__ = (
        UniqueConstraint("mes", "ano", "unit_id", name="uq_rancho_configuracao_unidade_mes_ano"),
        {"schema": "logistica"},
    )

    id = Column(Integer, primary_key=True, index=True)
    mes = Column(Integer, nullable=False, index=True)
    ano = Column(Integer, nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    criado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fechado = Column(Boolean, default=False, nullable=False, index=True)

    unit = relationship("Unit")
    criado_por = relationship("User")
    participantes = relationship(
        "RanchoParticipante",
        back_populates="configuracao",
        cascade="all, delete-orphan",
        order_by="RanchoParticipante.ordem.asc(), RanchoParticipante.id.asc()",
    )

    @property
    def unit_label(self) -> str | None:
        return self.unit.display_name if self.unit else None

    @property
    def criado_por_nome(self) -> str | None:
        return self.criado_por.name if self.criado_por else None
