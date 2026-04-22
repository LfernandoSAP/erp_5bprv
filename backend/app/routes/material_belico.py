from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as logistica_service
from app.schemas.material_belico import (
    MaterialBelicoCreate,
    MaterialBelicoMovementCreate,
    MaterialBelicoMovementOut,
    MaterialBelicoOut,
    MaterialBelicoTransferCreate,
    MaterialBelicoTransferResponse,
    MaterialBelicoUpdate,
)

router = APIRouter(prefix="/material-belico", tags=["Material Bélico"])


@router.get("/", response_model=List[MaterialBelicoOut])
def list_material_belico(
    category: str | None = None,
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False,
):
    return logistica_service.list_material_belico(
        category=category,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
        include_inactive=include_inactive,
    )


@router.post("/", response_model=MaterialBelicoOut, status_code=status.HTTP_201_CREATED)
def create_material_belico(
    payload: MaterialBelicoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.create_material_belico(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.get("/controle-geral", response_model=List[MaterialBelicoOut])
def list_material_belico_controle_geral(
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False,
):
    return logistica_service.list_material_belico_controle_geral(
        unit_id=unit_id,
        db=db,
        current_user=current_user,
        include_inactive=include_inactive,
    )


@router.get("/movements/history", response_model=List[MaterialBelicoMovementOut])
def list_material_belico_movements(
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_material_belico_movements(
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/controle-geral", response_model=MaterialBelicoOut, status_code=status.HTTP_201_CREATED)
def create_material_belico_controle_geral(
    payload: MaterialBelicoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.create_material_belico_controle_geral(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.get("/{item_id}", response_model=MaterialBelicoOut)
def get_material_belico(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.get_material_belico(
        item_id=item_id,
        db=db,
        current_user=current_user,
    )


@router.get("/{item_id}/transfer-history", response_model=List[MaterialBelicoMovementOut])
def list_material_belico_transfer_history(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_material_belico_transfer_history(
        item_id=item_id,
        db=db,
        current_user=current_user,
    )


@router.put("/{item_id}", response_model=MaterialBelicoOut)
def update_material_belico(
    item_id: int,
    payload: MaterialBelicoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.update_material_belico(
        item_id=item_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_material_belico(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logistica_service.delete_material_belico(
        item_id=item_id,
        db=db,
        current_user=current_user,
    )
    return {"status": "ok"}


@router.post("/{item_id}/movements", response_model=MaterialBelicoMovementOut, status_code=status.HTTP_201_CREATED)
def move_material_belico(
    item_id: int,
    payload: MaterialBelicoMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.move_material_belico(
        item_id=item_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.post(
    "/{item_id}/transfer",
    response_model=MaterialBelicoTransferResponse,
)
def transfer_material_belico_municao(
    item_id: int,
    payload: MaterialBelicoTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.transfer_material_belico_municao(
        item_id=item_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )
