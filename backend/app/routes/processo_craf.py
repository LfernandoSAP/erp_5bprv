from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.police_officer import PoliceOfficer
from app.models.processo_craf import ProcessoCraf
from app.models.user import User
from app.schemas.processo_craf import ProcessoCrafCreate, ProcessoCrafOut, ProcessoCrafUpdate
from app.shared.utils.scope import MODULE_P4, apply_unit_scope, resolve_unit_id_for_creation

router = APIRouter(prefix="/processos-armas/craf", tags=["Logistica - Processo CRAF"])

def _query(db: Session, current_user: User):
    return apply_unit_scope(db.query(ProcessoCraf), ProcessoCraf, current_user)


def _get_scoped_officer(db: Session, current_user: User, officer_id: int | None):
    if not officer_id:
        return None
    officer = (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .filter(PoliceOfficer.id == officer_id)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")
    return officer


@router.get("/", response_model=list[ProcessoCrafOut])
def list_processos_craf(
    q: str | None = Query(default=None),
    tipo: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    query = _query(db, current_user).filter(ProcessoCraf.is_active == True)  # noqa: E712

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (ProcessoCraf.re_dc.ilike(term))
            | (ProcessoCraf.nome.ilike(term))
            | (ProcessoCraf.posto_graduacao.ilike(term))
            | (ProcessoCraf.parte.ilike(term))
            | (ProcessoCraf.sigma.ilike(term))
            | (ProcessoCraf.bo.ilike(term))
            | (ProcessoCraf.msg_cmb.ilike(term))
        )

    if tipo and tipo.strip():
        query = query.filter(ProcessoCraf.tipo_craf == tipo.strip().upper())

    return query.order_by(ProcessoCraf.id.desc()).all()


@router.get("/{processo_id}", response_model=ProcessoCrafOut)
def get_processo_craf(
    processo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoCraf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo CRAF não encontrado.")
    return item


@router.post("/", response_model=ProcessoCrafOut, status_code=status.HTTP_201_CREATED)
def create_processo_craf(
    payload: ProcessoCrafCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    unit_id = resolve_unit_id_for_creation(current_user, payload.unit_id)
    officer = _get_scoped_officer(db, current_user, payload.police_officer_id)

    item = ProcessoCraf(
        unit_id=unit_id,
        police_officer_id=officer.id if officer else None,
        tipo_craf=payload.tipo_craf,
        re_dc=officer.re_with_digit if officer else payload.re_dc,
        posto_graduacao=officer.rank if officer else payload.posto_graduacao,
        nome=officer.full_name if officer else payload.nome,
        data_entrada=payload.data_entrada,
        parte=payload.parte,
        pm_l80=payload.pm_l80,
        nbi=payload.nbi,
        bol_int_res=payload.bol_int_res,
        xerox_doc=payload.xerox_doc,
        sigma=payload.sigma,
        bo=payload.bo,
        msg_cmb=payload.msg_cmb,
        data_processo=payload.data_processo,
        observacao=payload.observacao,
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{processo_id}", response_model=ProcessoCrafOut)
def update_processo_craf(
    processo_id: int,
    payload: ProcessoCrafUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoCraf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo CRAF não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    officer_id = update_data.get("police_officer_id", item.police_officer_id)
    officer = _get_scoped_officer(db, current_user, officer_id) if officer_id else None

    item.police_officer_id = officer.id if officer else None
    item.tipo_craf = update_data.get("tipo_craf", item.tipo_craf)
    item.re_dc = officer.re_with_digit if officer else update_data.get("re_dc", item.re_dc)
    item.posto_graduacao = officer.rank if officer else update_data.get("posto_graduacao", item.posto_graduacao)
    item.nome = officer.full_name if officer else update_data.get("nome", item.nome)
    item.data_entrada = update_data.get("data_entrada", item.data_entrada)
    item.parte = update_data.get("parte", item.parte)
    item.pm_l80 = update_data.get("pm_l80", item.pm_l80)
    item.nbi = update_data.get("nbi", item.nbi)
    item.bol_int_res = update_data.get("bol_int_res", item.bol_int_res)
    item.xerox_doc = update_data.get("xerox_doc", item.xerox_doc)
    item.sigma = update_data.get("sigma", item.sigma)
    item.bo = update_data.get("bo", item.bo)
    item.msg_cmb = update_data.get("msg_cmb", item.msg_cmb)
    item.data_processo = update_data.get("data_processo", item.data_processo)
    item.observacao = update_data.get("observacao", item.observacao)
    item.is_active = update_data.get("is_active", item.is_active)
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{processo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processo_craf(
    processo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoCraf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo CRAF não encontrado.")
    item.is_active = False
    item.updated_at = datetime.utcnow()
    db.commit()
    return None
