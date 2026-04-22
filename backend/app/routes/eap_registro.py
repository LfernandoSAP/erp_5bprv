from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.eap_modulo import EapModulo
from app.models.eap_modulo_participante import EapModuloParticipante
from app.models.police_officer import PoliceOfficer
from app.models.user import User
from app.schemas.eap_registro import (
    EapModuloCreate,
    EapModuloDetalheOut,
    EapModuloOut,
    EapModuloUpdate,
    EapParticipanteCreate,
)
from app.shared.utils.scope import MODULE_P3, can_access_unit, get_accessible_unit_ids

router = APIRouter(prefix="/eap", tags=["P3 - EAP 5BPRv"])


def _normalize_re(value: str | None) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def _validate_periods(payload) -> None:
    if payload.periodo_ead_inicio and payload.periodo_ead_fim and payload.periodo_ead_inicio > payload.periodo_ead_fim:
        raise HTTPException(status_code=400, detail="O periodo EAD esta invalido.")
    if (
        payload.periodo_presencial_inicio
        and payload.periodo_presencial_fim
        and payload.periodo_presencial_inicio > payload.periodo_presencial_fim
    ):
        raise HTTPException(status_code=400, detail="O periodo presencial esta invalido.")


def _get_officer_by_re(db: Session, re_dc: str) -> PoliceOfficer:
    normalized = _normalize_re(re_dc)
    officer = db.query(PoliceOfficer).filter(PoliceOfficer.re_with_digit == re_dc).first()
    if officer:
        return officer
    for item in db.query(PoliceOfficer).all():
        if _normalize_re(item.re_with_digit) == normalized:
            return item
    raise HTTPException(status_code=404, detail="Policial nao encontrado para o RE-DC informado.")


def _scoped_module_query(db: Session, current_user: User):
    query = db.query(EapModulo).options(joinedload(EapModulo.unit))
    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is not None:
        query = query.filter(EapModulo.unit_id.in_(accessible_ids))
    return query


def _get_module_or_404(db: Session, current_user: User, modulo_id: int) -> EapModulo:
    modulo = (
        _scoped_module_query(db, current_user)
        .options(joinedload(EapModulo.participantes))
        .filter(EapModulo.id == modulo_id)
        .first()
    )
    if not modulo:
        raise HTTPException(status_code=404, detail="Modulo EAP nao encontrado.")
    return modulo


def _serialize_participante(item: EapModuloParticipante) -> dict:
    return {
        "id": item.id,
        "police_officer_id": item.police_officer_id,
        "re_dc": item.re_dc,
        "policial_nome": item.policial_nome,
        "posto_graduacao": item.posto_graduacao,
        "unidade_policial": item.unidade_policial,
        "created_at": item.created_at,
    }


def _serialize_modulo(item: EapModulo) -> dict:
    participantes = list(getattr(item, "participantes", []) or [])
    return {
        "id": item.id,
        "modulo": item.modulo,
        "tipo": item.tipo,
        "local": item.local,
        "periodo_ead_inicio": item.periodo_ead_inicio,
        "periodo_ead_fim": item.periodo_ead_fim,
        "periodo_presencial_inicio": item.periodo_presencial_inicio,
        "periodo_presencial_fim": item.periodo_presencial_fim,
        "outros": item.outros,
        "unit_id": item.unit_id,
        "unit_label": item.unit.display_name if item.unit else None,
        "total_policiais": len(participantes),
        "created_at": item.created_at,
        "participantes": [_serialize_participante(participante) for participante in participantes],
    }


@router.get("/modules", response_model=list[EapModuloOut])
def list_eap_modulos(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    query = (
        _scoped_module_query(db, current_user)
        .options(joinedload(EapModulo.participantes))
        .order_by(EapModulo.created_at.desc(), EapModulo.id.desc())
    )
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            EapModulo.modulo.ilike(term)
            | EapModulo.tipo.ilike(term)
            | EapModulo.local.ilike(term)
            | EapModulo.outros.ilike(term)
        )
    return [_serialize_modulo(item) for item in query.all()]


@router.get("/modules/{modulo_id}", response_model=EapModuloDetalheOut)
def get_eap_modulo(
    modulo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    return _serialize_modulo(_get_module_or_404(db, current_user, modulo_id))


@router.post("/modules", response_model=EapModuloDetalheOut, status_code=status.HTTP_201_CREATED)
def create_eap_modulo(
    payload: EapModuloCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    _validate_periods(payload)
    modulo = EapModulo(
        modulo=payload.modulo,
        tipo=payload.tipo,
        local=payload.local,
        periodo_ead_inicio=payload.periodo_ead_inicio,
        periodo_ead_fim=payload.periodo_ead_fim,
        periodo_presencial_inicio=payload.periodo_presencial_inicio,
        periodo_presencial_fim=payload.periodo_presencial_fim,
        outros=payload.outros,
        unit_id=current_user.unit_id,
        created_by=current_user.id,
    )
    db.add(modulo)
    db.commit()
    db.refresh(modulo)
    return _serialize_modulo(modulo)


@router.put("/modules/{modulo_id}", response_model=EapModuloDetalheOut)
def update_eap_modulo(
    modulo_id: int,
    payload: EapModuloUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    _validate_periods(payload)
    modulo = _get_module_or_404(db, current_user, modulo_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(modulo, field, value)
    db.commit()
    db.refresh(modulo)
    return _serialize_modulo(modulo)


@router.delete("/modules/{modulo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_eap_modulo(
    modulo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    modulo = _get_module_or_404(db, current_user, modulo_id)
    db.delete(modulo)
    db.commit()


@router.post("/modules/{modulo_id}/participantes", response_model=EapModuloDetalheOut)
def add_eap_participante(
    modulo_id: int,
    payload: EapParticipanteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    modulo = _get_module_or_404(db, current_user, modulo_id)
    officer = _get_officer_by_re(db, payload.re_dc)
    if not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissao.")

    existing = (
        db.query(EapModuloParticipante)
        .filter(
            EapModuloParticipante.modulo_id == modulo.id,
            EapModuloParticipante.police_officer_id == officer.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Este policial ja foi incluido neste modulo.")

    participante = EapModuloParticipante(
        modulo_id=modulo.id,
        police_officer_id=officer.id,
        re_dc=officer.re_with_digit,
        policial_nome=officer.full_name,
        posto_graduacao=officer.rank,
        unidade_policial=officer.unit_label,
    )
    db.add(participante)
    db.commit()
    db.refresh(modulo)
    return _serialize_modulo(_get_module_or_404(db, current_user, modulo_id))


@router.delete("/modules/{modulo_id}/participantes/{participante_id}", response_model=EapModuloDetalheOut)
def remove_eap_participante(
    modulo_id: int,
    participante_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    modulo = _get_module_or_404(db, current_user, modulo_id)
    participante = (
        db.query(EapModuloParticipante)
        .filter(
            EapModuloParticipante.modulo_id == modulo.id,
            EapModuloParticipante.id == participante_id,
        )
        .first()
    )
    if not participante:
        raise HTTPException(status_code=404, detail="Participante do modulo nao encontrado.")
    db.delete(participante)
    db.commit()
    return _serialize_modulo(_get_module_or_404(db, current_user, modulo_id))
