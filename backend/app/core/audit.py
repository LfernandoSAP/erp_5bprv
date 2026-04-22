import json

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.models.user import User


def get_request_ip(request: Request | None) -> str | None:
    if request is None:
        return None
    forwarded_for = request.headers.get("x-forwarded-for") if request else None
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


def log_audit_event(
    db: Session,
    *,
    module: str,
    action: str,
    resource_type: str,
    status: str = "SUCCESS",
    actor_user: User | None = None,
    actor_user_id: int | None = None,
    target_user: User | None = None,
    target_user_id: int | None = None,
    resource_id: str | int | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> None:
    event = AuditEvent(
        actor_user_id=actor_user.id if actor_user else actor_user_id,
        target_user_id=target_user.id if target_user else target_user_id,
        module=module,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        status=status,
        ip_address=ip_address,
        details=json.dumps(details, ensure_ascii=False) if details else None,
    )
    db.add(event)
    db.commit()
