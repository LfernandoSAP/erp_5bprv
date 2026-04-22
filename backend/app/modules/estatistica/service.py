from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.action_log import ActionLog
from app.models.item import Item
from app.models.user import User
from app.shared.utils.scope import MODULE_P4, apply_unit_scope, require_module_access


def list_logs(
    *,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_P4)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")

    query = (
        db.query(ActionLog)
        .join(Item, ActionLog.item_id == Item.id)
        .order_by(ActionLog.id.desc())
    )
    query = apply_unit_scope(query, Item, current_user)

    logs = query.all()
    return [
        {
            "id": log.id,
            "item_id": log.item_id,
            "item_name": log.item.name if log.item else None,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else None,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]


__all__ = ["list_logs"]

