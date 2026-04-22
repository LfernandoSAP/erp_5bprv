from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.controle_efetivo import ControleEfetivo
from app.models.police_officer import PoliceOfficer
from app.models.user import User
from app.schemas.controle_efetivo import (
    ControleEfetivoCreate,
    ControleEfetivoOut,
    ControleEfetivoUpdate,
)
from app.shared.utils.scope import MODULE_P1, apply_unit_scope, resolve_unit_id_for_creation

router = APIRouter(prefix="/controle-efetivo", tags=["P1 - Controle de Efetivo"])

OPM_CODES = {
    "5BPRv EM": "620050000",
    "5BPRv-EM": "620050000",
    "1Cia": "620051000",
    "1Pel da 1Cia": "620051100",
    "2Pel da 1Cia": "620051200",
    "2Cia": "620052000",
    "1Pel da 2Cia": "620052100",
    "2Pel da 2Cia": "620052200",
    "3Cia": "620053000",
    "1Pel da 3Cia": "620053100",
    "2Pel da 3Cia": "620053200",
    "4Cia": "620054000",
    "1Pel da 4Cia": "620054100",
    "2Pel da 4Cia": "620054200",
}


def _resolve_opm_code(unit_label: str | None) -> str:
    normalized = (unit_label or "").strip()
    return OPM_CODES.get(normalized, "-")


def _query(db: Session, current_user: User):
    return apply_unit_scope(db.query(ControleEfetivo), ControleEfetivo, current_user)


def _format_date(value: date | None) -> str | None:
    if not value:
        return None
    return value.strftime("%d/%m/%Y")


def _parse_date(value: str | None) -> date | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _calculate_25_years(value: str | None) -> str | None:
    parsed = _parse_date(value)
    if not parsed:
        return None
    try:
        calculated = parsed.replace(year=parsed.year + 25)
    except ValueError:
        calculated = parsed.replace(month=2, day=28, year=parsed.year + 25)
    return calculated.strftime("%d/%m/%Y")


def _normalize_officer_data(officer: PoliceOfficer):
    unidade = officer.unit_label or (officer.unit.display_name if officer.unit else None) or (officer.unit.name if officer.unit else None)
    sexo = None
    return {
        "unit_id": officer.unit_id,
        "police_officer_id": officer.id,
        "re_dc": officer.re_with_digit,
        "nome": officer.full_name,
        "sexo": sexo,
        "unidade": unidade,
        "opm_atual": _resolve_opm_code(unidade),
        "data_admissao": _format_date(officer.admission_date),
        "data_25_anos": _calculate_25_years(_format_date(officer.admission_date)),
        "data_nascimento": _format_date(officer.birth_date),
        "nivel_escolaridade": officer.education_level,
        "curso": officer.higher_education_course,
        "rg": officer.rg,
        "cpf": officer.cpf,
        "telefone_celular": officer.cell_phone,
        "email_funcional": officer.functional_email,
    }


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


@router.get("/", response_model=list[ControleEfetivoOut])
def list_controle_efetivo(
    q: str | None = Query(default=None),
    quadro: str | None = Query(default=None),
    unit_id: int | None = Query(default=None),
    situacao: str | None = Query(default=None),
    cprv: str | None = Query(default=None),
    sinesp: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    query = _query(db, current_user).filter(ControleEfetivo.is_active == True)  # noqa: E712

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (ControleEfetivo.re_dc.ilike(term))
            | (ControleEfetivo.nome.ilike(term))
            | (ControleEfetivo.numero_processo.ilike(term))
        )
    if quadro:
        query = query.filter(ControleEfetivo.quadro == quadro)
    if unit_id:
        query = query.filter(ControleEfetivo.unit_id == unit_id)
    if situacao:
        query = query.filter(ControleEfetivo.situacao == situacao)
    if cprv:
        query = query.filter(ControleEfetivo.cprv == cprv)
    if sinesp:
        query = query.filter(ControleEfetivo.sinesp == sinesp)

    return query.order_by(ControleEfetivo.nome.asc()).all()


@router.get("/{registro_id}", response_model=ControleEfetivoOut)
def get_controle_efetivo(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = _query(db, current_user).filter(ControleEfetivo.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro de efetivo não encontrado.")
    return item


@router.get("/re/{re_dc}", response_model=ControleEfetivoOut)
def get_controle_efetivo_by_re(
    re_dc: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = _query(db, current_user).filter(ControleEfetivo.re_dc == re_dc).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro de efetivo não encontrado para o RE informado.")
    return item


@router.post("/", response_model=ControleEfetivoOut, status_code=status.HTTP_201_CREATED)
def create_controle_efetivo(
    payload: ControleEfetivoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    officer = _get_scoped_officer(db, current_user, payload.police_officer_id)
    unit_id = resolve_unit_id_for_creation(current_user, officer.unit_id if officer else payload.unit_id)
    officer_data = _normalize_officer_data(officer) if officer else {}

    item = ControleEfetivo(
        unit_id=unit_id,
        police_officer_id=officer.id if officer else None,
        re_dc=officer_data.get("re_dc", payload.re_dc),
        quadro=payload.quadro,
        nome=officer_data.get("nome", payload.nome),
        sexo=officer_data.get("sexo", payload.sexo),
        unidade=officer_data.get("unidade", payload.unidade),
        opm_atual=officer_data.get("opm_atual", payload.opm_atual),
        sinesp=payload.sinesp,
        processo_regular=payload.processo_regular,
        numero_processo=payload.numero_processo,
        situacao=payload.situacao,
        situacao_outros=payload.situacao_outros,
        obs_situacao=payload.obs_situacao,
        cep_tran_rv=payload.cep_tran_rv,
        data_admissao=officer_data.get("data_admissao", payload.data_admissao),
        data_25_anos=officer_data.get("data_25_anos", _calculate_25_years(payload.data_admissao)),
        averbacao_inss=payload.averbacao_inss,
        averbacao_militar=payload.averbacao_militar,
        inatividade=payload.inatividade,
        cprv=payload.cprv,
        data_apresentacao=payload.data_apresentacao,
        data_nascimento=officer_data.get("data_nascimento", payload.data_nascimento),
        nivel_escolaridade=officer_data.get("nivel_escolaridade", payload.nivel_escolaridade),
        curso=officer_data.get("curso", payload.curso),
        rg=officer_data.get("rg", payload.rg),
        cpf=officer_data.get("cpf", payload.cpf),
        telefone_celular=officer_data.get("telefone_celular", payload.telefone_celular),
        telefone_2=payload.telefone_2,
        email_funcional=officer_data.get("email_funcional", payload.email_funcional),
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{registro_id}", response_model=ControleEfetivoOut)
def update_controle_efetivo(
    registro_id: int,
    payload: ControleEfetivoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = _query(db, current_user).filter(ControleEfetivo.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro de efetivo não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    officer_id = update_data.get("police_officer_id", item.police_officer_id)
    officer = _get_scoped_officer(db, current_user, officer_id) if officer_id else None
    officer_data = _normalize_officer_data(officer) if officer else {}

    if officer:
        item.unit_id = officer.unit_id
        item.police_officer_id = officer.id
        item.re_dc = officer_data.get("re_dc", item.re_dc)
        item.nome = officer_data.get("nome", item.nome)
        item.sexo = officer_data.get("sexo", item.sexo)
        item.unidade = officer_data.get("unidade", item.unidade)
        item.opm_atual = officer_data.get("opm_atual", item.opm_atual)
        item.data_admissao = officer_data.get("data_admissao", item.data_admissao)
        item.data_25_anos = officer_data.get("data_25_anos", item.data_25_anos)
        item.data_nascimento = officer_data.get("data_nascimento", item.data_nascimento)
        item.nivel_escolaridade = officer_data.get("nivel_escolaridade", item.nivel_escolaridade)
        item.curso = officer_data.get("curso", item.curso)
        item.rg = officer_data.get("rg", item.rg)
        item.cpf = officer_data.get("cpf", item.cpf)
        item.telefone_celular = officer_data.get("telefone_celular", item.telefone_celular)
        item.email_funcional = officer_data.get("email_funcional", item.email_funcional)
    else:
        if "unit_id" in update_data and update_data["unit_id"] is not None:
            item.unit_id = resolve_unit_id_for_creation(current_user, update_data["unit_id"])
        if "re_dc" in update_data:
            item.re_dc = update_data["re_dc"]
        if "nome" in update_data:
            item.nome = update_data["nome"]
        if "sexo" in update_data:
            item.sexo = update_data["sexo"]
        if "unidade" in update_data:
            item.unidade = update_data["unidade"]
        if "opm_atual" in update_data:
            item.opm_atual = update_data["opm_atual"]
        if "data_admissao" in update_data:
            item.data_admissao = update_data["data_admissao"]
            item.data_25_anos = _calculate_25_years(update_data["data_admissao"])
        if "data_nascimento" in update_data:
            item.data_nascimento = update_data["data_nascimento"]
        if "rg" in update_data:
            item.rg = update_data["rg"]
        if "cpf" in update_data:
            item.cpf = update_data["cpf"]
        if "telefone_celular" in update_data:
            item.telefone_celular = update_data["telefone_celular"]
        if "email_funcional" in update_data:
            item.email_funcional = update_data["email_funcional"]

    for field in [
        "quadro",
        "sinesp",
        "processo_regular",
        "numero_processo",
        "situacao",
        "situacao_outros",
        "obs_situacao",
        "cep_tran_rv",
        "averbacao_inss",
        "averbacao_militar",
        "inatividade",
        "cprv",
        "data_apresentacao",
        "telefone_2",
        "is_active",
    ]:
        if field in update_data:
            setattr(item, field, update_data[field])

    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_controle_efetivo(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    item = _query(db, current_user).filter(ControleEfetivo.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro de efetivo não encontrado.")
    item.is_active = False
    item.updated_at = datetime.utcnow()
    db.commit()
    return None
