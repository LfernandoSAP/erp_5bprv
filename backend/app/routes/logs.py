from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.estatistica import service as estatistica_service

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/")
def list_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return estatistica_service.list_logs(db=db, current_user=current_user)
