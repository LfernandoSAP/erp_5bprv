from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as logistica_service
from app.schemas.fleet_vehicle import (
    FleetVehicleCreate,
    FleetVehicleMovementCreate,
    FleetVehicleMovementOut,
    FleetVehicleOut,
    FleetVehicleUpdate,
)

router = APIRouter(prefix="/fleet/vehicles", tags=["Fleet"])


@router.get("/", response_model=list[FleetVehicleOut])
def list_vehicles(
    q: str | None = Query(default=None),
    include_inactive: bool = Query(default=True),
    category: str | None = Query(default=None),
    unit_id: int | None = Query(default=None),
    group_code: str | None = Query(default=None),
    telemetry: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_vehicles(
        q=q,
        include_inactive=include_inactive,
        category=category,
        unit_id=unit_id,
        group_code=group_code,
        telemetry=telemetry,
        db=db,
        current_user=current_user,
    )


@router.get("/movements/history", response_model=list[FleetVehicleMovementOut])
def list_vehicle_movements(
    unit_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_vehicle_movements(
        unit_id=unit_id,
        db=db,
        current_user=current_user,
    )


@router.post("/", response_model=FleetVehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: FleetVehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.create_vehicle(
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.put("/{vehicle_id}", response_model=FleetVehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: FleetVehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.update_vehicle(
        vehicle_id=vehicle_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.get("/{vehicle_id}", response_model=FleetVehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.get_vehicle(
        vehicle_id=vehicle_id,
        db=db,
        current_user=current_user,
    )


@router.post("/{vehicle_id}/movements", response_model=FleetVehicleMovementOut, status_code=status.HTTP_201_CREATED)
def move_vehicle(
    vehicle_id: int,
    payload: FleetVehicleMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.move_vehicle(
        vehicle_id=vehicle_id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logistica_service.delete_vehicle(
        vehicle_id=vehicle_id,
        db=db,
        current_user=current_user,
    )
    return {"status": "ok"}


@router.put("/{vehicle_id}/restore", response_model=FleetVehicleOut)
def restore_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.restore_vehicle(
        vehicle_id=vehicle_id,
        db=db,
        current_user=current_user,
    )
