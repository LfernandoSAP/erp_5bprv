from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserModuleAccess(Base):
    __tablename__ = "user_module_access"
    __table_args__ = (
        UniqueConstraint("user_id", "module_code", name="uq_user_module_access_user_module"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    module_code = Column(String(50), nullable=False, index=True)
    access_level = Column(String(20), nullable=False, default="EDIT")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="module_accesses")
