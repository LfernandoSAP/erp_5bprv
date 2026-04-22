from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.db.database import Base


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(20), nullable=True, index=True)
    ip_address = Column(String(64), nullable=True, index=True)
    was_success = Column(Boolean, nullable=False, default=False)
    attempted_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
