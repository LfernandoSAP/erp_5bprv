from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class MapaForca(Base):
    __tablename__ = "mapa_forca"
    __table_args__ = (
        UniqueConstraint("viatura_id", name="uq_mapa_forca_viatura_id"),
        {"schema": "logistica"},
    )

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("logistica.fleet_vehicles.id"), nullable=False, index=True)
    seq = Column(Integer, nullable=True, index=True)
    bprv = Column(Integer, nullable=False, default=5)
    cia = Column(Integer, nullable=False, default=0, index=True)
    pel = Column(Integer, nullable=False, default=0, index=True)
    grafismo = Column(String(40), nullable=True, index=True)
    tag_sem_parar = Column(String(10), nullable=True, index=True)
    observacao = Column(String(500), nullable=True)
    ultima_atualizacao = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    viatura = relationship("FleetVehicle")
    updated_by_user = relationship("User")
