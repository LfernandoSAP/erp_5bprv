from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.armamento_processo import ArmamentoProcesso
from app.models.police_officer import PoliceOfficer
from app.models.unit import Unit
from app.models.user import User
from app.schemas.armamento_processo import (
    ArmamentoProcessoCreate,
    ArmamentoProcessoOut,
    ArmamentoProcessoUpdate,
)
from app.shared.utils.scope import (
    apply_unit_scope,
    can_access_unit,
    resolve_filter_unit_ids,
    resolve_unit_id_for_creation,
)

router = APIRouter(prefix="/armamento-processos", tags=["Logística - Armamento"])

def _attach_labels(item: ArmamentoProcesso) -> ArmamentoProcesso:
    unit = getattr(item, "unit", None)
    officer = getattr(item, "police_officer", None)
    item.unit_label = getattr(unit, "name", None) if unit else getattr(item, "unit_name_snapshot", None)
    item.police_officer_name = getattr(officer, "war_name", None) or getattr(officer, "full_name", None) if officer else None
    item.police_officer_re = getattr(officer, "re_with_digit", None) if officer else None
    return item


def _query(db: Session, current_user: User):
    return apply_unit_scope(db.query(ArmamentoProcesso), ArmamentoProcesso, current_user)


def _get_scoped_officer(db: Session, current_user: User, officer_id: int | None, unit_id: int):
    if not officer_id:
        return None
    officer = (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .filter(PoliceOfficer.id == officer_id)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")
    if officer.unit_id != unit_id:
        raise HTTPException(status_code=400, detail="O policial precisa pertencer à mesma unidade do processo.")
    return officer


@router.get("/", response_model=list[ArmamentoProcessoOut])
def list_armamento_processos(
    q: str | None = Query(default=None),
    unit_id: int | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _query(db, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")
        filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        query = query.filter(ArmamentoProcesso.unit_id.in_(filter_unit_ids))

    if not include_inactive:
        query = query.filter(ArmamentoProcesso.is_active == True)  # noqa: E712

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (ArmamentoProcesso.re_dc.ilike(term))
            | (ArmamentoProcesso.full_name.ilike(term))
            | (ArmamentoProcesso.process_text.ilike(term))
            | (ArmamentoProcesso.internal_bulletin.ilike(term))
        )

    rows = query.order_by(ArmamentoProcesso.id.desc()).all()
    return [_attach_labels(row) for row in rows]


@router.get("/{processo_id}", response_model=ArmamentoProcessoOut)
def get_armamento_processo(
    processo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _query(db, current_user).filter(ArmamentoProcesso.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    return _attach_labels(item)


@router.post("/", response_model=ArmamentoProcessoOut, status_code=status.HTTP_201_CREATED)
def create_armamento_processo(
    payload: ArmamentoProcessoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit_id = resolve_unit_id_for_creation(current_user, payload.unit_id)
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    officer = _get_scoped_officer(db, current_user, payload.police_officer_id, unit_id)

    item = ArmamentoProcesso(
        unit_id=unit_id,
        police_officer_id=officer.id if officer else None,
        police_status=payload.police_status,
        re_dc=officer.re_with_digit if officer else payload.re_dc,
        rank=officer.rank if officer else payload.rank,
        full_name=officer.full_name if officer else payload.full_name,
        unit_name_snapshot=officer.unit.name if officer and officer.unit else (payload.unit_name_snapshot or unit.name),
        entry_date=payload.entry_date,
        caliber=payload.caliber,
        process_text=payload.process_text,
        internal_bulletin=payload.internal_bulletin,
        observations=payload.observations,
        status=payload.status,
        cmb_sent_date=payload.cmb_sent_date,
        result=payload.result,
        result_date=payload.result_date,
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _attach_labels(item)


@router.put("/{processo_id}", response_model=ArmamentoProcessoOut)
def update_armamento_processo(
    processo_id: int,
    payload: ArmamentoProcessoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _query(db, current_user).filter(ArmamentoProcesso.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    police_status = (update_data.get("police_status") or item.police_status).strip().upper()
    officer_id = update_data.get("police_officer_id", item.police_officer_id)
    officer = _get_scoped_officer(db, current_user, officer_id, item.unit_id) if officer_id else None

    if police_status == "ATIVO" and officer is None:
        raise HTTPException(status_code=400, detail="Selecione um policial ativo para vincular o processo.")

    item.police_status = police_status
    item.police_officer_id = officer.id if officer else None
    item.re_dc = officer.re_with_digit if officer else update_data.get("re_dc", item.re_dc)
    item.rank = officer.rank if officer else update_data.get("rank", item.rank)
    item.full_name = officer.full_name if officer else update_data.get("full_name", item.full_name)
    item.unit_name_snapshot = (
        officer.unit.name if officer and officer.unit else update_data.get("unit_name_snapshot", item.unit_name_snapshot)
    )
    item.entry_date = update_data.get("entry_date", item.entry_date)
    item.caliber = update_data.get("caliber", item.caliber)
    item.process_text = update_data.get("process_text", item.process_text)
    item.internal_bulletin = update_data.get("internal_bulletin", item.internal_bulletin)
    item.observations = update_data.get("observations", item.observations)
    item.status = update_data.get("status", item.status)
    item.cmb_sent_date = update_data.get("cmb_sent_date", item.cmb_sent_date)
    item.result = update_data.get("result", item.result)
    item.result_date = update_data.get("result_date", item.result_date)
    item.is_active = update_data.get("is_active", item.is_active)
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return _attach_labels(item)

