from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models.user import User

MODULE_P1 = "P1"
MODULE_P3 = "P3"
MODULE_P4 = "P4"
MODULE_TELEMATICA = "TELEMATICA"


def _collect_descendant_unit_ids(unit, bucket: set[int]) -> None:
    unit_id = getattr(unit, "id", None)
    if unit_id is None or unit_id in bucket:
        return

    bucket.add(unit_id)
    for child in getattr(unit, "children", []) or []:
        _collect_descendant_unit_ids(child, bucket)


def collect_descendant_unit_ids(unit) -> set[int]:
    bucket: set[int] = set()
    _collect_descendant_unit_ids(unit, bucket)
    return bucket


def collect_descendant_unit_ids_from_db(db, root_unit_id: int) -> set[int]:
    from app.models.unit import Unit

    pending = [root_unit_id]
    bucket: set[int] = set()

    while pending:
        current_id = pending.pop()
        if current_id in bucket:
            continue

        bucket.add(current_id)
        child_ids = [
            row[0]
            for row in db.query(Unit.id)
            .filter(Unit.parent_unit_id == current_id)
            .all()
        ]
        pending.extend(child_ids)

    return bucket


def resolve_filter_unit_ids(db, unit_id: int) -> set[int]:
    from app.models.unit import Unit

    selected_unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not selected_unit:
        raise ValueError("Unidade informada não encontrada.")

    if selected_unit.type == "cia":
        return collect_descendant_unit_ids_from_db(db, unit_id)

    return {unit_id}


def get_accessible_unit_ids(current_user: User) -> set[int] | None:
    if user_has_global_scope(current_user):
        return None

    unit = getattr(current_user, "unit", None)
    if unit is None or getattr(unit, "id", None) is None:
        return {current_user.unit_id}

    unit_type = getattr(unit, "type", None)
    if unit_type in {"batalhao", "cia"}:
        accessible_ids: set[int] = set()
        _collect_descendant_unit_ids(unit, accessible_ids)
        return accessible_ids or {current_user.unit_id}

    return {current_user.unit_id}


def user_has_global_scope(current_user: User) -> bool:
    return bool(
        current_user.role_code == "ADMIN_GLOBAL"
        or (
            current_user.is_admin
            and current_user.role_code == "ADMIN_GLOBAL"
            and getattr(current_user.unit, "can_view_all", False)
        )
    )


def user_is_unit_admin(current_user: User) -> bool:
    return bool(
        current_user.role_code in {"ADMIN_GLOBAL", "ADMIN_UNIDADE"}
        or current_user.is_admin
    )


def can_access_unit(current_user: User, unit_id: int) -> bool:
    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is None:
        return True
    return unit_id in accessible_ids


def can_manage_users_in_unit(current_user: User, unit_id: int) -> bool:
    if not user_is_unit_admin(current_user):
        return False
    return can_access_unit(current_user, unit_id)


def require_unit_access(current_user: User, unit_id: int) -> None:
    if not can_access_unit(current_user, unit_id):
        raise PermissionError("Forbidden")


def resolve_unit_id_for_creation(
    current_user: User,
    requested_unit_id: int | None,
) -> int:
    if requested_unit_id is not None and can_access_unit(current_user, requested_unit_id):
        return requested_unit_id
    return current_user.unit_id


def apply_unit_scope(query: Query, model, current_user: User):
    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is None:
        return query
    if not hasattr(model, "unit_id"):
        raise ValueError("Model sem unit_id não pode ser filtrado por unidade")
    return query.filter(model.unit_id.in_(accessible_ids))


def apply_movement_unit_scope(query: Query, movement_model, current_user: User):
    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is None:
        return query
    return filter_movements_by_unit_ids(query, movement_model, accessible_ids)


def filter_movements_by_unit_ids(query: Query, movement_model, unit_ids: set[int]):
    if not hasattr(movement_model, "from_unit_id") or not hasattr(movement_model, "to_unit_id"):
        raise ValueError("Model de movimentacao precisa expor from_unit_id e to_unit_id")
    return query.filter(
        or_(
            movement_model.from_unit_id.in_(unit_ids),
            movement_model.to_unit_id.in_(unit_ids),
        )
    )


def user_has_module_access(current_user: User, module_code: str) -> bool:
    if user_has_global_scope(current_user):
        return True

    sector = getattr(current_user, "sector", None)
    sector_code = getattr(sector, "code", None)
    if sector_code == module_code:
        return True

    module_access_codes = getattr(current_user, "module_access_codes", []) or []
    return module_code in module_access_codes


def require_module_access(current_user: User, module_code: str) -> None:
    if not user_has_module_access(current_user, module_code):
        raise PermissionError("Forbidden")
