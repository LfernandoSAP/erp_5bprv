from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.audit import get_request_ip, log_audit_event
from app.core.auth import get_current_user
from app.core.config import settings
from app.core.security import (
    PASSWORD_POLICY_MESSAGE,
    create_access_token,
    create_refresh_token,
    decode_token_safely,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.db.deps import get_db
from app.models.login_attempt import LoginAttempt
from app.models.police_officer import PoliceOfficer
from app.models.unit import Unit
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    SessionUserResponse,
    TokenResponse,
)
from app.shared.utils.cpf import normalize_cpf
from app.shared.utils.scope import user_has_global_scope

router = APIRouter(prefix="/auth", tags=["Auth"])


def _resolve_user_display_name(db: Session, user: User) -> str:
    officer = db.query(PoliceOfficer).filter(PoliceOfficer.cpf == user.cpf).first()
    if officer and officer.war_name:
        return officer.war_name
    return user.name


def _build_session_payload(db: Session, user: User) -> dict:
    return {
        "sub": str(user.id),
        "unit_id": user.unit_id,
        "unit_label": user.unit.display_name if user.unit else None,
        "unit_type": user.unit.type if user.unit else None,
        "sector_id": user.sector_id,
        "sector_code": user.sector.code if user.sector else None,
        "module_access_codes": user.module_access_codes,
        "role_code": user.role_code,
        "display_name": _resolve_user_display_name(db, user),
        "is_admin": user.is_admin,
        "can_view_all": user_has_global_scope(user),
        "cpf": user.cpf,
        "name": user.name,
        "require_password_change": user.require_password_change,
    }


def _build_session_response(db: Session, user: User) -> SessionUserResponse:
    payload = _build_session_payload(db, user)
    return SessionUserResponse(
        id=user.id,
        cpf=user.cpf,
        name=user.name,
        role_code=payload["role_code"],
        module_access_codes=payload["module_access_codes"],
        unit_id=payload["unit_id"],
        unit_label=payload["unit_label"],
        unit_type=payload["unit_type"],
        sector_id=payload["sector_id"],
        sector_code=payload["sector_code"],
        display_name=payload["display_name"],
        is_admin=payload["is_admin"],
        can_view_all=payload["can_view_all"],
        require_password_change=payload["require_password_change"],
    )


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None) -> None:
    base_cookie_kwargs = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite,
        "domain": settings.auth_cookie_domain,
        "path": "/",
    }
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        **base_cookie_kwargs,
    )
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
            **base_cookie_kwargs,
        )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", domain=settings.auth_cookie_domain, path="/")
    response.delete_cookie("refresh_token", domain=settings.auth_cookie_domain, path="/")


def _is_login_rate_limited(db: Session, ip_address: str) -> bool:
    window_start = datetime.now(timezone.utc) - timedelta(
        minutes=settings.login_rate_limit_window_minutes
    )
    attempts = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.ip_address == ip_address,
            LoginAttempt.was_success.is_(False),
            LoginAttempt.attempted_at >= window_start,
        )
        .count()
    )
    return attempts >= settings.login_rate_limit_attempts


def _register_login_attempt(db: Session, cpf: str | None, ip_address: str, was_success: bool) -> None:
    db.add(LoginAttempt(cpf=cpf, ip_address=ip_address, was_success=was_success))
    db.commit()


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = get_request_ip(request) or "unknown"
    if _is_login_rate_limited(db, ip_address):
        log_audit_event(
            db,
            module="AUTH",
            action="LOGIN_RATE_LIMITED",
            resource_type="auth_session",
            status="DENIED",
            ip_address=ip_address,
            details={"cpf": normalize_cpf(payload.cpf)},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Muitas tentativas de login. Aguarde "
                f"{settings.login_rate_limit_window_minutes} minutos."
            ),
        )

    cpf = normalize_cpf(payload.cpf)
    password = payload.password

    if not cpf or not password:
        raise HTTPException(status_code=400, detail="CPF e senha são obrigatórios.")

    user = db.query(User).filter(User.cpf == str(cpf)).first()
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        _register_login_attempt(db, cpf=cpf, ip_address=ip_address, was_success=False)
        log_audit_event(
            db,
            module="AUTH",
            action="LOGIN_FAILED",
            resource_type="auth_session",
            status="FAILED",
            ip_address=ip_address,
            details={"cpf": cpf},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha inválidos.",
        )

    session_payload = _build_session_payload(db, user)
    access_token = create_access_token(session_payload)
    refresh_token = create_refresh_token({"sub": session_payload["sub"]})

    user.last_login_at = datetime.now(timezone.utc)
    user.last_login_ip = ip_address
    db.commit()
    _register_login_attempt(db, cpf=cpf, ip_address=ip_address, was_success=True)
    log_audit_event(
        db,
        module="AUTH",
        action="LOGIN_SUCCESS",
        resource_type="auth_session",
        actor_user=user,
        target_user=user,
        status="SUCCESS",
        ip_address=ip_address,
        details={"cpf": cpf, "require_password_change": user.require_password_change},
    )

    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "session": _build_session_response(db, user),
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token ausente.")

    payload = decode_token_safely(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")

    session_payload = _build_session_payload(db, user)
    access_token = create_access_token(session_payload)
    _set_auth_cookies(response, access_token=access_token)
    log_audit_event(
        db,
        module="AUTH",
        action="TOKEN_REFRESH",
        resource_type="auth_session",
        actor_user=user,
        target_user=user,
        status="SUCCESS",
        ip_address=get_request_ip(request),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "session": _build_session_response(db, user),
    }


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = None
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        payload = decode_token_safely(token)
        user_id = payload.get("sub") if payload else None
        if user_id and str(user_id).isdigit():
            current_user = db.query(User).filter(User.id == int(user_id)).first()

    if current_user and current_user.is_active:
        log_audit_event(
            db,
            module="AUTH",
            action="LOGOUT",
            resource_type="auth_session",
            actor_user=current_user,
            target_user=current_user,
            status="SUCCESS",
            ip_address=get_request_ip(request),
        )
    _clear_auth_cookies(response)
    return {"msg": "Logout realizado."}


@router.get("/me", response_model=SessionUserResponse)
def auth_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _build_session_response(db, current_user)


@router.post("/bootstrap-admin")
def bootstrap_admin(payload: dict, db: Session = Depends(get_db)):
    if db.query(User).count() > 0:
        raise HTTPException(
            status_code=403,
            detail="Bootstrap desabilitado após a criação do primeiro usuário.",
        )

    unit_id = payload.get("unit_id")
    if not unit_id or not db.query(Unit).filter(Unit.id == int(unit_id)).first():
        raise HTTPException(status_code=400, detail="unit_id não encontrado.")

    cpf = normalize_cpf(payload.get("cpf"))
    if len(cpf) != 11:
        raise HTTPException(status_code=400, detail="CPF deve conter exatamente 11 dígitos.")

    raw_password = str(payload.get("password") or "")
    try:
        validate_password_strength(raw_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user = User(
        cpf=cpf,
        name=str(payload.get("name")),
        re=str(payload.get("re", "")) or None,
        rank=str(payload.get("rank", "")) or None,
        unit_id=int(unit_id),
        password_hash=get_password_hash(raw_password),
        role_code="ADMIN_GLOBAL" if int(unit_id) == 1 else "ADMIN_UNIDADE",
        is_admin=True,
        is_active=True,
        require_password_change=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit_event(
        db,
        module="AUTH",
        action="BOOTSTRAP_ADMIN",
        resource_type="user",
        target_user=user,
        resource_id=user.id,
        status="SUCCESS",
        details={"cpf": user.cpf, "role_code": user.role_code},
    )

    return {
        "id": user.id,
        "cpf": user.cpf,
        "name": user.name,
        "unit_id": user.unit_id,
        "sector_id": user.sector_id,
        "role_code": user.role_code,
        "is_admin": user.is_admin,
    }


@router.post("/change-password", response_model=SessionUserResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if not payload.current_password or not payload.new_password:
        raise HTTPException(status_code=400, detail="Senha atual e nova senha são obrigatórias.")

    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual inválida.")

    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ser diferente da senha atual.",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.require_password_change = False
    db.commit()
    db.refresh(current_user)
    log_audit_event(
        db,
        module="AUTH",
        action="CHANGE_PASSWORD",
        resource_type="user",
        actor_user=current_user,
        target_user=current_user,
        resource_id=current_user.id,
        status="SUCCESS",
        ip_address=get_request_ip(request),
    )
    return _build_session_response(db, current_user)


__all__ = ["router", "PASSWORD_POLICY_MESSAGE"]
