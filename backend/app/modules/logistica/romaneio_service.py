import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.police_officer import PoliceOfficer
from app.models.romaneio_medida import RomaneioMedida
from app.models.user import User
from app.schemas.romaneio import (
    RomaneioMedidaCreate,
    RomaneioMedidaLookupOut,
    RomaneioMedidaUpdate,
)
from app.shared.utils.scope import can_access_unit


def _normalize_re(value: str | None) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", str(value or "")).upper()


def _resolve_requested_re(requested_re: str | None, current_user: User) -> str:
    current_user_re = str(current_user.re or "").strip()
    if not requested_re or requested_re == "me":
        if not current_user_re:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário logado não possui RE/matrícula cadastrada.",
            )
        return current_user_re
    return requested_re


def _find_police_officer_by_re(db: Session, target_re: str, current_user: User) -> PoliceOfficer:
    officer = (
        db.query(PoliceOfficer)
        .filter(PoliceOfficer.re_with_digit == target_re)
        .first()
    )

    if not officer:
        normalized_target_re = _normalize_re(target_re)
        officer = next(
            (
                candidate
                for candidate in db.query(PoliceOfficer).all()
                if _normalize_re(candidate.re_with_digit) == normalized_target_re
            ),
            None,
        )

    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policial vinculado ao RE informado não foi encontrado.",
        )

    if not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui acesso a este policial.",
        )

    return officer


def get_romaneio_medidas(re_value: str, db: Session, current_user: User) -> RomaneioMedida:
    effective_re = _resolve_requested_re(re_value, current_user)
    _find_police_officer_by_re(db, effective_re, current_user)

    medida = (
        db.query(RomaneioMedida)
        .filter(RomaneioMedida.re == effective_re)
        .first()
    )
    if medida:
        return medida

    normalized_target_re = _normalize_re(effective_re)
    medida = next(
        (
            item
            for item in db.query(RomaneioMedida).all()
            if _normalize_re(item.re) == normalized_target_re
        ),
        None,
    )
    if medida:
        return medida

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Cadastro de medidas não encontrado para o RE informado.",
    )


def get_romaneio_medidas_lookup(
    re_value: str,
    db: Session,
    current_user: User,
) -> RomaneioMedidaLookupOut:
    effective_re = _resolve_requested_re(re_value, current_user)
    officer = _find_police_officer_by_re(db, effective_re, current_user)

    medidas = (
        db.query(RomaneioMedida)
        .filter(RomaneioMedida.re == officer.re_with_digit)
        .first()
    )

    if not medidas:
        normalized_target_re = _normalize_re(officer.re_with_digit)
        medidas = next(
            (
                item
                for item in db.query(RomaneioMedida).all()
                if _normalize_re(item.re) == normalized_target_re
            ),
            None,
        )

    return RomaneioMedidaLookupOut(
        policial={
            "nome_completo": officer.full_name,
            "nome_guerra": officer.war_name,
            "re_dc": officer.re_with_digit,
            "posto_graduacao": officer.rank,
            "unidade": officer.unit.name if officer.unit else None,
            "status": "Ativo" if officer.is_active else "Inativo",
        },
        medidas=medidas,
    )


def upsert_romaneio_medidas(
    payload: RomaneioMedidaCreate | RomaneioMedidaUpdate,
    db: Session,
    current_user: User,
    re_value: str | None = None,
) -> RomaneioMedida:
    requested_re = re_value or getattr(payload, "re", None) or current_user.re
    effective_re = _resolve_requested_re(requested_re, current_user)
    police_officer = _find_police_officer_by_re(db, effective_re, current_user)

    medida = (
        db.query(RomaneioMedida)
        .filter(
            (RomaneioMedida.policial_id == police_officer.id)
            | (RomaneioMedida.re == effective_re)
        )
        .first()
    )

    if not medida:
        normalized_target_re = _normalize_re(effective_re)
        medida = next(
            (
                item
                for item in db.query(RomaneioMedida).all()
                if _normalize_re(item.re) == normalized_target_re
            ),
            None,
        )

    payload_data = payload.model_dump()
    payload_data.pop("re", None)

    if not medida:
        medida = RomaneioMedida(
            policial_id=police_officer.id,
            re=police_officer.re_with_digit,
            **payload_data,
        )
        db.add(medida)
    else:
        medida.policial_id = police_officer.id
        medida.re = police_officer.re_with_digit
        for field, value in payload_data.items():
            setattr(medida, field, value)

    db.commit()
    db.refresh(medida)
    return medida

