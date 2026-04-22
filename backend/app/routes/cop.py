from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.cop import Cop
from app.models.cop_movement import CopMovement
from app.models.fleet_vehicle import FleetVehicle
from app.models.police_officer import PoliceOfficer
from app.models.sector import Sector
from app.models.unit import Unit
from app.models.user import User
from app.schemas.cop import CopCreate, CopMovementCreate, CopMovementOut, CopOut, CopUpdate
from app.shared.utils.scope import MODULE_P4, apply_unit_scope, can_access_unit, resolve_unit_id_for_creation

router = APIRouter(prefix="/cops", tags=["P4 - Controle de COPs"])


def _base_query(db: Session, current_user: User):
    return (
        apply_unit_scope(db.query(Cop), Cop, current_user)
        .options(
            joinedload(Cop.unit),
            joinedload(Cop.material_sector),
            joinedload(Cop.responsible_sector),
            joinedload(Cop.police_officer),
            joinedload(Cop.fleet_vehicle),
        )
    )


def _get_cop(db: Session, current_user: User, cop_id: int) -> Cop:
    item = _base_query(db, current_user).filter(Cop.id == cop_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="COP não encontrada.")
    return item


def _resolve_sector(
    db: Session,
    current_user: User,
    sector_id: int | None,
    unit_id: int | None = None,
    *,
    field_name: str,
) -> Sector | None:
    if not sector_id:
        return None
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=400, detail=f"{field_name} não encontrado.")
    if not can_access_unit(current_user, sector.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão para o setor informado.")
    if unit_id and sector.unit_id != unit_id:
        raise HTTPException(status_code=400, detail=f"{field_name} incompatível com a unidade selecionada.")
    return sector


def _resolve_police_officer(db: Session, current_user: User, police_officer_id: int | None) -> PoliceOfficer | None:
    if not police_officer_id:
        return None
    officer = (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .filter(PoliceOfficer.id == police_officer_id)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Policial responsável não encontrado.")
    return officer


def _resolve_fleet_vehicle(db: Session, current_user: User, fleet_vehicle_id: int | None) -> FleetVehicle | None:
    if not fleet_vehicle_id:
        return None
    vehicle = (
        apply_unit_scope(db.query(FleetVehicle), FleetVehicle, current_user)
        .filter(FleetVehicle.id == fleet_vehicle_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=400, detail="Viatura vinculada não encontrada.")
    return vehicle


def _apply_payload(item: Cop, payload: CopCreate | CopUpdate, db: Session, current_user: User) -> None:
    requested_unit_id = getattr(payload, "unit_id", None)
    unit_id = item.unit_id if requested_unit_id is None else resolve_unit_id_for_creation(current_user, requested_unit_id)
    if not db.query(Unit.id).filter(Unit.id == unit_id).first():
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    material_sector = _resolve_sector(
        db,
        current_user,
        getattr(payload, "material_sector_id", None),
        unit_id if getattr(payload, "material_sector_id", None) else None,
        field_name="Setor do material",
    )
    responsible_sector = _resolve_sector(
        db,
        current_user,
        getattr(payload, "responsible_sector_id", None),
        unit_id if getattr(payload, "responsible_sector_id", None) else None,
        field_name="Setor responsável",
    )
    police_officer = _resolve_police_officer(db, current_user, getattr(payload, "police_officer_id", None))
    fleet_vehicle = _resolve_fleet_vehicle(db, current_user, getattr(payload, "fleet_vehicle_id", None))

    if police_officer and not can_access_unit(current_user, police_officer.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão para o policial informado.")
    if fleet_vehicle and not can_access_unit(current_user, fleet_vehicle.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão para a viatura informada.")

    item.unit_id = unit_id
    if getattr(payload, "name", None) is not None:
        item.name = payload.name.strip()
    if getattr(payload, "model", None) is not None:
        item.model = payload.model.strip()
    item.serial_number = (getattr(payload, "serial_number", None) or "").strip() or None
    item.patrimony = (getattr(payload, "patrimony", None) or "").strip() or None
    item.responsibility_type = (getattr(payload, "responsibility_type", None) or "").strip() or None
    item.material_sector_id = material_sector.id if material_sector else None
    item.responsible_sector_id = responsible_sector.id if responsible_sector else None
    item.police_officer_id = police_officer.id if police_officer else None
    item.fleet_vehicle_id = fleet_vehicle.id if fleet_vehicle else None
    item.holder = (getattr(payload, "holder", None) or "").strip() or None
    holder_concessionaria = (getattr(payload, "holder_concessionaria", None) or "").strip() or None
    item.holder_concessionaria = holder_concessionaria if item.holder == "Concessionária" else None
    item.status = (getattr(payload, "status", None) or item.status or "Ativo").strip()
    item.location = (getattr(payload, "location", None) or "").strip() or None
    item.notes = (getattr(payload, "notes", None) or "").strip() or None
    item.updated_at = datetime.utcnow()


@router.get("/", response_model=list[CopOut])
def list_cops(
    q: str | None = Query(default=None),
    unit_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    holder: str | None = Query(default=None),
    police_query: str | None = Query(default=None, alias="policial"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    query = _base_query(db, current_user)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (Cop.name.ilike(term))
            | (Cop.model.ilike(term))
            | (Cop.serial_number.ilike(term))
            | (Cop.patrimony.ilike(term))
        )
    if unit_id:
        query = query.filter(Cop.unit_id == unit_id)
    if status_filter:
        query = query.filter(Cop.status == status_filter)
    if holder:
        query = query.filter(Cop.holder == holder)
    if police_query and police_query.strip():
        term = f"%{police_query.strip()}%"
        query = query.outerjoin(Cop.police_officer).filter(
            (PoliceOfficer.re_with_digit.ilike(term))
            | (PoliceOfficer.full_name.ilike(term))
            | (PoliceOfficer.war_name.ilike(term))
        )

    return query.order_by(Cop.name.asc()).all()


@router.get("/{cop_id}", response_model=CopOut)
def get_cop(
    cop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    return _get_cop(db, current_user, cop_id)


@router.post("/", response_model=CopOut, status_code=status.HTTP_201_CREATED)
def create_cop(
    payload: CopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = Cop(name=payload.name.strip(), model=payload.model.strip(), unit_id=current_user.unit_id)
    _apply_payload(item, payload, db, current_user)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _get_cop(db, current_user, item.id)


@router.put("/{cop_id}", response_model=CopOut)
def update_cop(
    cop_id: int,
    payload: CopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _get_cop(db, current_user, cop_id)
    _apply_payload(item, payload, db, current_user)
    db.commit()
    db.refresh(item)
    return _get_cop(db, current_user, item.id)


@router.delete("/{cop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cop(
    cop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _get_cop(db, current_user, cop_id)
    db.delete(item)
    db.commit()
    return None


@router.get("/{cop_id}/movimentacoes", response_model=list[CopMovementOut])
def list_cop_movements(
    cop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    _get_cop(db, current_user, cop_id)
    query = (
        db.query(CopMovement)
        .options(
            joinedload(CopMovement.from_unit),
            joinedload(CopMovement.to_unit),
            joinedload(CopMovement.to_sector),
            joinedload(CopMovement.to_police_officer),
        )
        .filter(CopMovement.cop_id == cop_id)
        .order_by(CopMovement.created_at.desc())
    )
    return query.all()


@router.post("/{cop_id}/movimentar", response_model=CopOut)
def move_cop(
    cop_id: int,
    payload: CopMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _get_cop(db, current_user, cop_id)
    to_unit_id = payload.to_unit_id or item.unit_id
    if not can_access_unit(current_user, to_unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão para a unidade de destino.")

    _resolve_sector(db, current_user, payload.to_sector_id, to_unit_id, field_name="Setor de destino")
    _resolve_police_officer(db, current_user, payload.to_police_officer_id)

    movement = CopMovement(
        cop_id=item.id,
        user_id=current_user.id,
        movement_type=payload.movement_type,
        from_unit_id=item.unit_id,
        to_unit_id=to_unit_id,
        to_sector_id=payload.to_sector_id,
        to_police_officer_id=payload.to_police_officer_id,
        movement_date=(payload.movement_date or "").strip() or None,
        observation=(payload.observation or "").strip() or None,
    )
    db.add(movement)

    item.unit_id = to_unit_id
    item.responsible_sector_id = payload.to_sector_id
    item.police_officer_id = payload.to_police_officer_id
    if payload.movement_type == "Baixa":
        item.status = "Baixado"
    elif payload.movement_type == "Manutenção":
        item.status = "Em Manutenção"
    else:
        item.status = "Ativo"
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return _get_cop(db, current_user, item.id)



