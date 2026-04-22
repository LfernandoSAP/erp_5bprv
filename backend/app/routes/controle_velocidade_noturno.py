from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.controle_velocidade_noturno import ControleVelocidadeNoturno
from app.models.unit import Unit
from app.models.user import User
from app.schemas.controle_velocidade_noturno import (
    ControleVelocidadeNoturnoCreate,
    ControleVelocidadeNoturnoOut,
    ControleVelocidadeNoturnoResumoOut,
)
from app.shared.utils.scope import MODULE_P3, apply_unit_scope, can_access_unit

router = APIRouter(prefix="/controle-velocidade-noturno", tags=["P3 - Controle de Velocidade Noturno"])

MONTH_LABELS = {
    1: "Jan",
    2: "Fev",
    3: "Mar",
    4: "Abr",
    5: "Mai",
    6: "Jun",
    7: "Jul",
    8: "Ago",
    9: "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
}


def _month_key(value: date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def _month_label(value: date) -> str:
    return f"{MONTH_LABELS.get(value.month, value.month)}/{str(value.year)[2:]}"


def _unit_label(unit: Unit | None) -> str:
    if not unit:
        return "-"
    return getattr(unit, "display_name", None) or getattr(unit, "name", None) or "-"


def _serialize(item: ControleVelocidadeNoturno) -> dict:
    return {
        "id": item.id,
        "data_registro": item.data_registro,
        "month_key": _month_key(item.data_registro),
        "month_label": _month_label(item.data_registro),
        "unit_id": item.unit_id,
        "unit_label": _unit_label(item.unit),
        "quantidade_autuados": item.quantidade_autuados or 0,
        "created_at": item.created_at,
    }


def _base_query(db: Session, current_user: User):
    return (
        apply_unit_scope(db.query(ControleVelocidadeNoturno), ControleVelocidadeNoturno, current_user)
        .options(joinedload(ControleVelocidadeNoturno.unit))
    )


@router.get("/", response_model=list[ControleVelocidadeNoturnoOut])
def list_controle_velocidade_noturno(
    unit_id: int | None = Query(default=None),
    year: int | None = Query(default=None),
    month: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    query = _base_query(db, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise HTTPException(status_code=403, detail="Sem permissão.")
        query = query.filter(ControleVelocidadeNoturno.unit_id == unit_id)
    if year is not None:
        query = query.filter(
            ControleVelocidadeNoturno.data_registro >= date(year, 1, 1),
            ControleVelocidadeNoturno.data_registro <= date(year, 12, 31),
        )
    if month is not None and year is not None:
        start = date(year, month, 1)
        end = date(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)
        query = query.filter(
            ControleVelocidadeNoturno.data_registro >= start,
            ControleVelocidadeNoturno.data_registro < end,
        )

    items = query.order_by(
        ControleVelocidadeNoturno.data_registro.desc(),
        ControleVelocidadeNoturno.id.desc(),
    ).all()
    return [_serialize(item) for item in items]


@router.get("/resumo", response_model=ControleVelocidadeNoturnoResumoOut)
def get_controle_velocidade_noturno_resumo(
    unit_id: int | None = Query(default=None),
    year: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    target_year = year or date.today().year
    query = _base_query(db, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise HTTPException(status_code=403, detail="Sem permissão.")
        query = query.filter(ControleVelocidadeNoturno.unit_id == unit_id)

    items = query.order_by(ControleVelocidadeNoturno.data_registro.asc()).all()
    year_items = [item for item in items if item.data_registro.year == target_year]
    monthly = []
    for month_index in range(1, 13):
        key = f"{target_year:04d}-{month_index:02d}"
        monthly.append(
            {
                "month_key": key,
                "month_label": f"{MONTH_LABELS.get(month_index, month_index)}/{str(target_year)[2:]}",
                "total": sum((item.quantidade_autuados or 0) for item in year_items if item.data_registro.month == month_index),
            }
        )

    today = date.today()
    total_mes_atual = sum((item.quantidade_autuados or 0) for item in year_items if item.data_registro.year == today.year and item.data_registro.month == today.month)
    total_autuados = sum(item.quantidade_autuados or 0 for item in year_items)

    return {
        "total_registros": len(year_items),
        "total_autuados": total_autuados,
        "total_mes_atual": total_mes_atual,
        "total_unidades": len({item.unit_id for item in year_items}),
        "monthly": monthly,
    }


@router.post("/", response_model=ControleVelocidadeNoturnoOut, status_code=status.HTTP_201_CREATED)
def create_controle_velocidade_noturno(
    payload: ControleVelocidadeNoturnoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    if not can_access_unit(current_user, payload.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    unit = db.query(Unit).filter(Unit.id == payload.unit_id).first()
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    duplicate = (
        db.query(ControleVelocidadeNoturno)
        .filter(
            ControleVelocidadeNoturno.data_registro == payload.data_registro,
            ControleVelocidadeNoturno.unit_id == payload.unit_id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Já existe lançamento para essa data e unidade.")

    item = ControleVelocidadeNoturno(
        data_registro=payload.data_registro,
        unit_id=payload.unit_id,
        quantidade_autuados=payload.quantidade_autuados,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    item.unit = unit
    return _serialize(item)


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_controle_velocidade_noturno(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P3)),
):
    item = _base_query(db, current_user).filter(ControleVelocidadeNoturno.id == registro_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")
    db.delete(item)
    db.commit()
