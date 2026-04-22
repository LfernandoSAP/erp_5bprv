from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as item_service
from app.schemas.item import ItemCreate, ItemOut, ItemUpdate

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("/", response_model=List[ItemOut])
def list_items(
    include_inactive: bool = False,
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.list_items(
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.get("/search", response_model=List[ItemOut])
def search_items(
    q: str,
    include_inactive: bool = False,
    unit_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.search_items(
        q=q,
        include_inactive=include_inactive,
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=ItemOut, status_code=201)
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.create_item(payload=payload, db=db, current_user=current_user)


@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.get_item(item_id=item_id, db=db, current_user=current_user)


@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    payload: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.update_item(
        item_id=item_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item_service.delete_item(item_id=item_id, db=db, current_user=current_user)
    return {"status": "ok"}


@router.put("/{item_id}/restore", response_model=ItemOut)
def restore_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return item_service.restore_item(item_id=item_id, db=db, current_user=current_user)
