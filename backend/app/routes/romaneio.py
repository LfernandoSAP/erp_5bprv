from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import romaneio_service
from app.schemas.romaneio import (
    RomaneioMedidaCreate,
    RomaneioMedidaLookupOut,
    RomaneioMedidaOut,
    RomaneioMedidaUpdate,
)

router = APIRouter(prefix="/romaneio", tags=["P4 - Romaneio"])


@router.get("/medidas/{re}", response_model=RomaneioMedidaLookupOut)
def get_medidas(
    re: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return romaneio_service.get_romaneio_medidas_lookup(
        re_value=re,
        db=db,
        current_user=current_user,
    )


@router.post("/medidas", response_model=RomaneioMedidaOut)
def create_medidas(
    payload: RomaneioMedidaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return romaneio_service.upsert_romaneio_medidas(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.put("/medidas/{re}", response_model=RomaneioMedidaOut)
def update_medidas(
    re: str,
    payload: RomaneioMedidaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return romaneio_service.upsert_romaneio_medidas(
        payload=payload,
        db=db,
        current_user=current_user,
        re_value=re,
    )
