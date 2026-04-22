from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class LsvRegistro(Base):
    __tablename__ = "lsv_registros"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=False, index=True)
    re_dc = Column(String(30), nullable=False, index=True)
    nome = Column(String(200), nullable=False, index=True)
    posto_graduacao = Column(String(60), nullable=True)
    unidade = Column(String(180), nullable=True, index=True)
    quadro = Column(String(20), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
    blocos = relationship(
        "LsvBloco",
        back_populates="registro",
        cascade="all, delete-orphan",
        order_by="LsvBloco.numero_bloco.asc()",
    )
