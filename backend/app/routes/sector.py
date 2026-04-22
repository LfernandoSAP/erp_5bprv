from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import service as rh_service
from app.schemas.sector import SectorCreate, SectorOut, SectorUpdate

router = APIRouter(prefix="/sectors", tags=["Sectors"])


@router.get("/", response_model=list[SectorOut])
def list_sectors(
    q: str | None = Query(default=None),
    include_inactive: bool = Query(default=True),
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.list_sectors(
        q=q,
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.get("/{sector_id}", response_model=SectorOut)
def get_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.get_sector(
        sector_id=sector_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=SectorOut, status_code=status.HTTP_201_CREATED)
def create_sector(
    payload: SectorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.create_sector(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.put("/{sector_id}", response_model=SectorOut)
def update_sector(
    sector_id: int,
    payload: SectorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.update_sector(
        sector_id=sector_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.delete_sector(
        sector_id=sector_id,
        db=db,
        current_user=current_user,
    )


@router.put("/{sector_id}/restore", response_model=SectorOut)
def restore_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.restore_sector(
        sector_id=sector_id,
        db=db,
        current_user=current_user,
    )
