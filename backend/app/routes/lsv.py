# -*- coding: utf-8 -*-
from datetime import datetime
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.controle_efetivo import ControleEfetivo
from app.models.lsv_bloco import LsvBloco
from app.models.lsv_registro import LsvRegistro
from app.models.police_officer import PoliceOfficer
from app.models.user import User
from app.schemas.lsv import LsvRegistroCreate, LsvRegistroListItem, LsvRegistroOut, LsvRegistroUpdate
from app.shared.utils.scope import MODULE_P1, apply_unit_scope, resolve_unit_id_for_creation

router = APIRouter(prefix="/lsv", tags=["P1 - LSV"])


def _query(db: Session, current_user: User):
    return apply_unit_scope(db.query(LsvRegistro), LsvRegistro, current_user)


def _normalize_officer_data(db: Session, officer: PoliceOfficer) -> dict:
    unidade = (
        officer.unit_label
        or (officer.unit.display_name if officer.unit else None)
        or (officer.unit.name if officer.unit else None)
    )
    quadro = (
        db.query(ControleEfetivo.quadro)
        .filter(ControleEfetivo.re_dc == officer.re_with_digit)
        .order_by(ControleEfetivo.id.desc())
        .limit(1)
        .scalar()
    )
    return {
        "unit_id": officer.unit_id,
        "police_officer_id": officer.id,
        "re_dc": officer.re_with_digit,
        "nome": officer.full_name,
        "posto_graduacao": officer.rank,
        "unidade": unidade,
        "quadro": quadro,
        "status": "Inativo" if officer.is_active is False else "Ativo",
    }


def _serialize_registro(item: LsvRegistro) -> dict:
    officer = item.police_officer
    status = "Inativo" if officer and officer.is_active is False else "Ativo"
    ultimo_inicio = None
    ultimo_doe_concessao = None
    serialized_blocos = []

    for bloco in sorted(item.blocos, key=lambda current: current.numero_bloco):
        ultimo_doe_concessao = bloco.bol_g_pm_concessao
        data_inicio_fruicao = bloco.inicio_gozo or bloco.linha_1_inicio
        doe_fruicao = bloco.boletim_interno or bloco.linha_1_bol_int
        if data_inicio_fruicao:
            ultimo_inicio = data_inicio_fruicao

        serialized_blocos.append(
            {
                "id": bloco.id,
                "numero_bloco": bloco.numero_bloco,
                "doe_concessao": bloco.bol_g_pm_concessao,
                "data_inicio_fruicao": data_inicio_fruicao,
                "doe_fruicao": doe_fruicao,
                "created_at": bloco.created_at,
                "updated_at": bloco.updated_at,
            }
        )

    return {
        "id": item.id,
        "police_officer_id": item.police_officer_id,
        "re_dc": item.re_dc,
        "nome": item.nome,
        "posto_graduacao": item.posto_graduacao,
        "unidade": item.unidade,
        "quadro": item.quadro,
        "status": status,
        "total_blocos": len(item.blocos),
        "ultimo_bol_g": ultimo_doe_concessao,
        "ultimo_inicio": ultimo_inicio,
        "blocos": serialized_blocos,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def _get_scoped_officer(db: Session, current_user: User, officer_id: int) -> PoliceOfficer:
    officer = (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .filter(PoliceOfficer.id == officer_id)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")
    return officer


def _replace_blocos(item: LsvRegistro, blocos_payload: list) -> None:
    item.blocos.clear()
    for bloco in blocos_payload:
        item.blocos.append(
            LsvBloco(
                numero_bloco=bloco.numero_bloco,
                bol_g_pm_concessao=bloco.doe_concessao,
                tipo_bloco="fruicao",
                dias=30,
                inicio_gozo=bloco.data_inicio_fruicao,
                boletim_interno=bloco.doe_fruicao,
                mes_conversao=None,
                pecunia_bol_g=None,
                linha_1_dias=30,
                linha_1_inicio=bloco.data_inicio_fruicao,
                linha_1_bol_int=bloco.doe_fruicao,
                linha_1_mes_conversao=None,
                linha_1_pecunia_bol_g=None,
                linha_2_dias=30,
                linha_2_inicio=None,
                linha_2_bol_int=None,
                linha_2_mes_conversao=None,
                linha_2_pecunia_bol_g=None,
                linha_3_dias=30,
                linha_3_inicio=None,
                linha_3_bol_int=None,
                linha_3_mes_conversao=None,
                linha_3_pecunia_bol_g=None,
            )
        )


@router.get("/", response_model=list[LsvRegistroListItem])
def list_lsv(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    try:
        query = _query(db, current_user).options(
            joinedload(LsvRegistro.blocos),
            joinedload(LsvRegistro.police_officer),
        )
        if isinstance(q, str) and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter((LsvRegistro.re_dc.ilike(term)) | (LsvRegistro.nome.ilike(term)))
        items = query.order_by(LsvRegistro.nome.asc()).all()
        return [_serialize_registro(item) for item in items]
    except Exception as exc:
        print("ERRO /api/lsv:", str(exc))
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{registro_id}", response_model=LsvRegistroOut)
def get_lsv(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = (
        _query(db, current_user)
        .options(joinedload(LsvRegistro.blocos), joinedload(LsvRegistro.police_officer))
        .filter(LsvRegistro.id == registro_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Registro de LSV não encontrado.")
    return _serialize_registro(item)


@router.get("/re/{re_dc}", response_model=LsvRegistroOut)
def get_lsv_by_re(
    re_dc: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = (
        _query(db, current_user)
        .options(joinedload(LsvRegistro.blocos), joinedload(LsvRegistro.police_officer))
        .filter(LsvRegistro.re_dc == re_dc)
        .order_by(LsvRegistro.id.desc())
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Registro de LSV não encontrado para o RE informado.")
    return _serialize_registro(item)


@router.post("/", response_model=LsvRegistroOut, status_code=status.HTTP_201_CREATED)
def create_lsv(
    payload: LsvRegistroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    officer = _get_scoped_officer(db, current_user, payload.police_officer_id)
    officer_data = _normalize_officer_data(db, officer)
    unit_id = resolve_unit_id_for_creation(current_user, officer.unit_id)

    item = LsvRegistro(
        unit_id=unit_id,
        police_officer_id=officer_data["police_officer_id"],
        re_dc=officer_data["re_dc"],
        nome=officer_data["nome"],
        posto_graduacao=officer_data["posto_graduacao"],
        unidade=officer_data["unidade"],
        quadro=officer_data["quadro"],
    )
    _replace_blocos(item, payload.blocos)
    db.add(item)
    db.commit()
    db.refresh(item)
    item = (
        db.query(LsvRegistro)
        .options(joinedload(LsvRegistro.blocos), joinedload(LsvRegistro.police_officer))
        .filter(LsvRegistro.id == item.id)
        .first()
    )
    return _serialize_registro(item)


@router.put("/{registro_id}", response_model=LsvRegistroOut)
def update_lsv(
    registro_id: int,
    payload: LsvRegistroUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = (
        _query(db, current_user)
        .options(joinedload(LsvRegistro.blocos), joinedload(LsvRegistro.police_officer))
        .filter(LsvRegistro.id == registro_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Registro de LSV não encontrado.")

    _replace_blocos(item, payload.blocos)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    item = (
        db.query(LsvRegistro)
        .options(joinedload(LsvRegistro.blocos), joinedload(LsvRegistro.police_officer))
        .filter(LsvRegistro.id == item.id)
        .first()
    )
    return _serialize_registro(item)


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lsv(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = _query(db, current_user).filter(LsvRegistro.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro de LSV não encontrado.")
    db.delete(item)
    db.commit()
    return None
