from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    cpf = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    re = Column(String(50), nullable=True)
    rank = Column(String(50), nullable=True)

    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    unit = relationship("Unit")

    sector_id = Column(Integer, ForeignKey("rh.sectors.id"), nullable=True, index=True)
    sector = relationship("Sector")

    role_code = Column(String(40), nullable=True, index=True)

    password_hash = Column(String(255), nullable=False)

    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    require_password_change = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(64), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    module_accesses = relationship(
        "UserModuleAccess",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def module_access_codes(self) -> list[str]:
        return sorted(
            {
                access.module_code
                for access in self.module_accesses
                if access.module_code
            }
        )
