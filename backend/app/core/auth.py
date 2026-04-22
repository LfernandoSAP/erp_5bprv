import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.deps import get_db
from app.models.user import User
from app.shared.utils.scope import require_module_access

bearer = HTTPBearer(auto_error=False)
logger = logging.getLogger("erp5bprv.auth")


AUTH_ERROR_DETAILS = {
    "missing": "Não autenticado",
    "invalid": "Token inválido",
    "inactive": "Usuário não encontrado ou inativo",
    "forbidden": "Sem permissão",
}


def _resolve_token(
    request: Request,
    creds: HTTPAuthorizationCredentials | None,
) -> str | None:
    if creds and creds.credentials:
        return creds.credentials

    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token

    return None


def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = _resolve_token(request, creds)
    if not token:
        logger.warning("Auth failure: missing bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_ERROR_DETAILS["missing"],
        )

    try:
        payload = decode_token(token)
    except Exception as exc:
        logger.warning("Auth failure: invalid token (%s)", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_ERROR_DETAILS["invalid"],
        )

    if payload.get("type") != "access":
        logger.warning("Auth failure: non-access token used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_ERROR_DETAILS["invalid"],
        )

    user_id = payload.get("sub")
    if not user_id:
        logger.warning("Auth failure: token without sub")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_ERROR_DETAILS["invalid"],
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        logger.warning("Auth failure: user not found or inactive (sub=%s)", user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AUTH_ERROR_DETAILS["inactive"],
        )

    return user


def require_module_user(module_code: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        try:
            require_module_access(current_user, module_code)
        except PermissionError as exc:
            logger.warning(
                "Auth failure: user %s without module access %s",
                current_user.id,
                module_code,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=AUTH_ERROR_DETAILS["forbidden"],
            ) from exc
        return current_user

    return dependency


