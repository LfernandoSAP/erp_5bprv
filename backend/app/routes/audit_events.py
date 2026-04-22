import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, aliased

from app.db.deps import get_db
from app.models.audit_event import AuditEvent
from app.models.user import User
from app.core.auth import get_current_user
from app.schemas.audit_event import AuditEventOut
from app.shared.utils.scope import MODULE_TELEMATICA, require_module_access, user_has_global_scope

router = APIRouter(prefix="/audit-events", tags=["Audit Events"])


def _require_audit_access(current_user: User) -> None:
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.") from exc

    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")


@router.get("/", response_model=list[AuditEventOut])
def list_audit_events(
    q: str | None = Query(default=None),
    module: str | None = Query(default=None),
    action: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_audit_access(current_user)

    actor = aliased(User)
    target = aliased(User)

    query = (
        db.query(AuditEvent, actor, target)
        .outerjoin(actor, AuditEvent.actor_user_id == actor.id)
        .outerjoin(target, AuditEvent.target_user_id == target.id)
    )

    if not user_has_global_scope(current_user):
        query = query.filter(
            ((actor.unit_id == current_user.unit_id) | (target.unit_id == current_user.unit_id))
        )

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (AuditEvent.action.ilike(term))
            | (AuditEvent.module.ilike(term))
            | (AuditEvent.resource_type.ilike(term))
            | (actor.name.ilike(term))
            | (target.name.ilike(term))
            | (actor.cpf.ilike(term))
            | (target.cpf.ilike(term))
        )

    if module and module.strip():
        query = query.filter(AuditEvent.module == module.strip().upper())

    if action and action.strip():
        query = query.filter(AuditEvent.action == action.strip().upper())

    if status_filter and status_filter.strip():
        query = query.filter(AuditEvent.status == status_filter.strip().upper())

    rows = query.order_by(AuditEvent.id.desc()).limit(limit).all()

    result = []
    for event, actor_user, target_user in rows:
        parsed_details = None
        if event.details:
            try:
                parsed_details = json.loads(event.details)
            except Exception:
                parsed_details = {"raw": event.details}

        result.append(
            AuditEventOut(
                id=event.id,
                module=event.module,
                action=event.action,
                resource_type=event.resource_type,
                resource_id=event.resource_id,
                status=event.status,
                ip_address=event.ip_address,
                details=parsed_details,
                actor_user_id=event.actor_user_id,
                actor_name=actor_user.name if actor_user else None,
                actor_cpf=actor_user.cpf if actor_user else None,
                actor_unit_id=actor_user.unit_id if actor_user else None,
                target_user_id=event.target_user_id,
                target_name=target_user.name if target_user else None,
                target_cpf=target_user.cpf if target_user else None,
                target_unit_id=target_user.unit_id if target_user else None,
                created_at=event.created_at,
            )
        )

    return result
