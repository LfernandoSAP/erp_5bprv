from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ControleVelocidadeNoturno(Base):
    __tablename__ = "controle_velocidade_noturno"
    __table_args__ = {"schema": "estatistica"}

    id = Column(Integer, primary_key=True, index=True)
    data_registro = Column(Date, nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    quantidade_autuados = Column(Integer, nullable=False, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unit = relationship("Unit")
    created_by_user = relationship("User")
