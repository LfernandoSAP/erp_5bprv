from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.telematica import service as telematica_service
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserOut])
def list_users(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.list_users(q=q, db=db, current_user=current_user)


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.create_user(
        payload=payload,
        db=db,
        current_user=current_user,
        request=request,
    )


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.get_user(user_id=user_id, db=db, current_user=current_user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.update_user(
        user_id=user_id,
        payload=payload,
        db=db,
        current_user=current_user,
        request=request,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.delete_user(
        user_id=user_id,
        db=db,
        current_user=current_user,
        request=request,
    )


@router.put("/{user_id}/restore", response_model=UserOut)
def restore_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return telematica_service.restore_user(
        user_id=user_id,
        db=db,
        current_user=current_user,
        request=request,
    )
