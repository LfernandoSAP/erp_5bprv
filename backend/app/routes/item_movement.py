from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as item_service
from app.schemas.item_movement import ItemMovementCreate, ItemMovementOut

router = APIRouter(
    prefix="/movements",
    tags=["Movements"],
)


@router.get("/", response_model=list[ItemMovementOut])
def list_movements(
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.list_movements(
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=ItemMovementOut, status_code=status.HTTP_201_CREATED)
def create_movement(
    payload: ItemMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.create_movement(
        payload=payload,
        db=db,
        current_user=current_user,
    )
