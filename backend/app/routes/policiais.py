from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import service as rh_service

router = APIRouter(prefix="/policiais", tags=["P1 - Busca de Policiais"])


@router.get("/buscar")
def buscar_policial(
    termo: str | None = None,
    re: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_term = (termo or re or "").strip()
    return rh_service.search_police_officers(
        term_value=search_term,
        db=db,
        current_user=current_user,
    )


@router.get("/{re_dc}/detalhes")
def buscar_detalhes_policial(
    re_dc: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.get_police_officer_detail_with_measures(
        re_value=re_dc,
        db=db,
        current_user=current_user,
    )
