import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

SECRET_KEY = settings.secret_key
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

PASSWORD_POLICY_MESSAGE = (
    "A senha deve ter pelo menos 8 caracteres e incluir letra maiúscula, "
    "letra minúscula, número e caractere especial."
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def validate_password_strength(password: str) -> None:
    candidate = str(password or "").strip()
    if len(candidate) < 8:
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not re.search(r"[A-Z]", candidate):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not re.search(r"[a-z]", candidate):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not re.search(r"\d", candidate):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not re.search(r"[^A-Za-z0-9]", candidate):
        raise ValueError(PASSWORD_POLICY_MESSAGE)


def create_access_token(
    data: Dict[str, Any],
    expires_minutes: Optional[int] = None,
) -> str:
    return _create_token(
        data=data,
        token_type="access",
        expires_delta=timedelta(
            minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )


def create_refresh_token(
    data: Dict[str, Any],
    expires_days: Optional[int] = None,
) -> str:
    return _create_token(
        data=data,
        token_type="refresh",
        expires_delta=timedelta(days=expires_days or REFRESH_TOKEN_EXPIRE_DAYS),
    )


def _create_token(
    data: Dict[str, Any],
    token_type: str,
    expires_delta: timedelta,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid token") from e


def decode_token_safely(token: str) -> Dict[str, Any] | None:
    try:
        return decode_token(token)
    except Exception:
        return None
