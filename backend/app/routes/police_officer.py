from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import service as rh_service
from app.schemas.police_officer import (
    PoliceOfficerCreate,
    PoliceOfficerLinkedAssetOut,
    PoliceOfficerLinkedAssetsResponse,
    PoliceOfficerMovementCreate,
    PoliceOfficerMovementOut,
    PoliceOfficerOut,
    PoliceOfficerUpdate,
)

router = APIRouter(prefix="/police-officers", tags=["Police Officers"])


@router.get("/", response_model=list[PoliceOfficerOut])
def list_police_officers(
    q: str | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.list_police_officers(
        q=q,
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=PoliceOfficerOut, status_code=status.HTTP_201_CREATED)
def create_police_officer(
    payload: PoliceOfficerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.create_police_officer(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.get("/{officer_id}", response_model=PoliceOfficerOut)
def get_police_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.get_police_officer(
        officer_id=officer_id,
        db=db,
        current_user=current_user,
    )


@router.get("/{officer_id}/linked-assets", response_model=PoliceOfficerLinkedAssetsResponse)
def get_police_officer_linked_assets(
    officer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.get_police_officer_linked_assets(
        officer_id=officer_id,
        db=db,
        current_user=current_user,
        linked_asset_out=PoliceOfficerLinkedAssetOut,
        linked_assets_response=PoliceOfficerLinkedAssetsResponse,
    )


@router.get("/movements/history", response_model=list[PoliceOfficerMovementOut])
def list_police_officer_movements(
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.list_police_officer_movements(
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/{officer_id}/movements", response_model=PoliceOfficerOut)
def move_police_officer(
    officer_id: int,
    payload: PoliceOfficerMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.move_police_officer(
        officer_id=officer_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.put("/{officer_id}", response_model=PoliceOfficerOut)
def update_police_officer(
    officer_id: int,
    payload: PoliceOfficerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.update_police_officer(
        officer_id=officer_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{officer_id}", status_code=status.HTTP_200_OK)
def delete_police_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rh_service.delete_police_officer(
        officer_id=officer_id,
        db=db,
        current_user=current_user,
    )
    return {"status": "ok"}


@router.put("/{officer_id}/restore", response_model=PoliceOfficerOut)
def restore_police_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.restore_police_officer(
        officer_id=officer_id,
        db=db,
        current_user=current_user,
    )
