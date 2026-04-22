from sqlalchemy.orm import Session

from app.shared.models.user import User


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def list_users(db: Session):
    return db.query(User).order_by(User.id.asc()).all()
