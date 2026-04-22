from fastapi import HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.audit import get_request_ip, log_audit_event
from app.core.security import get_password_hash
from app.models.sector import Sector
from app.models.unit import Unit
from app.models.user import User
from app.models.user_module_access import UserModuleAccess
from app.shared.utils.scope import (
    MODULE_TELEMATICA,
    apply_unit_scope,
    can_manage_users_in_unit,
    require_module_access,
    user_has_global_scope,
    user_is_unit_admin,
)

ALLOWED_ROLE_CODES = {"ADMIN_GLOBAL", "ADMIN_UNIDADE", "OPERADOR", "CONSULTA"}


def _normalize_telematica_text(value: str | None) -> str | None:
    if value is None:
        return None

    return (
        str(value)
        .replace("UsuÃƒÆ’Ã‚Â¡rio", "Usuário")
        .replace("usuÃƒÆ’Ã‚Â¡rio", "usuário")
        .replace("UsuÃƒÂ¡rio", "Usuário")
        .replace("usuÃƒÂ¡rio", "usuário")
        .replace("MÃƒÆ’Ã‚Â³dulo", "Módulo")
        .replace("mÃƒÆ’Ã‚Â³dulo", "módulo")
        .replace("MÃƒÂ³dulo", "Módulo")
        .replace("mÃƒÂ³dulo", "módulo")
        .replace("invÃƒÆ’Ã‚Â¡lido", "inválido")
        .replace("invÃƒÂ¡lido", "inválido")
        .replace("nÃƒÆ’Ã‚Â£o", "não")
        .replace("NÃƒÆ’Ã‚Â£o", "Não")
        .replace("nÃƒÂ£o", "não")
        .replace("NÃƒÂ£o", "Não")
        .replace("jÃƒÆ’Ã‚Â¡", "já")
        .replace("jÃƒÂ¡", "já")
        .replace("sÃƒÆ’Ã‚Â³", "só")
        .replace("sÃƒÂ³", "só")
        .replace("VocÃƒÆ’Ã‚Âª", "Você")
        .replace("VocÃƒÂª", "Você")
        .replace("permissÃƒÆ’Ã‚Â£o", "permissão")
        .replace("permissÃƒÂ£o", "permissão")
        .replace("bÃƒÆ’Ã‚Â¡sicos", "básicos")
        .replace("bÃƒÂ¡sicos", "básicos")
        .replace("possÃƒÆ’Ã‚Â­vel", "possível")
        .replace("possÃƒÂ­vel", "possível")
    )


def _sanitize_user_model(user: User | None):
    if user is None:
        return None

    for field in ["name", "rank", "role_code"]:
        if hasattr(user, field):
            current = getattr(user, field)
            if isinstance(current, str) or current is None:
                setattr(user, field, _normalize_telematica_text(current))
    return user


def _sanitize_user_models(users):
    return [_sanitize_user_model(user) for user in users]


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")


def _require_telematica_access(current_user: User) -> None:
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()


def _scoped_user_query(db: Session, current_user: User):
    query = db.query(User).options(selectinload(User.module_accesses))

    if user_has_global_scope(current_user):
        return query

    if user_is_unit_admin(current_user):
        return apply_unit_scope(query, User, current_user)

    return query.filter(User.id == current_user.id)


def _get_scoped_user_or_404(db: Session, current_user: User, user_id: int) -> User:
    user = _scoped_user_query(db, current_user).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def _resolve_module_access_codes(
    db: Session,
    unit_id: int,
    sector_id: int | None,
    module_codes: list[str] | None,
) -> list[str]:
    normalized_codes = []
    seen = set()

    for code in module_codes or []:
        normalized = str(code or "").strip().upper()
        if normalized and normalized not in seen:
            normalized_codes.append(normalized)
            seen.add(normalized)

    if sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == sector_id).first()
        if sector and sector.code:
            principal_code = str(sector.code).strip().upper()
            if principal_code and principal_code not in seen:
                normalized_codes.append(principal_code)
                seen.add(principal_code)

    if not normalized_codes:
        return []

    valid_codes = {
        str(code).strip().upper()
        for code, in db.query(Sector.code)
        .filter(Sector.unit_id == unit_id, Sector.code.isnot(None))
        .all()
        if code
    }

    invalid_codes = [code for code in normalized_codes if code not in valid_codes]
    if invalid_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Módulo(s) inválido(s) para a unidade: {', '.join(invalid_codes)}.",
        )

    return normalized_codes


def _sync_user_module_accesses(user: User, module_codes: list[str]) -> None:
    current_map = {
        access.module_code: access
        for access in user.module_accesses
        if access.module_code
    }

    for code in list(current_map):
        if code not in module_codes:
            user.module_accesses.remove(current_map[code])

    existing_codes = {
        access.module_code
        for access in user.module_accesses
        if access.module_code
    }

    for code in module_codes:
        if code not in existing_codes:
            user.module_accesses.append(
                UserModuleAccess(module_code=code, access_level="EDIT")
            )


def list_users(
    *,
    q: str | None,
    db: Session,
    current_user: User,
):
    _require_telematica_access(current_user)

    query = _scoped_user_query(db, current_user)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(User.cpf.ilike(term), User.name.ilike(term)))
    return _sanitize_user_models(query.order_by(User.id).all())


def create_user(
    *,
    payload,
    db: Session,
    current_user: User,
    request: Request | None = None,
):
    _require_telematica_access(current_user)
    if not can_manage_users_in_unit(current_user, payload.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem criar usuários nesta unidade.",
        )

    unit = db.query(Unit).filter(Unit.id == payload.unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unidade informada não encontrada.",
        )

    role_code = payload.role_code or ("ADMIN_UNIDADE" if payload.is_admin else "OPERADOR")
    if role_code not in ALLOWED_ROLE_CODES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="role_code inválido.")
    if role_code == "ADMIN_GLOBAL" and payload.unit_id != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ADMIN_GLOBAL só pode ser usado na unidade principal.",
        )
    if role_code == "ADMIN_GLOBAL" and not user_has_global_scope(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente usuários globais podem criar ADMIN_GLOBAL.",
        )

    if payload.sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == payload.sector_id).first()
        if not sector or sector.unit_id != payload.unit_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setor informado não encontrado para a unidade.",
            )

    module_access_codes = _resolve_module_access_codes(
        db,
        payload.unit_id,
        payload.sector_id,
        payload.module_access_codes,
    )

    new_user = User(
        cpf=payload.cpf,
        name=payload.name,
        re=payload.re,
        rank=payload.rank,
        unit_id=payload.unit_id,
        sector_id=payload.sector_id,
        role_code=role_code,
        password_hash=get_password_hash(payload.password),
        is_admin=role_code in {"ADMIN_GLOBAL", "ADMIN_UNIDADE"},
        is_active=payload.is_active,
        require_password_change=True,
    )
    _sync_user_module_accesses(new_user, module_access_codes)

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        log_audit_event(
            db,
            module="TELEMATICA",
            action="CREATE_USER",
            resource_type="user",
            actor_user=current_user,
            target_user=new_user,
            resource_id=new_user.id,
            status="SUCCESS",
            ip_address=get_request_ip(request),
            details={
                "cpf": new_user.cpf,
                "role_code": new_user.role_code,
                "unit_id": new_user.unit_id,
                "sector_id": new_user.sector_id,
            },
        )
        return _sanitize_user_model(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado.",
        )


def get_user(
    *,
    user_id: int,
    db: Session,
    current_user: User,
):
    _require_telematica_access(current_user)
    return _sanitize_user_model(_get_scoped_user_or_404(db, current_user, user_id))


def update_user(
    *,
    user_id: int,
    payload,
    db: Session,
    current_user: User,
    request: Request | None = None,
):
    _require_telematica_access(current_user)
    user = _get_scoped_user_or_404(db, current_user, user_id)

    is_self_update = current_user.id == user.id
    target_unit_id = payload.unit_id if payload.unit_id is not None else user.unit_id

    if not can_manage_users_in_unit(current_user, user.unit_id):
        if not is_self_update:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para editar este usuário.",
            )

        forbidden_self_fields = {
            "unit_id",
            "sector_id",
            "module_access_codes",
            "role_code",
            "is_admin",
            "is_active",
        }
        if any(getattr(payload, field) is not None for field in forbidden_self_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode atualizar seus dados básicos e senha.",
            )
    elif target_unit_id != user.unit_id and not can_manage_users_in_unit(current_user, target_unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem mover usuários para esta unidade.",
        )

    next_role_code = payload.role_code or user.role_code or (
        "ADMIN_UNIDADE" if (payload.is_admin if payload.is_admin is not None else user.is_admin) else "OPERADOR"
    )
    if next_role_code not in ALLOWED_ROLE_CODES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="role_code inválido.")
    if next_role_code == "ADMIN_GLOBAL" and target_unit_id != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ADMIN_GLOBAL só pode ser usado na unidade principal.",
        )
    if next_role_code == "ADMIN_GLOBAL" and not user_has_global_scope(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente usuários globais podem definir ADMIN_GLOBAL.",
        )

    if payload.unit_id is not None:
        unit = db.query(Unit).filter(Unit.id == payload.unit_id).first()
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unidade informada não encontrada.",
            )
        user.unit_id = payload.unit_id

    if payload.sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == payload.sector_id).first()
        if not sector or sector.unit_id != target_unit_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setor informado não encontrado para a unidade.",
            )
        user.sector_id = payload.sector_id
    elif payload.unit_id is not None:
        user.sector_id = None

    target_sector_id = payload.sector_id if payload.sector_id is not None else user.sector_id
    target_module_codes = (
        payload.module_access_codes
        if payload.module_access_codes is not None
        else user.module_access_codes
    )
    module_access_codes = _resolve_module_access_codes(
        db,
        user.unit_id,
        target_sector_id,
        target_module_codes,
    )

    if payload.name is not None:
        user.name = payload.name
    if payload.re is not None:
        user.re = payload.re
    if payload.rank is not None:
        user.rank = payload.rank
    if payload.role_code is not None or payload.is_admin is not None:
        user.role_code = next_role_code
        user.is_admin = next_role_code in {"ADMIN_GLOBAL", "ADMIN_UNIDADE"}
    if payload.password:
        user.password_hash = get_password_hash(payload.password)
        user.require_password_change = False if is_self_update else True
    if payload.is_active is not None:
        if user.id == current_user.id and payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode inativar o próprio usuário.",
            )
        user.is_active = payload.is_active

    _sync_user_module_accesses(user, module_access_codes)

    try:
        db.commit()
        db.refresh(user)
        log_audit_event(
            db,
            module="TELEMATICA",
            action="UPDATE_USER",
            resource_type="user",
            actor_user=current_user,
            target_user=user,
            resource_id=user.id,
            status="SUCCESS",
            ip_address=get_request_ip(request),
            details={
                "role_code": user.role_code,
                "unit_id": user.unit_id,
                "sector_id": user.sector_id,
                "is_active": user.is_active,
                "password_reset": bool(payload.password),
            },
        )
        return _sanitize_user_model(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível atualizar o usuário.",
        )


def delete_user(
    *,
    user_id: int,
    db: Session,
    current_user: User,
    request: Request | None = None,
):
    _require_telematica_access(current_user)
    user = _get_scoped_user_or_404(db, current_user, user_id)
    if not can_manage_users_in_unit(current_user, user.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem excluir usuários desta unidade.",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode excluir o próprio usuário.",
        )
    user.is_active = False
    db.commit()
    log_audit_event(
        db,
        module="TELEMATICA",
        action="DEACTIVATE_USER",
        resource_type="user",
        actor_user=current_user,
        target_user=user,
        resource_id=user.id,
        status="SUCCESS",
        ip_address=get_request_ip(request),
        details={"cpf": user.cpf},
    )


def restore_user(
    *,
    user_id: int,
    db: Session,
    current_user: User,
    request: Request | None = None,
):
    _require_telematica_access(current_user)
    user = _get_scoped_user_or_404(db, current_user, user_id)
    if not can_manage_users_in_unit(current_user, user.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem reativar usuários desta unidade.",
        )
    user.is_active = True
    db.commit()
    db.refresh(user)
    log_audit_event(
        db,
        module="TELEMATICA",
        action="RESTORE_USER",
        resource_type="user",
        actor_user=current_user,
        target_user=user,
        resource_id=user.id,
        status="SUCCESS",
        ip_address=get_request_ip(request),
        details={"cpf": user.cpf},
    )
    return _sanitize_user_model(user)


__all__ = [
    "create_user",
    "delete_user",
    "get_user",
    "list_users",
    "restore_user",
    "update_user",
]

