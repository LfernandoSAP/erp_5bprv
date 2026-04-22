from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as logistica_service
from app.schemas.tpd_talonario import (
    TpdTalonarioCreate,
    TpdTalonarioOut,
    TpdTalonarioUpdate,
)

router = APIRouter(prefix="/tpd-talonario", tags=["P4 - TPD/Talonário"])


@router.get("/", response_model=List[TpdTalonarioOut])
def list_tpd_talonarios(
    include_inactive: bool = False,
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_tpd_talonarios(
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.get("/search", response_model=List[TpdTalonarioOut])
def search_tpd_talonarios(
    q: str,
    include_inactive: bool = False,
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.search_tpd_talonarios(
        q=q,
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=TpdTalonarioOut, status_code=201)
def create_tpd_talonario(
    payload: TpdTalonarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.create_tpd_talonario(payload=payload, db=db, current_user=current_user)


@router.get("/{item_id}", response_model=TpdTalonarioOut)
def get_tpd_talonario(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.get_tpd_talonario(item_id=item_id, db=db, current_user=current_user)


@router.put("/{item_id}", response_model=TpdTalonarioOut)
def update_tpd_talonario(
    item_id: int,
    payload: TpdTalonarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.update_tpd_talonario(
        item_id=item_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tpd_talonario(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.delete_tpd_talonario(item_id=item_id, db=db, current_user=current_user)


@router.put("/{item_id}/restore", response_model=TpdTalonarioOut)
def restore_tpd_talonario(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.restore_tpd_talonario(item_id=item_id, db=db, current_user=current_user)

