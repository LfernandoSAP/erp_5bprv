from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import rancho_service
from app.schemas.rancho import (
    RanchoBuscarPmOut,
    RanchoConfiguracaoCreate,
    RanchoConfiguracaoDetailResponse,
    RanchoConfiguracaoListItem,
    RanchoLancamentoUpsert,
    RanchoParticipanteCreate,
)

router = APIRouter(prefix="/rancho", tags=["Assuntos Gerais - Previsão de Rancho"])


@router.post("/", response_model=RanchoConfiguracaoDetailResponse, status_code=status.HTTP_201_CREATED)
def create_rancho_configuracao(
    payload: RanchoConfiguracaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.create_configuracao(payload=payload, db=db, current_user=current_user)


@router.get("/", response_model=list[RanchoConfiguracaoListItem])
def list_rancho_configuracoes(
    mes: int | None = Query(default=None),
    ano: int | None = Query(default=None),
    unidade_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.list_configuracoes(
        mes=mes,
        ano=ano,
        unidade_id=unidade_id,
        db=db,
        current_user=current_user,
    )


@router.get("/buscar-pm", response_model=RanchoBuscarPmOut)
def buscar_pm_rancho(
    re: str,
    unidade_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.buscar_pm(re=re, unidade_id=unidade_id, db=db, current_user=current_user)


@router.get("/{config_id}/exportar-excel")
def exportar_rancho_excel(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.exportar_excel(config_id=config_id, db=db, current_user=current_user)


@router.get("/{config_id}", response_model=RanchoConfiguracaoDetailResponse)
def get_rancho_configuracao(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.get_configuracao(config_id=config_id, db=db, current_user=current_user)


@router.post("/{config_id}/participantes", response_model=RanchoConfiguracaoDetailResponse)
def add_rancho_participante(
    config_id: int,
    payload: RanchoParticipanteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.add_participante(config_id=config_id, payload=payload, db=db, current_user=current_user)


@router.delete("/{config_id}/participantes/{participante_id}", response_model=RanchoConfiguracaoDetailResponse)
def delete_rancho_participante(
    config_id: int,
    participante_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.remove_participante(
        config_id=config_id,
        participante_id=participante_id,
        db=db,
        current_user=current_user,
    )


@router.put("/{config_id}/lancamentos", response_model=RanchoConfiguracaoDetailResponse)
def upsert_rancho_lancamento(
    config_id: int,
    payload: RanchoLancamentoUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.upsert_lancamento(config_id=config_id, payload=payload, db=db, current_user=current_user)


@router.put("/{config_id}/fechar", response_model=RanchoConfiguracaoDetailResponse)
def fechar_rancho_configuracao(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return rancho_service.fechar_configuracao(config_id=config_id, db=db, current_user=current_user)
