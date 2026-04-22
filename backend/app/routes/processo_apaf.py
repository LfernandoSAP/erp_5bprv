from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.police_officer import PoliceOfficer
from app.models.processo_apaf import ProcessoApaf
from app.models.user import User
from app.schemas.processo_apaf import ProcessoApafCreate, ProcessoApafOut, ProcessoApafUpdate
from app.shared.utils.scope import MODULE_P4, apply_unit_scope, resolve_unit_id_for_creation

router = APIRouter(prefix="/processos-armas/apaf", tags=["Logistica - Processo APAF"])

def _query(db: Session, current_user: User):
    return apply_unit_scope(db.query(ProcessoApaf), ProcessoApaf, current_user)


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


@router.get("/", response_model=list[ProcessoApafOut])
def list_processos_apaf(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    query = _query(db, current_user).filter(ProcessoApaf.is_active == True)  # noqa: E712

    if q and q.strip():
      term = f"%{q.strip()}%"
      query = query.filter(
          (ProcessoApaf.re_dc.ilike(term))
          | (ProcessoApaf.nome.ilike(term))
          | (ProcessoApaf.parte.ilike(term))
          | (ProcessoApaf.sigma.ilike(term))
          | (ProcessoApaf.sei.ilike(term))
          | (ProcessoApaf.apafi.ilike(term))
          | (ProcessoApaf.boletim_geral.ilike(term))
      )

    return query.order_by(ProcessoApaf.id.desc()).all()


@router.get("/{processo_id}", response_model=ProcessoApafOut)
def get_processo_apaf(
    processo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoApaf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo APAF não encontrado.")
    return item


@router.post("/", response_model=ProcessoApafOut, status_code=status.HTTP_201_CREATED)
def create_processo_apaf(
    payload: ProcessoApafCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    unit_id = resolve_unit_id_for_creation(current_user, payload.unit_id)
    officer = _get_scoped_officer(db, current_user, payload.police_officer_id)

    item = ProcessoApaf(
        unit_id=unit_id,
        police_officer_id=officer.id if officer else None,
        re_dc=officer.re_with_digit if officer else payload.re_dc,
        posto_graduacao=officer.rank if officer else payload.posto_graduacao,
        nome=officer.full_name if officer else payload.nome,
        cia_entregou=payload.cia_entregou,
        data_entrada=payload.data_entrada,
        parte=payload.parte,
        sigma=payload.sigma,
        data_cadastro=payload.data_cadastro,
        solic_consulta_pi=payload.solic_consulta_pi,
        sei=payload.sei,
        envio_cprv_link=payload.envio_cprv_link,
        cert_1=payload.cert_1,
        cert_2=payload.cert_2,
        cert_3=payload.cert_3,
        rg=officer.rg if officer and officer.rg else payload.rg,
        cpf=officer.cpf if officer and officer.cpf else payload.cpf,
        comp_residencia=payload.comp_residencia,
        boletim_geral=payload.boletim_geral,
        apafi=payload.apafi,
        data_entrega=payload.data_entrega,
        observacao=payload.observacao,
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{processo_id}", response_model=ProcessoApafOut)
def update_processo_apaf(
    processo_id: int,
    payload: ProcessoApafUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoApaf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo APAF não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    officer_id = update_data.get("police_officer_id", item.police_officer_id)
    officer = _get_scoped_officer(db, current_user, officer_id) if officer_id else None

    item.police_officer_id = officer.id if officer else None
    item.re_dc = officer.re_with_digit if officer else update_data.get("re_dc", item.re_dc)
    item.posto_graduacao = officer.rank if officer else update_data.get("posto_graduacao", item.posto_graduacao)
    item.nome = officer.full_name if officer else update_data.get("nome", item.nome)
    item.cia_entregou = update_data.get("cia_entregou", item.cia_entregou)
    item.data_entrada = update_data.get("data_entrada", item.data_entrada)
    item.parte = update_data.get("parte", item.parte)
    item.sigma = update_data.get("sigma", item.sigma)
    item.data_cadastro = update_data.get("data_cadastro", item.data_cadastro)
    item.solic_consulta_pi = update_data.get("solic_consulta_pi", item.solic_consulta_pi)
    item.sei = update_data.get("sei", item.sei)
    item.envio_cprv_link = update_data.get("envio_cprv_link", item.envio_cprv_link)
    item.cert_1 = update_data.get("cert_1", item.cert_1)
    item.cert_2 = update_data.get("cert_2", item.cert_2)
    item.cert_3 = update_data.get("cert_3", item.cert_3)
    item.rg = officer.rg if officer and officer.rg else update_data.get("rg", item.rg)
    item.cpf = officer.cpf if officer and officer.cpf else update_data.get("cpf", item.cpf)
    item.comp_residencia = update_data.get("comp_residencia", item.comp_residencia)
    item.boletim_geral = update_data.get("boletim_geral", item.boletim_geral)
    item.apafi = update_data.get("apafi", item.apafi)
    item.data_entrega = update_data.get("data_entrega", item.data_entrega)
    item.observacao = update_data.get("observacao", item.observacao)
    item.is_active = update_data.get("is_active", item.is_active)
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{processo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processo_apaf(
    processo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _query(db, current_user).filter(ProcessoApaf.id == processo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Processo APAF não encontrado.")
    item.is_active = False
    item.updated_at = datetime.utcnow()
    db.commit()
    return None
