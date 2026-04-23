from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.relacoes_publicas import service as relacoes_publicas_service
from app.modules.relacoes_publicas.schemas import BirthdayListOut

MODULE_P5 = "P5"

router = APIRouter(prefix="/aniversariantes", tags=["P5 - Aniversariantes"])


@router.get("/semana", response_model=BirthdayListOut)
def list_weekly_birthdays(
    reference_date: date | None = Query(default=None),
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P5)),
):
    try:
        return relacoes_publicas_service.list_weekly_birthdays(
            db=db,
            current_user=current_user,
            reference_date=reference_date or date.today(),
            unit_id=unit_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail="Sem permissao.") from exc


@router.get("/mes", response_model=BirthdayListOut)
def list_monthly_birthdays(
    year: int | None = Query(default=None),
    month: int | None = Query(default=None, ge=1, le=12),
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P5)),
):
    try:
        return relacoes_publicas_service.list_monthly_birthdays(
            db=db,
            current_user=current_user,
            year=year or date.today().year,
            month=month or date.today().month,
            unit_id=unit_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail="Sem permissao.") from exc


@router.get("/proximos", response_model=BirthdayListOut)
def list_upcoming_birthdays(
    reference_date: date | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=31),
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P5)),
):
    try:
        return relacoes_publicas_service.list_upcoming_birthdays(
            db=db,
            current_user=current_user,
            reference_date=reference_date or date.today(),
            days=days,
            unit_id=unit_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail="Sem permissao.") from exc
