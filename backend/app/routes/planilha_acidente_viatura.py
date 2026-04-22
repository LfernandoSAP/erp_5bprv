from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.planilha_acidente_viatura import PlanilhaAcidenteViatura
from app.models.police_officer import PoliceOfficer
from app.models.user import User
from app.schemas.planilha_acidente_viatura import (
    PlanilhaAcidenteViaturaCreate,
    PlanilhaAcidenteViaturaOut,
    PlanilhaAcidenteViaturaUpdate,
)
from app.shared.utils.scope import MODULE_P3, can_access_unit

router = APIRouter(prefix="/planilha-acidente-viaturas", tags=["P3 - Planilha de Acidentes de Viatura"])


def _normalize_re(value: str | None) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def _serialize(item: PlanilhaAcidenteViatura) -> dict:
    return {
        "id": item.id,
        "police_officer_id": item.police_officer_id,
        "re_dc": item.re_dc,
        "policial_nome": item.policial_nome,
        "posto_graduacao": item.posto_graduacao,
        "portaria_sindicancia": item.portaria_sindicancia,
        "re_enc": item.re_enc,
        "data_hora_fato": item.data_hora_fato,
        "rodovia_sp": item.rodovia_sp,
        "km": item.km,
        "quantidade_policial_militar": item.quantidade_policial_militar or 0,
        "quantidade_civil": item.quantidade_civil or 0,
        "observacao": item.observacao,
        "created_at": item.created_at,
    }


def _get_officer_by_re(db: Session, re_dc: str) -> PoliceOfficer:
    normalized = _normalize_re(re_dc)
    officer = (
        db.query(PoliceOfficer)
        .filter(PoliceOfficer.re_with_digit == re_dc)
        .first()
    )
    if officer:
        return officer
    for item in db.query(PoliceOfficer).all():
        if _normalize_re(item.re_with_digit) == normalized:
            return item
    raise HTTPException(status_code=404, detail="Policial n?o encontrado para o RE-DC informado.")


@router.get("/", response_model=list[PlanilhaAcidenteViaturaOut])
def list_planilha_acidente_viaturas(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    query = db.query(PlanilhaAcidenteViatura).options(joinedload(PlanilhaAcidenteViatura.police_officer))
    if not current_user.is_admin:
        allowed_unit_ids = {current_user.unit_id}
        query = query.join(PlanilhaAcidenteViatura.police_officer).filter(PoliceOfficer.unit_id.in_(allowed_unit_ids))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            (PlanilhaAcidenteViatura.re_dc.ilike(term))
            | (PlanilhaAcidenteViatura.policial_nome.ilike(term))
            | (PlanilhaAcidenteViatura.portaria_sindicancia.ilike(term))
        )
    items = query.order_by(PlanilhaAcidenteViatura.created_at.desc(), PlanilhaAcidenteViatura.id.desc()).all()
    return [_serialize(item) for item in items]


@router.post("/", response_model=PlanilhaAcidenteViaturaOut, status_code=status.HTTP_201_CREATED)
def create_planilha_acidente_viatura(
    payload: PlanilhaAcidenteViaturaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    officer = _get_officer_by_re(db, payload.re_dc)
    if not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(status_code=403, detail="Sem permiss?o.")
    item = PlanilhaAcidenteViatura(
        police_officer_id=officer.id,
        re_dc=officer.re_with_digit,
        policial_nome=officer.full_name,
        posto_graduacao=officer.rank,
        portaria_sindicancia=payload.portaria_sindicancia,
        re_enc=payload.re_enc,
        data_hora_fato=payload.data_hora_fato,
        rodovia_sp=payload.rodovia_sp,
        km=payload.km,
        quantidade_policial_militar=payload.quantidade_policial_militar,
        quantidade_civil=payload.quantidade_civil,
        observacao=payload.observacao,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.put("/{registro_id}", response_model=PlanilhaAcidenteViaturaOut)
def update_planilha_acidente_viatura(
    registro_id: int,
    payload: PlanilhaAcidenteViaturaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    item = db.query(PlanilhaAcidenteViatura).options(joinedload(PlanilhaAcidenteViatura.police_officer)).filter(PlanilhaAcidenteViatura.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro n?o encontrado.")
    officer = item.police_officer or db.query(PoliceOfficer).filter(PoliceOfficer.id == item.police_officer_id).first()
    if officer and not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(status_code=403, detail="Sem permiss?o.")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planilha_acidente_viatura(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    item = db.query(PlanilhaAcidenteViatura).options(joinedload(PlanilhaAcidenteViatura.police_officer)).filter(PlanilhaAcidenteViatura.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro n?o encontrado.")
    officer = item.police_officer or db.query(PoliceOfficer).filter(PoliceOfficer.id == item.police_officer_id).first()
    if officer and not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(status_code=403, detail="Sem permiss?o.")
    db.delete(item)
    db.commit()
