from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import service as rh_service
from app.schemas.unit import UnitCreate, UnitOut, UnitTree, UnitUpdate

router = APIRouter(prefix="/units", tags=["Units"])


@router.post("/", response_model=UnitOut, status_code=status.HTTP_201_CREATED)
def create_unit(
    payload: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.create_unit(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.get("/", response_model=list[UnitOut])
def list_units(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.list_units(
        db=db,
        current_user=current_user,
    )


@router.get("/tree/root", response_model=list[UnitTree])
def get_unit_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.get_unit_tree(
        db=db,
        current_user=current_user,
        unit_tree_schema=UnitTree,
    )


@router.put("/{unit_id}", response_model=UnitOut)
def update_unit(
    unit_id: int,
    payload: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rh_service.update_unit(
        unit_id=unit_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )
