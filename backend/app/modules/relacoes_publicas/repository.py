from sqlalchemy.orm import Session, joinedload

from app.models.police_officer import PoliceOfficer
from app.shared.utils.scope import apply_unit_scope


def list_active_officers_with_birth_date(db: Session, current_user):
    return (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .options(joinedload(PoliceOfficer.unit))
        .filter(
            PoliceOfficer.is_active.is_(True),
            PoliceOfficer.birth_date.is_not(None),
        )
        .all()
    )
