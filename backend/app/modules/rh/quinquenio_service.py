from __future__ import annotations

from datetime import date, timedelta
from math import floor

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.police_officer import PoliceOfficer
from app.models.quinquenio_bloco import QuinquenioBloco
from app.models.quinquenio_bloco_interrupcao import QuinquenioBlocoInterrupcao
from app.models.quinquenio_periodo import QuinquenioPeriodo
from app.models.user import User
from app.schemas.quinquenio import QuinquenioBlocoResponse, QuinquenioResumoPolicial, QuinquenioTimelineItem
from app.shared.utils.scope import MODULE_P1, apply_unit_scope, require_module_access


BLOCO_STATUS_PREVISTO = "PREVISTO"
BLOCO_STATUS_CONCEDIDO = "CONCEDIDO"
BLOCO_STATUS_EM_USO = "EM_USO"
BLOCO_STATUS_ENCERRADO = "ENCERRADO"

PERIODO_STATUS_PENDENTE = "PENDENTE"
PERIODO_STATUS_AGENDADO = "AGENDADO"
PERIODO_STATUS_EM_ANDAMENTO = "EM_ANDAMENTO"
PERIODO_STATUS_CONCLUIDO = "CONCLUIDO"


def _require_p1_access(current_user: User) -> None:
    try:
      require_module_access(current_user, MODULE_P1)
    except PermissionError as exc:
      raise HTTPException(status_code=403, detail="Sem permissão para o módulo de Quinquênio.") from exc


def _scoped_officer_query(db: Session, current_user: User):
    return apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)


def _get_policial_or_404(db: Session, current_user: User, policial_id: int) -> PoliceOfficer:
    policial = (
        _scoped_officer_query(db, current_user)
        .options(joinedload(PoliceOfficer.unit))
        .filter(PoliceOfficer.id == policial_id)
        .first()
    )
    if not policial:
        raise HTTPException(status_code=404, detail="Policial não encontrado.")
    if not policial.admission_date:
        raise HTTPException(status_code=400, detail="O policial não possui data de admissão cadastrada.")
    return policial


def _get_blocos_query(db: Session, policial_id: int):
    return (
        db.query(QuinquenioBloco)
        .options(selectinload(QuinquenioBloco.periodos))
        .filter(QuinquenioBloco.policial_id == policial_id)
    )


def _get_bloco_or_404(db: Session, bloco_id: int) -> QuinquenioBloco:
    bloco = (
        db.query(QuinquenioBloco)
        .options(selectinload(QuinquenioBloco.periodos), joinedload(QuinquenioBloco.policial).joinedload(PoliceOfficer.unit))
        .filter(QuinquenioBloco.id == bloco_id)
        .first()
    )
    if not bloco:
        raise HTTPException(status_code=404, detail="Bloco de Quinquênio não encontrado.")
    return bloco


def _get_interrupcao_or_404(db: Session, interrupcao_id: int) -> QuinquenioBlocoInterrupcao:
    item = db.query(QuinquenioBlocoInterrupcao).filter(QuinquenioBlocoInterrupcao.id == interrupcao_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interrupção não encontrada.")
    return item


def _ensure_access_to_bloco(db: Session, current_user: User, bloco: QuinquenioBloco) -> None:
    _get_policial_or_404(db, current_user, bloco.policial_id)


def _ensure_editable_bloco(bloco: QuinquenioBloco) -> None:
    if bloco.status == BLOCO_STATUS_ENCERRADO:
        raise HTTPException(status_code=400, detail="Bloco encerrado não pode ser editado.")


def _days_between(start_date: date, end_date: date) -> int:
    return max((end_date - start_date).days + 1, 0)

DIAS_POR_BLOCO = 1825


def _calculate_total_interruptions(interrupcoes: list[QuinquenioBlocoInterrupcao]) -> int:
    return sum(max(item.dias_interrompidos or 0, 0) for item in interrupcoes)


def _calculate_blocos_direito(admission_date: date, interruption_days: int) -> int:
    dias_efetivos = max((date.today() - admission_date).days - interruption_days, 0)
    return max(floor(dias_efetivos / DIAS_POR_BLOCO), 0)


def _build_bloco_dates(admission_date: date, interruption_days: int, numero_bloco: int) -> tuple[date, date, date]:
    data_inicio_contagem = admission_date + timedelta(days=DIAS_POR_BLOCO * (numero_bloco - 1))
    intervalo_fim = admission_date + timedelta(days=DIAS_POR_BLOCO * numero_bloco)
    data_prevista = intervalo_fim + timedelta(days=interruption_days)
    return data_inicio_contagem, intervalo_fim, data_prevista


def _periodo_status(periodo: QuinquenioPeriodo) -> str:
    if not periodo.tipo_uso:
        return PERIODO_STATUS_PENDENTE
    if periodo.tipo_uso == "PECUNIA":
        return PERIODO_STATUS_CONCLUIDO if periodo.boletim else PERIODO_STATUS_PENDENTE
    if not periodo.data_inicio or not periodo.data_fim:
        return PERIODO_STATUS_PENDENTE
    today = date.today()
    if today < periodo.data_inicio:
        return PERIODO_STATUS_AGENDADO
    if periodo.data_inicio <= today <= periodo.data_fim:
        return PERIODO_STATUS_EM_ANDAMENTO
    return PERIODO_STATUS_CONCLUIDO


def _refresh_bloco_status(bloco: QuinquenioBloco) -> None:
    if bloco.status == BLOCO_STATUS_PREVISTO and not (bloco.bol_geral_concessao or bloco.data_concessao_real):
        return

    all_pending = True
    all_done = True
    any_active = False
    any_defined = False

    for periodo in bloco.periodos:
        periodo.status = _periodo_status(periodo)
        any_defined = any_defined or bool(periodo.tipo_uso)
        all_pending = all_pending and periodo.status == PERIODO_STATUS_PENDENTE
        all_done = all_done and periodo.status == PERIODO_STATUS_CONCLUIDO
        any_active = any_active or periodo.status in {PERIODO_STATUS_AGENDADO, PERIODO_STATUS_EM_ANDAMENTO}

    if all_done and bloco.periodos:
        bloco.status = BLOCO_STATUS_ENCERRADO
    elif any_active or any_defined:
        bloco.status = BLOCO_STATUS_EM_USO
    elif bloco.bol_geral_concessao or bloco.data_concessao_real:
        bloco.status = BLOCO_STATUS_CONCEDIDO
    else:
        bloco.status = BLOCO_STATUS_PREVISTO


def _periodo_to_dict(periodo: QuinquenioPeriodo) -> dict:
    return {
        "id": periodo.id,
        "bloco_id": periodo.bloco_id,
        "numero_periodo": periodo.numero_periodo,
        "tipo_uso": periodo.tipo_uso,
        "fracionamento": periodo.fracionamento,
        "data_inicio": periodo.data_inicio,
        "data_fim": periodo.data_fim,
        "boletim": periodo.boletim,
        "status": periodo.status,
        "observacao": periodo.observacao,
        "dias_utilizados": periodo.dias_utilizados,
    }


def _bloco_to_dict(bloco: QuinquenioBloco, interruption_days: int) -> dict:
    _, intervalo_fim, _ = _build_bloco_dates(bloco.policial.admission_date, interruption_days, bloco.numero_bloco)
    return {
        "id": bloco.id,
        "policial_id": bloco.policial_id,
        "numero_bloco": bloco.numero_bloco,
        "data_inicio_contagem": bloco.data_inicio_contagem,
        "data_prevista": bloco.data_prevista,
        "data_concessao_real": bloco.data_concessao_real,
        "bol_geral_concessao": bloco.bol_geral_concessao,
        "dias_totais_direito": bloco.dias_totais_direito,
        "dias_utilizados": bloco.dias_utilizados,
        "dias_saldo": bloco.dias_saldo,
        "percentual_uso": bloco.percentual_uso,
        "status": bloco.status,
        "registrado": True,
        "periodos": [_periodo_to_dict(periodo) for periodo in sorted(bloco.periodos, key=lambda item: item.numero_periodo)],
        "interrupcoes_aplicadas": interruption_days,
        "intervalo_fim_contagem": intervalo_fim,
    }


def _build_predicted_bloco(policial_id: int, admission_date: date, interruption_days: int, numero_bloco: int) -> dict:
    data_inicio_contagem, intervalo_fim, data_prevista = _build_bloco_dates(admission_date, interruption_days, numero_bloco)
    return {
        "id": None,
        "policial_id": policial_id,
        "numero_bloco": numero_bloco,
        "data_inicio_contagem": data_inicio_contagem,
        "data_prevista": data_prevista,
        "data_concessao_real": None,
        "bol_geral_concessao": None,
        "dias_totais_direito": 90,
        "dias_utilizados": 0,
        "dias_saldo": 90,
        "percentual_uso": 0,
        "status": BLOCO_STATUS_PREVISTO,
        "registrado": False,
        "periodos": [
            {
                "id": None,
                "bloco_id": None,
                "numero_periodo": numero,
                "tipo_uso": None,
                "fracionamento": None,
                "data_inicio": None,
                "data_fim": None,
                "boletim": None,
                "status": PERIODO_STATUS_PENDENTE,
                "observacao": None,
                "dias_utilizados": 0,
            }
            for numero in (1, 2, 3)
        ],
        "interrupcoes_aplicadas": interruption_days,
        "intervalo_fim_contagem": intervalo_fim,
    }


def _hydrate_resumo(db: Session, current_user: User, policial_id: int) -> QuinquenioResumoPolicial:
    policial = _get_policial_or_404(db, current_user, policial_id)
    interrupcoes = (
        db.query(QuinquenioBlocoInterrupcao)
        .filter(QuinquenioBlocoInterrupcao.policial_id == policial_id)
        .order_by(QuinquenioBlocoInterrupcao.data_inicio.asc())
        .all()
    )
    interruption_days = _calculate_total_interruptions(interrupcoes)
    blocos_direito = _calculate_blocos_direito(policial.admission_date, interruption_days)
    blocos_registrados = _get_blocos_query(db, policial_id).order_by(QuinquenioBloco.numero_bloco.asc()).all()

    blocos_by_numero = {bloco.numero_bloco: bloco for bloco in blocos_registrados}
    total_to_render = max(blocos_direito + 1, max(blocos_by_numero.keys(), default=0))
    blocos = []
    for numero in range(1, total_to_render + 1):
        bloco = blocos_by_numero.get(numero)
        if bloco:
            _refresh_bloco_status(bloco)
            blocos.append(_bloco_to_dict(bloco, interruption_days))
        else:
            blocos.append(_build_predicted_bloco(policial.id, policial.admission_date, interruption_days, numero))

    proximo_bloco = next((item for item in blocos if not item["registrado"]), None)

    return QuinquenioResumoPolicial.model_validate(
        {
            "policial": {
                "policial_id": policial.id,
                "re": policial.re_with_digit,
                "nome": policial.full_name,
                "nome_guerra": policial.war_name,
                "graduacao": policial.rank,
                "unidade": policial.unit_label,
                "data_admissao": policial.admission_date,
            },
            "blocos_direito": blocos_direito,
            "blocos_registrados": len(blocos_registrados),
            "blocos_pendentes": max(blocos_direito - len(blocos_registrados), 0),
            "proximo_bloco_previsto": proximo_bloco["data_prevista"] if proximo_bloco else None,
            "dias_interrupcao_total": interruption_days,
            "interrupcoes": interrupcoes,
            "blocos": blocos,
        }
    )


def get_resumo_policial(*, policial_id: int, db: Session, current_user: User) -> QuinquenioResumoPolicial:
    _require_p1_access(current_user)
    return _hydrate_resumo(db, current_user, policial_id)


def registrar_bloco(*, policial_id: int, payload, db: Session, current_user: User) -> QuinquenioBlocoResponse:
    _require_p1_access(current_user)
    resumo = _hydrate_resumo(db, current_user, policial_id)
    numeros_registrados = {bloco.numero_bloco for bloco in resumo.blocos if bloco.registrado}
    numero_bloco = payload.numero_bloco or next((bloco.numero_bloco for bloco in resumo.blocos if not bloco.registrado), len(numeros_registrados) + 1)
    if numero_bloco in numeros_registrados:
        raise HTTPException(status_code=400, detail="Este bloco de Quinquênio já está registrado.")

    interruption_days = resumo.dias_interrupcao_total
    data_inicio_contagem, _, data_prevista = _build_bloco_dates(resumo.policial.data_admissao, interruption_days, numero_bloco)

    bloco = QuinquenioBloco(
        policial_id=policial_id,
        numero_bloco=numero_bloco,
        data_inicio_contagem=data_inicio_contagem,
        data_prevista=data_prevista,
        data_concessao_real=payload.data_concessao_real,
        bol_geral_concessao=payload.bol_geral_concessao,
        status=BLOCO_STATUS_CONCEDIDO if (payload.data_concessao_real or payload.bol_geral_concessao) else BLOCO_STATUS_PREVISTO,
    )
    for numero_periodo in (1, 2, 3):
        bloco.periodos.append(QuinquenioPeriodo(numero_periodo=numero_periodo, status=PERIODO_STATUS_PENDENTE))

    db.add(bloco)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Não foi possível registrar o bloco de Quinquênio.") from exc
    db.refresh(bloco)
    bloco = _get_bloco_or_404(db, bloco.id)
    _refresh_bloco_status(bloco)
    db.commit()
    db.refresh(bloco)
    return QuinquenioBlocoResponse.model_validate(_bloco_to_dict(bloco, interruption_days))


def atualizar_bloco(*, bloco_id: int, payload, db: Session, current_user: User) -> QuinquenioBlocoResponse:
    _require_p1_access(current_user)
    bloco = _get_bloco_or_404(db, bloco_id)
    _ensure_access_to_bloco(db, current_user, bloco)
    _ensure_editable_bloco(bloco)
    bloco.bol_geral_concessao = payload.bol_geral_concessao
    bloco.data_concessao_real = payload.data_concessao_real
    _refresh_bloco_status(bloco)
    db.commit()
    db.refresh(bloco)
    interruption_days = _calculate_total_interruptions(
        db.query(QuinquenioBlocoInterrupcao).filter(QuinquenioBlocoInterrupcao.policial_id == bloco.policial_id).all()
    )
    return QuinquenioBlocoResponse.model_validate(_bloco_to_dict(bloco, interruption_days))


def salvar_periodo(*, bloco_id: int, payload, db: Session, current_user: User) -> QuinquenioBlocoResponse:
    _require_p1_access(current_user)
    bloco = _get_bloco_or_404(db, bloco_id)
    _ensure_access_to_bloco(db, current_user, bloco)
    _ensure_editable_bloco(bloco)

    periodo = next((item for item in bloco.periodos if item.numero_periodo == payload.numero_periodo), None)
    if periodo is None:
        periodo = QuinquenioPeriodo(bloco_id=bloco.id, numero_periodo=payload.numero_periodo)
        db.add(periodo)
        bloco.periodos.append(periodo)

    if payload.tipo_uso == "PECUNIA":
        pecunias = [
            item for item in bloco.periodos if item.numero_periodo != payload.numero_periodo and item.tipo_uso == "PECUNIA"
        ]
        if pecunias:
            raise HTTPException(
                status_code=400,
                detail="Apenas 1 período por bloco pode ser utilizado como Pecúnia.",
            )

    periodo.tipo_uso = payload.tipo_uso
    periodo.fracionamento = payload.fracionamento if payload.tipo_uso == "FRUICAO" else None
    periodo.data_inicio = payload.data_inicio if payload.tipo_uso == "FRUICAO" else None
    periodo.data_fim = (
        payload.data_inicio + timedelta(days=int(payload.fracionamento) - 1)
        if payload.tipo_uso == "FRUICAO" and payload.data_inicio and payload.fracionamento
        else None
    )
    periodo.boletim = payload.boletim
    periodo.observacao = payload.observacao
    periodo.status = _periodo_status(periodo)

    _refresh_bloco_status(bloco)
    db.commit()
    db.refresh(bloco)
    interruption_days = _calculate_total_interruptions(
        db.query(QuinquenioBlocoInterrupcao).filter(QuinquenioBlocoInterrupcao.policial_id == bloco.policial_id).all()
    )
    return QuinquenioBlocoResponse.model_validate(_bloco_to_dict(bloco, interruption_days))


def _recalcular_blocos(db: Session, policial_id: int) -> None:
    interrupcoes = db.query(QuinquenioBlocoInterrupcao).filter(QuinquenioBlocoInterrupcao.policial_id == policial_id).all()
    interruption_days = _calculate_total_interruptions(interrupcoes)
    blocos = _get_blocos_query(db, policial_id).all()
    policial = db.query(PoliceOfficer).filter(PoliceOfficer.id == policial_id).first()
    if not policial or not policial.admission_date:
        return
    for bloco in blocos:
        data_inicio_contagem, _, data_prevista = _build_bloco_dates(policial.admission_date, interruption_days, bloco.numero_bloco)
        bloco.data_inicio_contagem = data_inicio_contagem
        bloco.data_prevista = data_prevista
        _refresh_bloco_status(bloco)


def registrar_interrupcao(*, policial_id: int, payload, db: Session, current_user: User) -> QuinquenioResumoPolicial:
    _require_p1_access(current_user)
    _get_policial_or_404(db, current_user, policial_id)
    item = QuinquenioBlocoInterrupcao(
        policial_id=policial_id,
        data_inicio=payload.data_inicio,
        data_fim=payload.data_fim,
        motivo=payload.motivo,
        dias_interrompidos=_days_between(payload.data_inicio, payload.data_fim),
    )
    db.add(item)
    db.commit()
    _recalcular_blocos(db, policial_id)
    db.commit()
    return _hydrate_resumo(db, current_user, policial_id)


def remover_interrupcao(*, interrupcao_id: int, db: Session, current_user: User) -> QuinquenioResumoPolicial:
    _require_p1_access(current_user)
    item = _get_interrupcao_or_404(db, interrupcao_id)
    _get_policial_or_404(db, current_user, item.policial_id)
    policial_id = item.policial_id
    db.delete(item)
    db.commit()
    _recalcular_blocos(db, policial_id)
    db.commit()
    return _hydrate_resumo(db, current_user, policial_id)


def get_timeline(*, policial_id: int, db: Session, current_user: User) -> list[QuinquenioTimelineItem]:
    resumo = get_resumo_policial(policial_id=policial_id, db=db, current_user=current_user)
    timeline = [
        {
            "tipo": "ADMISSAO",
            "data": resumo.policial.data_admissao,
            "titulo": "Admissão",
            "status": "CONCLUIDO",
            "numero_bloco": None,
        }
    ]
    for bloco in resumo.blocos:
        timeline.append(
            {
                "tipo": "BLOCO",
                "data": bloco.data_prevista,
                "titulo": f"{bloco.numero_bloco}º Bloco de LP",
                "status": bloco.status,
                "numero_bloco": bloco.numero_bloco,
            }
        )
    timeline.sort(key=lambda item: item["data"])
    return [QuinquenioTimelineItem.model_validate(item) for item in timeline]
