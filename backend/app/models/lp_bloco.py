from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class LpBloco(Base):
    __tablename__ = "lp_blocos"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    registro_id = Column(Integer, ForeignKey("rh.lp_registros.id"), nullable=False, index=True)
    numero_bloco = Column(Integer, nullable=False, default=1)
    bol_g_pm_concessao = Column(String(60), nullable=False)
    tipo_bloco = Column(String(20), nullable=False, default="fruicao")
    dias = Column(Integer, nullable=False, default=30)
    inicio_gozo = Column(String(20), nullable=True)
    boletim_interno = Column(String(120), nullable=True)
    mes_conversao = Column(String(40), nullable=True)
    pecunia_bol_g = Column(String(60), nullable=True)

    linha_1_dias = Column(Integer, nullable=False, default=30)
    linha_1_inicio = Column(String(20), nullable=True)
    linha_1_bol_int = Column(String(120), nullable=True)
    linha_1_mes_conversao = Column(String(40), nullable=True)
    linha_1_pecunia_bol_g = Column(String(60), nullable=True)

    linha_2_dias = Column(Integer, nullable=False, default=30)
    linha_2_inicio = Column(String(20), nullable=True)
    linha_2_bol_int = Column(String(120), nullable=True)
    linha_2_mes_conversao = Column(String(40), nullable=True)
    linha_2_pecunia_bol_g = Column(String(60), nullable=True)

    linha_3_dias = Column(Integer, nullable=False, default=30)
    linha_3_inicio = Column(String(20), nullable=True)
    linha_3_bol_int = Column(String(120), nullable=True)
    linha_3_mes_conversao = Column(String(40), nullable=True)
    linha_3_pecunia_bol_g = Column(String(60), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    registro = relationship("LpRegistro", back_populates="blocos")
