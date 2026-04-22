from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import quinquenio_service
from app.schemas.quinquenio import (
    QuinquenioBlocoCreate,
    QuinquenioBlocoResponse,
    QuinquenioBlocoUpdate,
    QuinquenioInterrupcaoCreate,
    QuinquenioResumoPolicial,
    QuinquenioTimelineItem,
    QuinquenioPeriodoUpsert,
)
from app.shared.utils.scope import MODULE_P1

router = APIRouter(prefix="/quinquenio", tags=["P1 - Bloco de Quinquênio"])


@router.get("/{policial_id}", response_model=QuinquenioResumoPolicial)
def get_quinquenio_resumo(
    policial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    return quinquenio_service.get_resumo_policial(policial_id=policial_id, db=db, current_user=current_user)


@router.post("/{policial_id}/blocos", response_model=QuinquenioBlocoResponse, status_code=status.HTTP_201_CREATED)
def create_quinquenio_bloco(
    policial_id: int,
    payload: QuinquenioBlocoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    payload.policial_id = policial_id
    return quinquenio_service.registrar_bloco(policial_id=policial_id, payload=payload, db=db, current_user=current_user)


@router.put("/blocos/{bloco_id}", response_model=QuinquenioBlocoResponse)
def update_quinquenio_bloco(
    bloco_id: int,
    payload: QuinquenioBlocoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    return quinquenio_service.atualizar_bloco(bloco_id=bloco_id, payload=payload, db=db, current_user=current_user)


@router.put("/blocos/{bloco_id}/periodos", response_model=QuinquenioBlocoResponse)
def upsert_quinquenio_periodo(
    bloco_id: int,
    payload: QuinquenioPeriodoUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    return quinquenio_service.salvar_periodo(bloco_id=bloco_id, payload=payload, db=db, current_user=current_user)


@router.post("/{policial_id}/interrupcoes", response_model=QuinquenioResumoPolicial, status_code=status.HTTP_201_CREATED)
def create_quinquenio_interrupcao(
    policial_id: int,
    payload: QuinquenioInterrupcaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    payload.policial_id = policial_id
    return quinquenio_service.registrar_interrupcao(policial_id=policial_id, payload=payload, db=db, current_user=current_user)


@router.delete("/interrupcoes/{interrupcao_id}", response_model=QuinquenioResumoPolicial)
def delete_quinquenio_interrupcao(
    interrupcao_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    return quinquenio_service.remover_interrupcao(interrupcao_id=interrupcao_id, db=db, current_user=current_user)


@router.get("/{policial_id}/timeline", response_model=list[QuinquenioTimelineItem])
def get_quinquenio_timeline(
    policial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P1)),
):
    return quinquenio_service.get_timeline(policial_id=policial_id, db=db, current_user=current_user)
