from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_module_user
from app.db.deps import get_db
from app.models.fleet_vehicle import FleetVehicle
from app.models.mapa_forca import MapaForca
from app.models.unit import Unit
from app.models.user import User
from app.schemas.mapa_forca import (
    BuscarViaturaOut,
    MapaForcaCreate,
    MapaForcaResumoOut,
    MapaForcaRowOut,
    MapaForcaUpdate,
)
from app.shared.utils.scope import MODULE_P4, apply_unit_scope, can_access_unit

router = APIRouter(prefix="/mapa-forca", tags=["P4 - Mapa Força de Viaturas"])

MAPA_FORCA_GROUPS = [
    "1. TRANSPORTE FUNCIONAL",
    "3. TRANSPORTE MISTO",
    "6. TRANSPORTE CARGA SECA",
    "7. TRANSPORTE COL MICRO",
    "8. VEÍCULO SERVIÇO RESERVADO",
    "11. ROCAM",
    "13. GUINCHO",
    "15. VEÍCULOS ESPECIAIS",
    "19. MOTO ESTAFETA",
    "20. FT (TOR)",
    "21. CMT BTL",
    "21. CMT CIA",
    "21. CFP",
    "21. CGP",
    "21. RP",
    "21. RP Rv Est",
    "21. APOIO BOP",
    "21. COP (Coord Op)",
    "22. TRANSPORTE PESSOAL",
    "26. APOIO OPERACIONAL",
]
MAPA_FORCA_TYPE_ORDER = [
    "AUTOMÓVEL",
    "UTILITÁRIO",
    "MOTOCICLETA",
    "CAMINHÃO",
    "CAMIONETA",
    "CAMINHONETE",
    "REBOQUE OU SEMI REB",
    "TRAILER",
    "MICRO-ÔNIBUS",
    "ÔNIBUS",
]
ORGAO_ORDER = ["PMESP", "DER", "CONCESSIONÁRIA"]
SITUACAO_SIGLAS = [
    ("OPER", "OPERANDO"),
    ("RES", "RESERVA"),
    ("BAIX", "BAIXADA"),
    ("PROC", "PROCESSO DESCARGA"),
    ("DESC", "DESCARREGADA"),
]


def _normalize_text(value: str | None) -> str:
    return (value or "").strip()


def _normalize_holder(value: str | None) -> str:
    text = _normalize_text(value).upper()
    if not text:
        return "-"
    if "CONCESS" in text:
        return "CONCESSIONÁRIA"
    if text == "PM":
        return "PMESP"
    return text


def _normalize_yes_no(value: str | None) -> str:
    text = _normalize_text(value).upper()
    if text in {"SIM", "S"}:
        return "SIM"
    if text in {"NAO", "NÃO", "N"}:
        return "NÃO"
    return text or "-"


def _normalize_situacao(value: str | None) -> str:
    text = _normalize_text(value).upper()
    if not text:
        return "-"
    if "OPER" in text:
        return "OPERANDO"
    if "RES" in text:
        return "RESERVA"
    if "DESCARREG" in text:
        return "DESCARREGADA"
    if "PROC" in text and "DESC" in text:
        return "PROCESSO DESCARGA"
    if "BAIX" in text:
        return "BAIXADA"
    return text


def _situacao_sigla(value: str | None) -> str:
    normalized = _normalize_situacao(value)
    if normalized == "OPERANDO":
        return "OPER"
    if normalized == "RESERVA":
        return "RES"
    if normalized == "BAIXADA":
        return "BAIX"
    if normalized == "PROCESSO DESCARGA":
        return "PROC"
    if normalized == "DESCARREGADA":
        return "DESC"
    return "OUTROS"


def _normalize_category(value: str | None) -> str:
    text = _normalize_text(value).upper()
    if not text:
        return "-"
    if "MOTO" in text:
        return "MOTOCICLETA"
    if "CAMINH" in text and "ONETE" in text:
        return "CAMINHONETE"
    if "CAMIONETA" in text:
        return "CAMIONETA"
    if "CAMINH" in text:
        return "CAMINHÃO"
    if "UTILIT" in text:
        return "UTILITÁRIO"
    if "TRAILER" in text:
        return "TRAILER"
    if "REBOQUE" in text or "SEMI" in text:
        return "REBOQUE OU SEMI REB"
    if "MICRO" in text:
        return "MICRO-ÔNIBUS"
    if "ONIBUS" in text or "ÔNIBUS" in text:
        return "ÔNIBUS"
    return "AUTOMÓVEL"


def _extract_numeric_prefix(value: str | None) -> int:
    digits = "".join(ch for ch in _normalize_text(value) if ch.isdigit())
    return int(digits) if digits else 0


def _resolve_cia_from_unit(vehicle: FleetVehicle) -> int:
    unit = getattr(vehicle, "unit", None)
    if not unit:
        return 0
    if getattr(unit, "type", None) == "pelotao":
        parent = getattr(unit, "parent_unit", None)
        return _extract_numeric_prefix(getattr(parent, "name", None))
    if getattr(unit, "type", None) == "cia":
        return _extract_numeric_prefix(getattr(unit, "name", None))
    return 0


def _unit_label(vehicle: FleetVehicle) -> str | None:
    unit = getattr(vehicle, "unit", None)
    if not unit:
        return None
    display_name = getattr(unit, "display_name", None)
    if display_name:
        return display_name
    return getattr(unit, "name", None)


def _serialize_busca(vehicle: FleetVehicle) -> dict:
    return _build_row(vehicle, None, 0)


def _build_row(vehicle: FleetVehicle, mapa: MapaForca | None, fallback_seq: int) -> dict:
    police_officer = getattr(vehicle, "police_officer", None)
    holder = _normalize_holder(vehicle.holder)
    return {
        "id": getattr(mapa, "id", None),
        "viatura_id": vehicle.id,
        "seq": getattr(mapa, "seq", None) or fallback_seq,
        "bprv": getattr(mapa, "bprv", None) or 5,
        "cia": getattr(mapa, "cia", None) if mapa and mapa.cia is not None else _resolve_cia_from_unit(vehicle),
        "pel": getattr(mapa, "pel", None) or 0,
        "grupo": _normalize_text(vehicle.group_code) or "-",
        "situacao": _normalize_situacao(vehicle.situation),
        "prefixo": _normalize_text(vehicle.prefix) or "-",
        "placa": vehicle.plate,
        "marca": vehicle.brand,
        "modelo": vehicle.model,
        "tipo_veiculo": _normalize_category(vehicle.category),
        "rodas": vehicle.wheel_count,
        "cor": vehicle.color,
        "chassi": vehicle.chassis,
        "renavam": vehicle.renavam,
        "ano_fab": vehicle.manufacture_year or vehicle.year,
        "ano_mod": vehicle.model_year,
        "orgao": holder,
        "patrimonio": vehicle.patrimony,
        "locadora": vehicle.rental_company,
        "grafismo": _normalize_text(getattr(mapa, "grafismo", None)) or "-",
        "tag_sem_parar": _normalize_yes_no(getattr(mapa, "tag_sem_parar", None)),
        "telemetria": _normalize_yes_no(vehicle.telemetry),
        "observacao": getattr(mapa, "observacao", None),
        "unidade_id": vehicle.unit_id,
        "unidade_label": _unit_label(vehicle),
        "policial_id": getattr(police_officer, "id", None),
        "policial_re": getattr(police_officer, "re_with_digit", None),
        "policial_nome": getattr(police_officer, "war_name", None) or getattr(police_officer, "full_name", None),
        "policial_posto": getattr(police_officer, "rank", None),
        "ultima_atualizacao": getattr(mapa, "ultima_atualizacao", None),
    }


def _filtered_vehicle_query(db: Session, current_user: User):
    return (
        apply_unit_scope(db.query(FleetVehicle), FleetVehicle, current_user)
        .options(
            joinedload(FleetVehicle.unit).joinedload(Unit.parent_unit),
            joinedload(FleetVehicle.police_officer),
        )
        .filter(FleetVehicle.is_active.is_(True))
    )


def _load_rows(
    db: Session,
    current_user: User,
    *,
    q: str | None = None,
    cia: int | None = None,
    pel: int | None = None,
    grupo: str | None = None,
    situacao: str | None = None,
    orgao: str | None = None,
    tipo_veiculo: str | None = None,
    grafismo: str | None = None,
    tag_sem_parar: str | None = None,
    telemetria: str | None = None,
) -> list[dict]:
    query = _filtered_vehicle_query(db, current_user)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            FleetVehicle.prefix.ilike(term)
            | FleetVehicle.plate.ilike(term)
            | FleetVehicle.brand.ilike(term)
            | FleetVehicle.model.ilike(term)
        )

    vehicles = query.order_by(FleetVehicle.prefix.asc(), FleetVehicle.plate.asc()).all()
    if not vehicles:
        return []

    vehicle_ids = [vehicle.id for vehicle in vehicles]
    mapa_items = (
        db.query(MapaForca)
        .filter(MapaForca.viatura_id.in_(vehicle_ids))
        .all()
    )
    mapa_by_vehicle = {item.viatura_id: item for item in mapa_items}

    rows: list[dict] = []
    for index, vehicle in enumerate(vehicles, start=1):
        row = _build_row(vehicle, mapa_by_vehicle.get(vehicle.id), index)
        if cia is not None and row["cia"] != cia:
            continue
        if pel is not None and row["pel"] != pel:
            continue
        if grupo and row["grupo"] != grupo:
            continue
        if situacao and row["situacao"] != situacao:
            continue
        if orgao and row["orgao"] != orgao:
            continue
        if tipo_veiculo and row["tipo_veiculo"] != tipo_veiculo:
            continue
        if grafismo and row["grafismo"] != grafismo:
            continue
        if tag_sem_parar and row["tag_sem_parar"] != tag_sem_parar:
            continue
        if telemetria and row["telemetria"] != telemetria:
            continue
        rows.append(row)

    rows.sort(key=lambda row: (row["seq"], row["prefixo"]))
    return rows


def _build_resumo(rows: list[dict]) -> dict:
    latest = max(
        (row["ultima_atualizacao"] for row in rows if row.get("ultima_atualizacao")),
        default=None,
    )

    group_table = []
    for group_name in MAPA_FORCA_GROUPS:
        row = {"grupo": group_name}
        for orgao_label, orgao_short in (
            ("PMESP", "PM"),
            ("DER", "DER"),
            ("CONCESSIONÁRIA", "CONC"),
        ):
            for sigla, situacao_label in SITUACAO_SIGLAS:
                key = f"{orgao_short}-{sigla}"
                row[key] = sum(
                    1
                    for item in rows
                    if item["grupo"] == group_name
                    and item["orgao"] == orgao_label
                    and item["situacao"] == situacao_label
                )
        group_table.append(row)

    total_row = {"grupo": "TOTAL"}
    for orgao_short in ("PM", "DER", "CONC"):
        for sigla, _ in SITUACAO_SIGLAS:
            key = f"{orgao_short}-{sigla}"
            total_row[key] = sum(item[key] for item in group_table)
    group_table.append(total_row)

    type_table = []
    for type_name in MAPA_FORCA_TYPE_ORDER:
        type_table.append(
            {
                "tipo_veiculo": type_name,
                "PMESP": sum(1 for row in rows if row["tipo_veiculo"] == type_name and row["orgao"] == "PMESP"),
                "DER": sum(1 for row in rows if row["tipo_veiculo"] == type_name and row["orgao"] == "DER"),
                "CONCESSIONÁRIA": sum(1 for row in rows if row["tipo_veiculo"] == type_name and row["orgao"] == "CONCESSIONÁRIA"),
            }
        )

    grafismo = {
        "SIM": {orgao: sum(1 for row in rows if row["grafismo"] == "SIM" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
        "NÃO": {orgao: sum(1 for row in rows if row["grafismo"] == "NÃO" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
    }
    descaracterizadas = {
        orgao: sum(1 for row in rows if row["grafismo"] == "DESCARACTERIZADA" and row["orgao"] == orgao)
        for orgao in ORGAO_ORDER
    }
    tag = {
        "SIM": {orgao: sum(1 for row in rows if row["tag_sem_parar"] == "SIM" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
        "NÃO": {orgao: sum(1 for row in rows if row["tag_sem_parar"] == "NÃO" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
    }
    telemetria = {
        "SIM": {orgao: sum(1 for row in rows if row["telemetria"] == "SIM" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
        "NÃO": {orgao: sum(1 for row in rows if row["telemetria"] == "NÃO" and row["orgao"] == orgao) for orgao in ORGAO_ORDER},
    }

    return {
        "ultima_atualizacao": latest.isoformat() if latest else None,
        "total_registros": len(rows),
        "tabela_grupo_situacao_orgao": group_table,
        "tabela_tipo_orgao": type_table,
        "tabela_grafismo": grafismo,
        "tabela_descaracterizadas": descaracterizadas,
        "tabela_tag": tag,
        "tabela_telemetria": telemetria,
    }


def _resolve_rows_and_summary(
    db: Session,
    current_user: User,
    *,
    q: str | None = None,
    cia: int | None = None,
    pel: int | None = None,
    grupo: str | None = None,
    situacao: str | None = None,
    orgao: str | None = None,
    tipo_veiculo: str | None = None,
    grafismo: str | None = None,
    tag_sem_parar: str | None = None,
    telemetria: str | None = None,
) -> tuple[list[dict], dict]:
    rows = _load_rows(
        db,
        current_user,
        q=q,
        cia=cia,
        pel=pel,
        grupo=grupo,
        situacao=situacao,
        orgao=orgao,
        tipo_veiculo=tipo_veiculo,
        grafismo=grafismo,
        tag_sem_parar=tag_sem_parar,
        telemetria=telemetria,
    )
    return rows, _build_resumo(rows)


def _get_vehicle_or_400(db: Session, current_user: User, viatura_id: int) -> FleetVehicle:
    vehicle = (
        _filtered_vehicle_query(db, current_user)
        .filter(FleetVehicle.id == viatura_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=400, detail="Viatura informada não encontrada.")
    return vehicle


def _get_mapa_or_404(db: Session, current_user: User, mapa_id: int) -> MapaForca:
    mapa = (
        db.query(MapaForca)
        .join(FleetVehicle, FleetVehicle.id == MapaForca.viatura_id)
        .filter(MapaForca.id == mapa_id)
        .first()
    )
    if not mapa:
        raise HTTPException(status_code=404, detail="Registro do mapa força não encontrado.")
    if not can_access_unit(current_user, mapa.viatura.unit_id):
        raise HTTPException(status_code=403, detail="Sem permissão.")
    return mapa


@router.get("/", response_model=list[MapaForcaRowOut])
def list_mapa_forca(
    q: str | None = Query(default=None),
    cia: int | None = Query(default=None),
    pel: int | None = Query(default=None),
    grupo: str | None = Query(default=None),
    situacao: str | None = Query(default=None),
    orgao: str | None = Query(default=None),
    tipo_veiculo: str | None = Query(default=None),
    grafismo: str | None = Query(default=None),
    tag_sem_parar: str | None = Query(default=None),
    telemetria: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    return _load_rows(
        db,
        current_user,
        q=q,
        cia=cia,
        pel=pel,
        grupo=grupo,
        situacao=situacao,
        orgao=orgao,
        tipo_veiculo=tipo_veiculo,
        grafismo=grafismo,
        tag_sem_parar=tag_sem_parar,
        telemetria=telemetria,
    )


@router.get("/resumo", response_model=MapaForcaResumoOut)
def get_mapa_forca_resumo(
    q: str | None = Query(default=None),
    cia: int | None = Query(default=None),
    pel: int | None = Query(default=None),
    grupo: str | None = Query(default=None),
    situacao: str | None = Query(default=None),
    orgao: str | None = Query(default=None),
    tipo_veiculo: str | None = Query(default=None),
    grafismo: str | None = Query(default=None),
    tag_sem_parar: str | None = Query(default=None),
    telemetria: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    _, summary = _resolve_rows_and_summary(
        db,
        current_user,
        q=q,
        cia=cia,
        pel=pel,
        grupo=grupo,
        situacao=situacao,
        orgao=orgao,
        tipo_veiculo=tipo_veiculo,
        grafismo=grafismo,
        tag_sem_parar=tag_sem_parar,
        telemetria=telemetria,
    )
    return summary


@router.get("/buscar-viatura", response_model=list[BuscarViaturaOut])
def buscar_viatura_por_prefixo(
    prefixo: str = Query(min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    term = f"%{prefixo.strip()}%"
    vehicles = (
        _filtered_vehicle_query(db, current_user)
        .filter((FleetVehicle.prefix.ilike(term)) | (FleetVehicle.plate.ilike(term)))
        .order_by(FleetVehicle.prefix.asc())
        .limit(20)
        .all()
    )
    return [_serialize_busca(vehicle) for vehicle in vehicles]


@router.get("/exportar-excel")
def exportar_mapa_forca_excel(
    q: str | None = Query(default=None),
    cia: int | None = Query(default=None),
    pel: int | None = Query(default=None),
    grupo: str | None = Query(default=None),
    situacao: str | None = Query(default=None),
    orgao: str | None = Query(default=None),
    tipo_veiculo: str | None = Query(default=None),
    grafismo: str | None = Query(default=None),
    tag_sem_parar: str | None = Query(default=None),
    telemetria: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    rows, summary = _resolve_rows_and_summary(
        db,
        current_user,
        q=q,
        cia=cia,
        pel=pel,
        grupo=grupo,
        situacao=situacao,
        orgao=orgao,
        tipo_veiculo=tipo_veiculo,
        grafismo=grafismo,
        tag_sem_parar=tag_sem_parar,
        telemetria=telemetria,
    )
    return {
        "title": "COMANDO DE POLICIAMENTO RODOVIÁRIO — 5º BPRv",
        "subtitle": "MAPA FORÇA DE VIATURAS",
        "ultima_atualizacao": summary["ultima_atualizacao"],
        "rows": rows,
        "summary": summary,
    }


@router.get("/exportar-pdf")
def exportar_mapa_forca_pdf(
    q: str | None = Query(default=None),
    cia: int | None = Query(default=None),
    pel: int | None = Query(default=None),
    grupo: str | None = Query(default=None),
    situacao: str | None = Query(default=None),
    orgao: str | None = Query(default=None),
    tipo_veiculo: str | None = Query(default=None),
    grafismo: str | None = Query(default=None),
    tag_sem_parar: str | None = Query(default=None),
    telemetria: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    rows, summary = _resolve_rows_and_summary(
        db,
        current_user,
        q=q,
        cia=cia,
        pel=pel,
        grupo=grupo,
        situacao=situacao,
        orgao=orgao,
        tipo_veiculo=tipo_veiculo,
        grafismo=grafismo,
        tag_sem_parar=tag_sem_parar,
        telemetria=telemetria,
    )
    return {
        "title": "COMANDO DE POLICIAMENTO RODOVIÁRIO — 5º BPRv",
        "subtitle": "MAPA FORÇA DE VIATURAS",
        "ultima_atualizacao": summary["ultima_atualizacao"],
        "rows": rows,
        "summary": summary,
    }


@router.get("/{mapa_id}", response_model=MapaForcaRowOut)
def get_mapa_forca(
    mapa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    mapa = _get_mapa_or_404(db, current_user, mapa_id)
    return _build_row(mapa.viatura, mapa, mapa.seq or 1)


@router.post("/", response_model=MapaForcaRowOut, status_code=status.HTTP_201_CREATED)
def create_mapa_forca(
    payload: MapaForcaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    vehicle = _get_vehicle_or_400(db, current_user, payload.viatura_id)
    exists = db.query(MapaForca).filter(MapaForca.viatura_id == vehicle.id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Esta viatura já possui registro no mapa força.")

    next_seq = payload.seq
    if next_seq is None:
        current_max = db.query(func.max(MapaForca.seq)).scalar() or 0
        next_seq = current_max + 1

    item = MapaForca(
        viatura_id=vehicle.id,
        seq=next_seq,
        bprv=5,
        cia=_resolve_cia_from_unit(vehicle),
        pel=payload.pel,
        grafismo=_normalize_text(payload.grafismo) or None,
        tag_sem_parar=_normalize_yes_no(payload.tag_sem_parar) if payload.tag_sem_parar else None,
        observacao=_normalize_text(payload.observacao) or None,
        ultima_atualizacao=datetime.utcnow(),
        updated_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_row(vehicle, item, item.seq or 1)


@router.put("/{mapa_id}", response_model=MapaForcaRowOut)
def update_mapa_forca(
    mapa_id: int,
    payload: MapaForcaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_user(MODULE_P4)),
):
    item = _get_mapa_or_404(db, current_user, mapa_id)
    vehicle = item.viatura
    if payload.viatura_id is not None and payload.viatura_id != item.viatura_id:
        vehicle = _get_vehicle_or_400(db, current_user, payload.viatura_id)
        duplicate = (
            db.query(MapaForca)
            .filter(MapaForca.viatura_id == vehicle.id, MapaForca.id != item.id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="A viatura selecionada já possui registro no mapa força.")
        item.viatura_id = vehicle.id

    if payload.seq is not None:
        item.seq = payload.seq
    if payload.pel is not None:
        item.pel = payload.pel
    if payload.grafismo is not None:
        item.grafismo = _normalize_text(payload.grafismo) or None
    if payload.tag_sem_parar is not None:
        item.tag_sem_parar = _normalize_yes_no(payload.tag_sem_parar) if payload.tag_sem_parar else None
    if payload.observacao is not None:
        item.observacao = _normalize_text(payload.observacao) or None

    item.bprv = 5
    item.cia = _resolve_cia_from_unit(vehicle)
    item.ultima_atualizacao = datetime.utcnow()
    item.updated_by = current_user.id

    db.commit()
    db.refresh(item)
    return _build_row(vehicle, item, item.seq or 1)
