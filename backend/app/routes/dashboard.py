from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.item import Item
from app.models.unit import Unit
from app.models.user import User
from app.shared.utils.scope import apply_unit_scope

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _normalize_dashboard_text(value):
    if value is None:
        return None

    return (
        str(value)
        .replace("TelecomunicaÃƒÂ§ÃƒÂµes", "Telecomunicações")
        .replace("TelecomunicaÃ§Ãµes", "Telecomunicações")
        .replace("Infraestrutura/ManutenÃƒÂ§ÃƒÂ£o", "Infraestrutura/Manutenção")
        .replace("Infraestrutura/ManutenÃ§Ã£o", "Infraestrutura/Manutenção")
        .replace("RelaÃƒÂ§ÃƒÂµes PÃƒÂºblicas", "Relações Públicas")
        .replace("RelaÃ§Ãµes PÃºblicas", "Relações Públicas")
        .replace("LogÃƒÂ­stica", "Logística")
        .replace("LogÃ­stica", "Logística")
        .replace("EstatÃƒÂ­stica", "Estatística")
        .replace("EstatÃ­stica", "Estatística")
        .replace("InteligÃƒÂªncia", "Inteligência")
        .replace("InteligÃªncia", "Inteligência")
        .replace("OperaÃƒÂ§ÃƒÂµes", "Operações")
        .replace("OperaÃ§Ãµes", "Operações")
        .replace("TelemÃƒÂ¡tica", "Telemática")
        .replace("TelemÃ¡tica", "Telemática")
        .replace("Telematica", "Telemática")
    )


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item_query = apply_unit_scope(db.query(Item), Item, current_user)

    total_items = item_query.count()
    active_items = item_query.filter(Item.is_active == True).count()  # noqa
    inactive_items = item_query.filter(Item.is_active == False).count()  # noqa

    by_status = (
        item_query.with_entities(Item.status, func.count(Item.id))
        .group_by(Item.status)
        .all()
    )

    by_category = (
        item_query.with_entities(Item.category, func.count(Item.id))
        .group_by(Item.category)
        .all()
    )

    by_unit = (
        apply_unit_scope(db.query(Unit.name, func.count(Item.id)), Item, current_user)
        .join(Item, Item.unit_id == Unit.id)
        .group_by(Unit.name)
        .all()
    )

    return {
        "total_items": total_items,
        "active_items": active_items,
        "inactive_items": inactive_items,
        "by_status": [{"status": _normalize_dashboard_text(s), "count": c} for s, c in by_status],
        "by_category": [
            {
                "category": _normalize_dashboard_text(c) if c else "Sem categoria",
                "count": n,
            }
            for c, n in by_category
        ],
        "by_unit": [{"unit": _normalize_dashboard_text(u), "count": c} for u, c in by_unit],
    }

