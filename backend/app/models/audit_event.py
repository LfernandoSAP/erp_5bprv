from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    module = Column(String(50), nullable=False, index=True)
    action = Column(String(80), nullable=False, index=True)
    resource_type = Column(String(80), nullable=False, index=True)
    resource_id = Column(String(80), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="SUCCESS", index=True)
    ip_address = Column(String(64), nullable=True, index=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    actor_user = relationship("User", foreign_keys=[actor_user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
