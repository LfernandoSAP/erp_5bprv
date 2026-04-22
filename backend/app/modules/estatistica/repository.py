from sqlalchemy.orm import Session

from app.models.action_log import ActionLog


def list_action_logs(db: Session):
    return db.query(ActionLog).order_by(ActionLog.id.desc()).all()
