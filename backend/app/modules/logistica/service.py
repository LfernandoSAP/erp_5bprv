import logging
import unicodedata
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.fleet_vehicle import FleetVehicle
from app.models.fleet_vehicle_movement import FleetVehicleMovement
from app.models.estoque import (
    EstoqueEntrada,
    EstoqueFornecedor,
    EstoqueMovimentacao,
    EstoqueOrdemManutencao,
    EstoqueProduto,
    EstoqueSaida,
)
from app.models.item import Item
from app.models.item_movement import ItemMovement
from app.models.material_belico import MaterialBelico
from app.models.material_belico_movement import MaterialBelicoMovement
from app.models.police_officer import PoliceOfficer
from app.models.sector import Sector
from app.models.tpd_talonario import TpdTalonario
from app.models.user import User
from app.modules.logistica.fleet_constants import (
    VALID_FLEET_GROUP_CODES,
    VALID_FLEET_TELEMETRY_OPTIONS,
)
from app.modules.logistica import repository
from app.schemas.estoque import (
    EstoqueEntradaCreate,
    EstoqueEntradaUpdate,
    EstoqueFornecedorCreate,
    EstoqueFornecedorUpdate,
    EstoqueMovimentacaoCreate,
    EstoqueOrdemManutencaoCreate,
    EstoqueOrdemManutencaoUpdate,
    EstoqueProdutoCreate,
    EstoqueProdutoUpdate,
    EstoqueSaidaCreate,
    EstoqueSaidaUpdate,
)
from app.schemas.item import ItemCreate, ItemUpdate
from app.schemas.tpd_talonario import TpdTalonarioCreate, TpdTalonarioUpdate
from app.shared.models.action_log import ActionLog
from app.shared.utils.scope import (
    MODULE_P4,
    apply_unit_scope,
    can_access_unit,
    filter_movements_by_unit_ids,
    apply_movement_unit_scope,
    require_module_access,
    require_unit_access,
    resolve_filter_unit_ids,
    resolve_unit_id_for_creation,
)

VALID_CUSTODY_TYPES = {"POLICIAL", "SETOR", "RESERVA_UNIDADE", "VIATURA"}
VALID_MATERIAL_BELICO_CUSTODY_TYPES = {"POLICIAL", "SETOR", "RESERVA_UNIDADE"}
VALID_CDC_MATERIAL_TYPES = {
    "ESCUDO_BALISTICO",
    "ESCUDO_ANTI_TUMULTO",
    "CAPACETE_BALISTICO",
    "CAPACETE_ANTI_TUMULTO",
    "PERNEIRA",
    "EXOESQUELETO",
    "LANCADOR",
}
VALID_EXOSKELETON_SIZES = {"P", "M", "G"}
logger = logging.getLogger(__name__)


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão.")


def _not_found(detail: str = "Não encontrado") -> HTTPException:
    return HTTPException(status_code=404, detail=detail)


def _require_p4_access(current_user: User) -> None:
    try:
        require_module_access(current_user, MODULE_P4)
    except PermissionError:
        raise _forbidden()


def _normalize_category_key(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_only.split())


def _is_municao_category(category: str | None) -> bool:
    normalized = _normalize_category_key(category)
    return normalized in {"municoes", "municoes quimicas"}


def _has_material_belico_quantity_transfer(category: str | None) -> bool:
    normalized = _normalize_category_key(category)
    return normalized in {"municoes", "municoes quimicas"}


def _is_regular_ammo_category(category: str | None) -> bool:
    normalized = _normalize_category_key(category)
    return normalized == "municoes"


def _normalize_ammo_caliber(value: str | None) -> str | None:
    normalized = (value or "").strip()
    if normalized == "552":
        return "556"
    if normalized == "Taser-Operacional":
        return "Cartucho Taser"
    return normalized or None


def _normalize_estoque_text(value: str | None) -> str | None:
    if value is None:
        return None

    return (
        str(value)
        .replace("Dep?sito", "Depósito")
        .replace("RelatÃ³rio", "Relatório")
        .replace("Relat?rio", "Relatório")
        .replace("ManutenÃ§Ã£o", "Manutenção")
        .replace("Manuten??o", "Manutenção")
        .replace("manuten??o", "manutenção")
        .replace("SituaÃ§Ã£o", "Situação")
        .replace("Situa??o", "Situação")
        .replace("situa??o", "situação")
        .replace("HistÃ³rico", "Histórico")
        .replace("Hist?rico", "Histórico")
        .replace("hist??rico", "histórico")
        .replace("MovimentaÃ§Ãµes", "Movimentações")
        .replace("movimenta??es", "movimentações")
        .replace("ResponsÃ¡vel", "Responsável")
        .replace("Respons?vel", "Responsável")
        .replace("respons??vel", "responsável")
        .replace("ObservaÃ§Ã£o", "Observação")
        .replace("Observa??o", "Observação")
        .replace("observa??o", "observação")
        .replace("CrÃ­tico", "Crítico")
        .replace("Cr?tico", "Crítico")
        .replace("cr??tico", "crítico")
        .replace("MÃ­nimo", "Mínimo")
        .replace("M?nimo", "Mínimo")
        .replace("m??nimo", "mínimo")
        .replace("LocalizaÃ§Ã£o", "Localização")
        .replace("Localiza??o", "Localização")
        .replace("localiza??o", "localização")
        .replace("Equipe de manuten??o", "Equipe de manutenção")
        .replace("Sa?da", "Saída")
        .replace("Revis?o", "Revisão")
        .replace("peri?dica", "periódica")
        .replace("avalia??o", "avaliação")
        .replace("t?cnica", "técnica")
        .replace("m?dulo", "módulo")
        .replace("Pe?as", "Peças")
        .replace("pe?as", "peças")
        .replace("Log?stica", "Logística")
    )


def _normalize_material_belico_text(value: str | None) -> str | None:
    if value is None:
        return None

    return (
        str(value)
        .replace("BalÃ­stico", "Balístico")
        .replace("LanÃ§ador", "Lançador")
        .replace("ConcessionÃ¡ria", "Concessionária")
        .replace("NÃºmero de sÃ©rie", "Número de série")
        .replace("NÃºmero de lote", "Número de lote")
        .replace("NÂº de Lote", "Nº de Lote")
        .replace("MuniÃ§Ã£o", "Munição")
        .replace("MuniÃ§Ãµes", "Munições")
        .replace("muni??o", "munição")
        .replace("muni??es", "munições")
        .replace("BÃ©lico", "Bélico")
        .replace("bÃ©lico", "bélico")
        .replace("ResponsÃ¡vel", "Responsável")
        .replace("respons??vel", "responsável")
        .replace("ObservaÃ§Ã£o", "Observação")
        .replace("observa??o", "observação")
        .replace("HistÃ³rico", "Histórico")
        .replace("hist??rico", "histórico")
        .replace("TransferÃªncia", "Transferência")
        .replace("transfer??ncia", "transferência")
        .replace("NÃ£o", "Não")
        .replace("n??o", "não")
    )


def _normalize_logistica_text(value: str | None) -> str | None:
    if value is None:
        return None

    return (
        str(value)
        .replace("TalonÃ¡rio", "Talonário")
        .replace("EletrÃ´nico", "Eletrônico")
        .replace("ManutenÃ§Ã£o", "Manutenção")
        .replace("DescriÃ§Ã£o", "Descrição")
        .replace("LocalizaÃ§Ã£o", "Localização")
        .replace("NÃºmero de sÃ©rie", "Número de série")
        .replace("PatrimÃ´nio", "Patrimônio")
        .replace("NÃ£o", "Não")
        .replace("responsÃ¡vel", "responsável")
        .replace("ResponsÃ¡vel", "Responsável")
        .replace("TelemÃ¡tica", "Telemática")
        .replace("OperaÃ§Ãµes", "Operações")
        .replace("ArmÃ¡rio", "Armário")
        .replace("tÃ©rmica", "térmica")
        .replace("alteraÃ§Ãµes", "alterações")
        .replace("histÃ³rico", "histórico")
        .replace("Ã§", "ç")
        .replace("Ã£", "ã")
        .replace("Ã¡", "á")
        .replace("Ã©", "é")
        .replace("Ã­", "í")
        .replace("Ã³", "ó")
        .replace("Ãº", "ú")
        .replace("Ã´", "ô")
        .replace("Ãª", "ê")
    )


def _sanitize_item_model(item: Item | None):
    if item is None:
        return None

    for field in [
        "name",
        "modelo",
        "category",
        "description",
        "serial_number",
        "asset_tag",
        "detentor",
        "detentor_outros",
        "status",
        "location",
        "notes",
    ]:
        if hasattr(item, field):
            setattr(item, field, _normalize_logistica_text(getattr(item, field)))
    return item


def _sanitize_item_models(items):
    return [_sanitize_item_model(item) for item in items]


def _sanitize_tpd_talonario_model(item: TpdTalonario | None):
    if item is None:
        return None

    for field in [
        "name",
        "modelo",
        "category",
        "description",
        "serial_number",
        "asset_tag",
        "detentor",
        "detentor_outros",
        "status",
        "location",
        "notes",
    ]:
        if hasattr(item, field):
            setattr(item, field, _normalize_logistica_text(getattr(item, field)))
    return item


def _sanitize_tpd_talonario_models(items):
    return [_sanitize_tpd_talonario_model(item) for item in items]


def _sanitize_material_belico_model(item: MaterialBelico | None):
    if item is None:
        return None

    for field in [
        "posto_grad",
        "re",
        "nome",
        "cia_em",
        "opm_atual",
        "category",
        "item_name",
        "lot_number",
        "item_brand",
        "item_model",
        "item_model_other",
        "item_type",
        "item_gender",
        "item_size",
        "item_holder",
        "item_holder_other",
        "cdc_material_type",
        "cdc_exoskeleton_size",
        "municao_lote",
        "armamento_num_serie",
        "armamento_patrimonio",
        "algema_num_serie",
        "algema_patrimonio",
        "colete_num_serie",
        "colete_patrimonio",
    ]:
        if hasattr(item, field):
            setattr(item, field, _normalize_material_belico_text(getattr(item, field)))

    return item


def _sanitize_material_belico_models(items):
    return [_sanitize_material_belico_model(item) for item in items]


def _sanitize_material_belico_movement(movement: MaterialBelicoMovement | None):
    if movement is None:
        return None

    for field in ["movement_type", "details"]:
        if hasattr(movement, field):
            setattr(movement, field, _normalize_material_belico_text(getattr(movement, field)))

    return movement


def _sanitize_material_belico_movements(items):
    return [_sanitize_material_belico_movement(item) for item in items]


def _sanitize_estoque_model(item, fields: list[str]):
    if item is None:
        return None
    for field in fields:
        if hasattr(item, field):
            current = getattr(item, field)
            if isinstance(current, str) or current is None:
                setattr(item, field, _normalize_estoque_text(current))
    return item


def _sanitize_estoque_models(items, fields: list[str]):
    return [_sanitize_estoque_model(item, fields) for item in items]



def _resolve_filter_unit_ids(db: Session, unit_id: int) -> set[int]:
    try:
        return resolve_filter_unit_ids(db, unit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")


def _ensure_scope(current_user: User, item: Item):
    try:
        require_unit_access(current_user, item.unit_id)
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão.",
        )


def _get_scoped_police_officer(
    db: Session,
    current_user: User,
    police_officer_id: int | None,
    unit_id: int,
):
    if police_officer_id is None:
        return None

    officer = (
        apply_unit_scope(db.query(PoliceOfficer), PoliceOfficer, current_user)
        .filter(PoliceOfficer.id == police_officer_id)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")

    if not officer.is_active:
        raise HTTPException(status_code=400, detail="Policial informado está inativo.")

    if officer.unit_id != unit_id:
        raise HTTPException(
            status_code=400,
            detail="O policial informado precisa pertencer a mesma unidade do material.",
        )

    return officer


def _get_scoped_sector(
    db: Session,
    current_user: User,
    sector_id: int | None,
    unit_id: int,
):
    if sector_id is None:
        return None

    sector = (
        apply_unit_scope(db.query(Sector), Sector, current_user)
        .filter(Sector.id == sector_id)
        .first()
    )
    if not sector:
        raise HTTPException(status_code=400, detail="Setor informado não encontrado.")

    if sector.unit_id != unit_id:
        raise HTTPException(
            status_code=400,
            detail="Setor informado não encontrado para a unidade.",
        )

    return sector


def _get_scoped_fleet_vehicle(
    db: Session,
    current_user: User,
    fleet_vehicle_id: int | None,
    unit_id: int,
):
    if fleet_vehicle_id is None:
        return None

    vehicle = (
        apply_unit_scope(db.query(FleetVehicle), FleetVehicle, current_user)
        .filter(FleetVehicle.id == fleet_vehicle_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=400, detail="Viatura informada não encontrada.")

    if not vehicle.is_active:
        raise HTTPException(status_code=400, detail="Viatura informada está inativa.")

    if vehicle.category not in {"VIATURA_04_RODAS", "MOTOCICLETA"}:
        raise HTTPException(status_code=400, detail="Apenas viaturas e motocicletas podem ser vinculadas.")

    if vehicle.unit_id != unit_id:
        raise HTTPException(
            status_code=400,
            detail="A viatura informada precisa pertencer a mesma unidade do material.",
        )

    return vehicle


def _normalize_custody(
    db: Session,
    current_user: User,
    unit_id: int,
    sector_id: int | None,
    custody_type: str | None,
    custody_sector_id: int | None,
    police_officer_id: int | None,
    fleet_vehicle_id: int | None,
):
    normalized_type = (custody_type or "").strip().upper()
    if police_officer_id is not None:
        normalized_type = "POLICIAL"
    elif fleet_vehicle_id is not None:
        normalized_type = "VIATURA"
    elif custody_sector_id is not None:
        normalized_type = "SETOR"
    elif not normalized_type:
        normalized_type = "RESERVA_UNIDADE"

    if normalized_type not in VALID_CUSTODY_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de responsabilidade inválido.")

    admin_sector = _get_scoped_sector(db, current_user, sector_id, unit_id)
    custody_sector = _get_scoped_sector(
        db,
        current_user,
        custody_sector_id or sector_id,
        unit_id,
    )
    officer = _get_scoped_police_officer(db, current_user, police_officer_id, unit_id)
    fleet_vehicle = _get_scoped_fleet_vehicle(
        db,
        current_user,
        fleet_vehicle_id,
        unit_id,
    )

    if normalized_type == "POLICIAL":
        if officer is None:
            raise HTTPException(
                status_code=400,
                detail="Selecione um policial para responsabilidade individual.",
            )
        return normalized_type, admin_sector.id if admin_sector else sector_id, None, officer.id, None

    if normalized_type == "VIATURA":
        if fleet_vehicle is None:
            raise HTTPException(
                status_code=400,
                detail="Selecione a viatura vinculada para responsabilidade de viatura.",
            )
        return normalized_type, admin_sector.id if admin_sector else sector_id, None, None, fleet_vehicle.id

    if normalized_type == "SETOR":
        if custody_sector is None:
            raise HTTPException(
                status_code=400,
                detail="Selecione um setor para responsabilidade do setor.",
            )
        return normalized_type, custody_sector.id, custody_sector.id, None, None

    return normalized_type, admin_sector.id if admin_sector else sector_id, None, None, None


def list_items(
    *,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_items(db), Item, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        filter_unit_ids = _resolve_filter_unit_ids(db, unit_id)
        query = query.filter(Item.unit_id.in_(filter_unit_ids))
        logger.info(
            "items.list scoped_search user_id=%s selected_unit_id=%s applied_unit_ids=%s",
            current_user.id,
            unit_id,
            sorted(filter_unit_ids),
        )

    if not include_inactive:
        query = query.filter(Item.is_active == True)  # noqa

    rows = query.order_by(Item.id.desc()).all()
    if unit_id is not None:
        logger.info(
            "items.list result_count=%s result_unit_ids=%s",
            len(rows),
            [row.unit_id for row in rows],
        )
    return _sanitize_item_models(rows)


def search_items(
    *,
    q: str,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_items(db), Item, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        filter_unit_ids = _resolve_filter_unit_ids(db, unit_id)
        query = query.filter(Item.unit_id.in_(filter_unit_ids))
        logger.info(
            "items.search scoped_search user_id=%s selected_unit_id=%s term=%s applied_unit_ids=%s",
            current_user.id,
            unit_id,
            q,
            sorted(filter_unit_ids),
        )

    if not include_inactive:
        query = query.filter(Item.is_active == True)  # noqa

    term = f"%{q.strip()}%"
    query = query.filter(
        or_(
            Item.name.ilike(term),
            Item.category.ilike(term),
            Item.description.ilike(term),
            Item.serial_number.ilike(term),
            Item.asset_tag.ilike(term),
            Item.location.ilike(term),
            Item.notes.ilike(term),
        )
    )

    rows = query.order_by(Item.id.desc()).all()
    if unit_id is not None:
        logger.info(
            "items.search result_count=%s result_unit_ids=%s",
            len(rows),
            [row.unit_id for row in rows],
        )
    return _sanitize_item_models(rows)


def create_item(
    *,
    payload: ItemCreate,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    unit_id = resolve_unit_id_for_creation(current_user, getattr(payload, "unit_id", None))
    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    logger.info(
        "items.create payload user_id=%s unit_id=%s raw_custody_type=%s raw_sector_id=%s raw_custody_sector_id=%s raw_police_officer_id=%s raw_fleet_vehicle_id=%s raw_detentor=%s raw_detentor_outros=%s",
        current_user.id,
        unit_id,
        payload.custody_type,
        payload.sector_id,
        payload.custody_sector_id,
        payload.police_officer_id,
        payload.fleet_vehicle_id,
        payload.detentor,
        payload.detentor_outros,
    )

    custody_type, sector_id, custody_sector_id, police_officer_id, fleet_vehicle_id = _normalize_custody(
        db,
        current_user,
        unit_id,
        payload.sector_id,
        payload.custody_type,
        payload.custody_sector_id,
        payload.police_officer_id,
        payload.fleet_vehicle_id,
    )

    logger.info(
        "items.create normalized user_id=%s unit_id=%s custody_type=%s sector_id=%s custody_sector_id=%s police_officer_id=%s fleet_vehicle_id=%s",
        current_user.id,
        unit_id,
        custody_type,
        sector_id,
        custody_sector_id,
        police_officer_id,
        fleet_vehicle_id,
    )

    item = Item(
        unit_id=unit_id,
        sector_id=sector_id,
        custody_type=custody_type,
        custody_sector_id=custody_sector_id,
        police_officer_id=police_officer_id,
        fleet_vehicle_id=fleet_vehicle_id,
        name=payload.name,
        modelo=payload.modelo,
        category=payload.category,
        description=payload.description,
        serial_number=payload.serial_number,
        asset_tag=payload.asset_tag,
        detentor=payload.detentor,
        detentor_outros=payload.detentor_outros,
        status=payload.status,
        value=payload.value,
        location=payload.location,
        notes=payload.notes,
        is_active=True,
    )

    try:
        repository.add_item(db, item)
        repository.add_action_log(
            db,
            item_id=item.id,
            user_id=current_user.id,
            action="CREATE",
            details=f"Item criado: {item.name}",
        )
        return _sanitize_item_model(item)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Número de série já cadastrado.")


def get_item(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_item_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)
    return _sanitize_item_model(item)


def update_item(
    *,
    item_id: int,
    payload: ItemUpdate,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_item_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)

    updates = payload.model_dump(exclude_unset=True)
    original_unit_id = item.unit_id
    target_unit_id = updates.get("unit_id", item.unit_id)

    logger.info(
        "items.update payload item_id=%s user_id=%s current_unit_id=%s updates=%s",
        item_id,
        current_user.id,
        item.unit_id,
        updates,
    )

    if "unit_id" in updates:
        unit = repository.get_unit_by_id(db, target_unit_id)
        if not unit:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        item.unit_id = target_unit_id

    sector_candidate = updates.get("sector_id", item.sector_id)
    custody_type_candidate = updates.get("custody_type", item.custody_type)
    custody_sector_candidate = updates.get("custody_sector_id", item.custody_sector_id)
    police_officer_candidate = updates.get("police_officer_id", item.police_officer_id)
    fleet_vehicle_candidate = updates.get("fleet_vehicle_id", item.fleet_vehicle_id)

    if "unit_id" in updates and target_unit_id != original_unit_id:
        sector_candidate = updates.get("sector_id")
        custody_sector_candidate = updates.get("custody_sector_id")
        if "police_officer_id" not in updates:
            police_officer_candidate = None
        if "fleet_vehicle_id" not in updates:
            fleet_vehicle_candidate = None

    custody_type, sector_id, custody_sector_id, police_officer_id, fleet_vehicle_id = _normalize_custody(
        db,
        current_user,
        target_unit_id,
        sector_candidate,
        custody_type_candidate,
        custody_sector_candidate,
        police_officer_candidate,
        fleet_vehicle_candidate,
    )

    logger.info(
        "items.update normalized item_id=%s user_id=%s target_unit_id=%s custody_type=%s sector_id=%s custody_sector_id=%s police_officer_id=%s fleet_vehicle_id=%s",
        item_id,
        current_user.id,
        target_unit_id,
        custody_type,
        sector_id,
        custody_sector_id,
        police_officer_id,
        fleet_vehicle_id,
    )

    item.sector_id = sector_id
    item.custody_type = custody_type
    item.custody_sector_id = custody_sector_id
    item.police_officer_id = police_officer_id
    item.fleet_vehicle_id = fleet_vehicle_id

    for key, value in updates.items():
        if key not in {
            "unit_id",
            "sector_id",
            "custody_type",
            "custody_sector_id",
            "police_officer_id",
            "fleet_vehicle_id",
        }:
            setattr(item, key, value)

    repository.save_item(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="UPDATE",
        details=f"Item editado: {item.name}",
    )
    return _sanitize_item_model(item)


def delete_item(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_item_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)
    item.is_active = False
    item.status = "BAIXADO"
    repository.save_item(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="DELETE",
        details=f"Item inativado: {item.name}",
    )


def restore_item(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_item_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)
    item.is_active = True
    item.status = "EM_ESTOQUE"
    repository.save_item(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="RESTORE",
        details=f"Item restaurado: {item.name}",
    )
    return _sanitize_item_model(item)


def list_tpd_talonarios(
    *,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_tpd_talonarios(db), TpdTalonario, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        filter_unit_ids = _resolve_filter_unit_ids(db, unit_id)
        query = query.filter(TpdTalonario.unit_id.in_(filter_unit_ids))

    if not include_inactive:
        query = query.filter(TpdTalonario.is_active == True)  # noqa

    return _sanitize_tpd_talonario_models(query.order_by(TpdTalonario.id.desc()).all())


def search_tpd_talonarios(
    *,
    q: str,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_tpd_talonarios(db), TpdTalonario, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        filter_unit_ids = _resolve_filter_unit_ids(db, unit_id)
        query = query.filter(TpdTalonario.unit_id.in_(filter_unit_ids))

    if not include_inactive:
        query = query.filter(TpdTalonario.is_active == True)  # noqa

    term = f"%{q.strip()}%"
    query = query.filter(
        or_(
            TpdTalonario.name.ilike(term),
            TpdTalonario.modelo.ilike(term),
            TpdTalonario.category.ilike(term),
            TpdTalonario.description.ilike(term),
            TpdTalonario.serial_number.ilike(term),
            TpdTalonario.asset_tag.ilike(term),
            TpdTalonario.location.ilike(term),
            TpdTalonario.notes.ilike(term),
        )
    )

    return _sanitize_tpd_talonario_models(query.order_by(TpdTalonario.id.desc()).all())


def create_tpd_talonario(
    *,
    payload: TpdTalonarioCreate,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    unit_id = resolve_unit_id_for_creation(current_user, getattr(payload, "unit_id", None))
    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    custody_type, sector_id, custody_sector_id, police_officer_id, fleet_vehicle_id = _normalize_custody(
        db,
        current_user,
        unit_id,
        payload.sector_id,
        payload.custody_type,
        payload.custody_sector_id,
        payload.police_officer_id,
        payload.fleet_vehicle_id,
    )

    item = TpdTalonario(
        unit_id=unit_id,
        sector_id=sector_id,
        custody_type=custody_type,
        custody_sector_id=custody_sector_id,
        police_officer_id=police_officer_id,
        fleet_vehicle_id=fleet_vehicle_id,
        name=payload.name,
        modelo=payload.modelo,
        category=payload.category,
        description=payload.description,
        serial_number=payload.serial_number,
        asset_tag=payload.asset_tag,
        detentor=payload.detentor,
        detentor_outros=payload.detentor_outros,
        status=payload.status,
        value=payload.value,
        location=payload.location,
        notes=payload.notes,
        is_active=True,
    )

    try:
        repository.add_tpd_talonario(db, item)
        repository.add_action_log(
            db,
            item_id=item.id,
            user_id=current_user.id,
            action="CREATE",
            details=f"TPD/Talonário criado: {item.name}",
        )
        return _sanitize_tpd_talonario_model(item)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Número de série já cadastrado.")


def get_tpd_talonario(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_tpd_talonario_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)
    return _sanitize_tpd_talonario_model(item)


def update_tpd_talonario(
    *,
    item_id: int,
    payload: TpdTalonarioUpdate,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_tpd_talonario_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)

    updates = payload.model_dump(exclude_unset=True)
    original_unit_id = item.unit_id
    target_unit_id = updates.get("unit_id", item.unit_id)

    if "unit_id" in updates:
        unit = repository.get_unit_by_id(db, target_unit_id)
        if not unit:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        item.unit_id = target_unit_id

    sector_candidate = updates.get("sector_id", item.sector_id)
    custody_type_candidate = updates.get("custody_type", item.custody_type)
    custody_sector_candidate = updates.get("custody_sector_id", item.custody_sector_id)
    police_officer_candidate = updates.get("police_officer_id", item.police_officer_id)
    fleet_vehicle_candidate = updates.get("fleet_vehicle_id", item.fleet_vehicle_id)

    if "unit_id" in updates and target_unit_id != original_unit_id:
        sector_candidate = updates.get("sector_id")
        custody_sector_candidate = updates.get("custody_sector_id")
        if "police_officer_id" not in updates:
            police_officer_candidate = None
        if "fleet_vehicle_id" not in updates:
            fleet_vehicle_candidate = None

    custody_type, sector_id, custody_sector_id, police_officer_id, fleet_vehicle_id = _normalize_custody(
        db,
        current_user,
        target_unit_id,
        sector_candidate,
        custody_type_candidate,
        custody_sector_candidate,
        police_officer_candidate,
        fleet_vehicle_candidate,
    )

    item.sector_id = sector_id
    item.custody_type = custody_type
    item.custody_sector_id = custody_sector_id
    item.police_officer_id = police_officer_id
    item.fleet_vehicle_id = fleet_vehicle_id

    for key, value in updates.items():
        if key not in {
            "unit_id",
            "sector_id",
            "custody_type",
            "custody_sector_id",
            "police_officer_id",
            "fleet_vehicle_id",
        }:
            setattr(item, key, value)

    repository.save_tpd_talonario(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="UPDATE",
        details=f"TPD/Talonário editado: {item.name}",
    )
    return _sanitize_tpd_talonario_model(item)


def delete_tpd_talonario(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_tpd_talonario_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)
    item.is_active = False
    item.status = "BAIXADO"
    repository.save_tpd_talonario(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="DELETE",
        details=f"TPD/Talonário inativado: {item.name}",
    )


def restore_tpd_talonario(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_tpd_talonario_by_id(db, item_id)
    if not item:
        raise _not_found()

    _ensure_scope(current_user, item)
    item.is_active = True
    item.status = "EM_ESTOQUE"
    repository.save_tpd_talonario(db, item)
    repository.add_action_log(
        db,
        item_id=item.id,
        user_id=current_user.id,
        action="RESTORE",
        details=f"TPD/Talonário restaurado: {item.name}",
    )
    return _sanitize_tpd_talonario_model(item)


def list_movements(
    *,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = (
        repository.query_item_movements(db)
        .join(Item, ItemMovement.item_id == Item.id)
        .order_by(ItemMovement.id.desc())
    )
    query = apply_movement_unit_scope(query, ItemMovement, current_user)

    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = filter_movements_by_unit_ids(query, ItemMovement, filter_unit_ids)

    return query.all()


def create_movement(
    *,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_item_by_id(db, payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    _ensure_scope(current_user, item)

    from_unit_id = payload.from_unit_id or item.unit_id
    from_sector_id = payload.from_sector_id if payload.from_sector_id is not None else item.sector_id
    from_custody_type = payload.from_custody_type or item.custody_type
    from_custody_sector_id = (
        payload.from_custody_sector_id
        if payload.from_custody_sector_id is not None
        else item.custody_sector_id
    )
    from_police_officer_id = (
        payload.from_police_officer_id
        if payload.from_police_officer_id is not None
        else item.police_officer_id
    )
    from_fleet_vehicle_id = (
        payload.from_fleet_vehicle_id
        if payload.from_fleet_vehicle_id is not None
        else item.fleet_vehicle_id
    )
    to_unit_id = payload.to_unit_id if payload.to_unit_id is not None else item.unit_id
    to_sector_id = payload.to_sector_id
    to_custody_type = payload.to_custody_type or item.custody_type
    to_custody_sector_id = payload.to_custody_sector_id
    to_police_officer_id = payload.to_police_officer_id
    to_fleet_vehicle_id = payload.to_fleet_vehicle_id
    from_unit = None
    to_unit = None

    if from_unit_id is not None:
        from_unit = repository.get_unit_by_id(db, from_unit_id)
        if not from_unit:
            raise HTTPException(status_code=400, detail="Unidade de origem não encontrada.")
    if to_unit_id is not None:
        to_unit = repository.get_unit_by_id(db, to_unit_id)
        if not to_unit:
            raise HTTPException(status_code=400, detail="Unidade de destino não encontrada.")
        if not can_access_unit(current_user, to_unit_id):
            raise _forbidden()

    (
        from_custody_type,
        from_sector_id,
        from_custody_sector_id,
        from_police_officer_id,
        from_fleet_vehicle_id,
    ) = _normalize_custody(
        db,
        current_user,
        from_unit_id,
        from_sector_id,
        from_custody_type,
        from_custody_sector_id,
        from_police_officer_id,
        from_fleet_vehicle_id,
    )
    (
        to_custody_type,
        to_sector_id,
        to_custody_sector_id,
        to_police_officer_id,
        to_fleet_vehicle_id,
    ) = _normalize_custody(
        db,
        current_user,
        to_unit_id,
        to_sector_id,
        to_custody_type,
        to_custody_sector_id,
        to_police_officer_id,
        to_fleet_vehicle_id,
    )

    from_sector = _get_scoped_sector(db, current_user, from_sector_id, from_unit_id)
    to_sector = _get_scoped_sector(db, current_user, to_sector_id, to_unit_id)
    from_officer = _get_scoped_police_officer(
        db,
        current_user,
        from_police_officer_id,
        from_unit_id,
    )
    to_officer = _get_scoped_police_officer(
        db,
        current_user,
        to_police_officer_id,
        to_unit_id,
    )
    from_vehicle = _get_scoped_fleet_vehicle(
        db,
        current_user,
        from_fleet_vehicle_id,
        from_unit_id,
    )
    to_vehicle = _get_scoped_fleet_vehicle(
        db,
        current_user,
        to_fleet_vehicle_id,
        to_unit_id,
    )

    movement = ItemMovement(
        item_id=payload.item_id,
        user_id=current_user.id,
        movement_type=payload.movement_type,
        from_unit_id=from_unit_id,
        from_sector_id=from_sector_id,
        from_custody_type=from_custody_type,
        from_custody_sector_id=from_custody_sector_id,
        from_police_officer_id=from_police_officer_id,
        from_fleet_vehicle_id=from_fleet_vehicle_id,
        to_unit_id=to_unit_id,
        to_sector_id=to_sector_id,
        to_custody_type=to_custody_type,
        to_custody_sector_id=to_custody_sector_id,
        to_police_officer_id=to_police_officer_id,
        to_fleet_vehicle_id=to_fleet_vehicle_id,
        from_location=payload.from_location,
        to_location=payload.to_location,
        details=payload.details,
    )

    db.add(movement)

    item.unit_id = to_unit_id
    item.sector_id = to_sector_id
    item.custody_type = to_custody_type
    item.custody_sector_id = to_custody_sector_id
    item.police_officer_id = to_police_officer_id
    item.fleet_vehicle_id = to_fleet_vehicle_id

    if "to_location" in payload.model_fields_set:
        item.location = payload.to_location

    if payload.movement_type == "TRANSFERENCIA":
        item.status = "EM_USO"
    elif payload.movement_type == "MANUTENCAO":
        item.status = "MANUTENCAO"
    elif payload.movement_type == "BAIXA":
        item.status = "BAIXADO"

    log = ActionLog(
        item_id=item.id,
        user_id=current_user.id,
        action="MOVEMENT",
        details=(
            f"{payload.movement_type} de {from_unit.display_name if from_unit_id is not None else 'sem unidade'}"
            f" / {from_sector.name if from_sector_id is not None else 'sem setor'} "
            f"/ {from_officer.re_with_digit if from_officer is not None else 'sem policial'} "
            f"/ {from_vehicle.prefix if from_vehicle is not None else 'sem viatura'} "
            f"para {to_unit.display_name if to_unit_id is not None else 'sem unidade'}"
            f" / {to_sector.name if to_sector_id is not None else 'sem setor'}"
            f" / {to_officer.re_with_digit if to_officer is not None else 'sem policial'}"
            f" / {to_vehicle.prefix if to_vehicle is not None else 'sem viatura'}"
        ),
    )
    db.add(log)
    db.commit()
    db.refresh(movement)
    return movement


def _serialize_vehicle(vehicle: FleetVehicle):
    return {
        "id": vehicle.id,
        "unit_id": vehicle.unit_id,
        "unit_name": vehicle.unit.name if vehicle.unit else None,
        "unit_label": vehicle.unit.display_name if vehicle.unit else None,
        "police_officer_id": vehicle.police_officer_id,
        "police_officer_re": vehicle.police_officer.re_with_digit if vehicle.police_officer else None,
        "police_officer_name": vehicle.police_officer.war_name if vehicle.police_officer else None,
        "category": vehicle.category,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "year": vehicle.year,
        "prefix": vehicle.prefix,
        "group_code": vehicle.group_code,
        "telemetry": vehicle.telemetry,
        "wheel_count": vehicle.wheel_count,
        "holder": vehicle.holder,
        "patrimony": vehicle.patrimony,
        "rental_company": vehicle.rental_company,
        "contract_number": vehicle.contract_number,
        "contract_start": vehicle.contract_start,
        "contract_end": vehicle.contract_end,
        "contract_term": vehicle.contract_term,
        "licensing": vehicle.licensing,
        "plate": vehicle.plate,
        "fuel_type": vehicle.fuel_type,
        "current_mileage": vehicle.current_mileage,
        "current_mileage_date": vehicle.current_mileage_date,
        "last_review_date": vehicle.last_review_date,
        "last_review_mileage": vehicle.last_review_mileage,
        "situation": vehicle.situation,
        "employment": vehicle.employment,
        "renavam": vehicle.renavam,
        "chassis": vehicle.chassis,
        "color": vehicle.color,
        "manufacture_year": vehicle.manufacture_year,
        "model_year": vehicle.model_year,
        "fixed_driver": vehicle.fixed_driver,
        "notes": vehicle.notes,
        "is_active": vehicle.is_active,
    }


def _serialize_vehicle_movement(movement: FleetVehicleMovement):
    return {
        "id": movement.id,
        "fleet_vehicle_id": movement.fleet_vehicle_id,
        "user_id": movement.user_id,
        "movement_type": movement.movement_type,
        "from_unit_id": movement.from_unit_id,
        "to_unit_id": movement.to_unit_id,
        "from_police_officer_id": movement.from_police_officer_id,
        "to_police_officer_id": movement.to_police_officer_id,
        "details": movement.details,
        "created_at": movement.created_at,
        "item_name": movement.item_name,
        "user_name": movement.user_name,
        "from_unit_label": movement.from_unit_label,
        "to_unit_label": movement.to_unit_label,
        "from_officer_re": movement.from_officer_re,
        "to_officer_re": movement.to_officer_re,
        "from_officer_name": movement.from_officer_name,
        "to_officer_name": movement.to_officer_name,
    }


def _get_vehicle_or_404(db: Session, current_user: User, vehicle_id: int) -> FleetVehicle:
    vehicle = (
        apply_unit_scope(repository.query_fleet_vehicles(db), FleetVehicle, current_user)
        .filter(FleetVehicle.id == vehicle_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Viatura não encontrada.")
    return vehicle


def _validate_unit_access(db: Session, current_user: User, unit_id: int) -> None:
    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
    if not can_access_unit(current_user, unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a esta unidade.",
        )


def _validate_police_officer_access(
    db: Session,
    current_user: User,
    police_officer_id: int | None,
    unit_id: int,
) -> None:
    if police_officer_id is None:
        return

    officer = repository.get_police_officer_by_id(db, police_officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")
    if officer.unit_id != unit_id:
        raise HTTPException(
            status_code=400,
            detail="O policial informado precisa pertencer a mesma unidade do registro da frota.",
        )
    if not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a este policial.",
        )


def list_vehicles(
    *,
    q: str | None,
    include_inactive: bool,
    category: str | None,
    unit_id: int | None,
    group_code: str | None,
    telemetry: str | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_fleet_vehicles(db), FleetVehicle, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = query.filter(FleetVehicle.unit_id.in_(filter_unit_ids))

    if category and category.strip():
        query = query.filter(FleetVehicle.category == category.strip())
    if group_code and group_code.strip():
        query = query.filter(FleetVehicle.group_code == group_code.strip())
    if telemetry and telemetry.strip():
        query = query.filter(FleetVehicle.telemetry == telemetry.strip())

    if not include_inactive:
        query = query.filter(FleetVehicle.is_active.is_(True))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                FleetVehicle.brand.ilike(term),
                FleetVehicle.model.ilike(term),
                FleetVehicle.prefix.ilike(term),
                FleetVehicle.holder.ilike(term),
                FleetVehicle.patrimony.ilike(term),
                FleetVehicle.rental_company.ilike(term),
                FleetVehicle.plate.ilike(term),
                FleetVehicle.renavam.ilike(term),
                FleetVehicle.chassis.ilike(term),
                FleetVehicle.situation.ilike(term),
            )
        )

    vehicles = query.order_by(FleetVehicle.brand, FleetVehicle.model, FleetVehicle.prefix).all()
    return [_serialize_vehicle(vehicle) for vehicle in vehicles]


def list_vehicle_movements(
    *,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = (
        repository.query_fleet_vehicle_movements(db)
        .join(FleetVehicle, FleetVehicleMovement.fleet_vehicle_id == FleetVehicle.id)
        .order_by(FleetVehicleMovement.id.desc())
    )
    query = apply_movement_unit_scope(query, FleetVehicleMovement, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = filter_movements_by_unit_ids(query, FleetVehicleMovement, filter_unit_ids)
    return [_serialize_vehicle_movement(movement) for movement in query.all()]


def create_vehicle(
    *,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    _validate_unit_access(db, current_user, payload.unit_id)
    _validate_police_officer_access(db, current_user, payload.police_officer_id, payload.unit_id)

    vehicle = FleetVehicle(
        unit_id=payload.unit_id,
        police_officer_id=payload.police_officer_id,
        category=payload.category,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        prefix=payload.prefix,
        group_code=payload.group_code,
        telemetry=payload.telemetry,
        wheel_count=payload.wheel_count,
        holder=payload.holder,
        patrimony=payload.patrimony,
        rental_company=payload.rental_company,
        contract_number=payload.contract_number,
        contract_start=payload.contract_start,
        contract_end=payload.contract_end,
        contract_term=payload.contract_term,
        licensing=payload.licensing,
        plate=payload.plate,
        fuel_type=payload.fuel_type,
        current_mileage=payload.current_mileage,
        current_mileage_date=payload.current_mileage_date,
        last_review_date=payload.last_review_date,
        last_review_mileage=payload.last_review_mileage,
        situation=payload.situation,
        employment=payload.employment,
        renavam=payload.renavam,
        chassis=payload.chassis,
        color=payload.color,
        manufacture_year=payload.manufacture_year,
        model_year=payload.model_year,
        fixed_driver=payload.fixed_driver,
        notes=payload.notes,
        is_active=payload.is_active,
    )
    repository.add_fleet_vehicle(db, vehicle)
    return _serialize_vehicle(vehicle)


def update_vehicle(
    *,
    vehicle_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    vehicle = _get_vehicle_or_404(db, current_user, vehicle_id)
    target_unit_id = payload.unit_id if payload.unit_id is not None else vehicle.unit_id
    if payload.unit_id is not None:
        _validate_unit_access(db, current_user, payload.unit_id)
    if payload.police_officer_id is not None:
        _validate_police_officer_access(db, current_user, payload.police_officer_id, target_unit_id)

    if payload.unit_id is not None:
        vehicle.unit_id = payload.unit_id

    if payload.brand is not None:
        vehicle.brand = payload.brand
    if payload.model is not None:
        vehicle.model = payload.model
    if payload.year is not None:
        vehicle.year = payload.year
    if payload.prefix is not None:
        vehicle.prefix = payload.prefix
    if payload.group_code is not None or "group_code" in payload.model_fields_set:
        vehicle.group_code = payload.group_code
    if payload.telemetry is not None or "telemetry" in payload.model_fields_set:
        vehicle.telemetry = payload.telemetry
    if payload.wheel_count is not None or "wheel_count" in payload.model_fields_set:
        vehicle.wheel_count = payload.wheel_count
    if payload.holder is not None:
        vehicle.holder = payload.holder
    if payload.patrimony is not None or "patrimony" in payload.model_fields_set:
        vehicle.patrimony = payload.patrimony
    if payload.rental_company is not None or "rental_company" in payload.model_fields_set:
        vehicle.rental_company = payload.rental_company
    if payload.contract_number is not None or "contract_number" in payload.model_fields_set:
        vehicle.contract_number = payload.contract_number
    if payload.contract_start is not None or "contract_start" in payload.model_fields_set:
        vehicle.contract_start = payload.contract_start
    if payload.contract_end is not None or "contract_end" in payload.model_fields_set:
        vehicle.contract_end = payload.contract_end
    if payload.contract_term is not None or "contract_term" in payload.model_fields_set:
        vehicle.contract_term = payload.contract_term
    if payload.licensing is not None or "licensing" in payload.model_fields_set:
        vehicle.licensing = payload.licensing
    if payload.plate is not None or "plate" in payload.model_fields_set:
        vehicle.plate = payload.plate
    if payload.fuel_type is not None or "fuel_type" in payload.model_fields_set:
        vehicle.fuel_type = payload.fuel_type
    if payload.current_mileage is not None or "current_mileage" in payload.model_fields_set:
        vehicle.current_mileage = payload.current_mileage
    if payload.current_mileage_date is not None or "current_mileage_date" in payload.model_fields_set:
        vehicle.current_mileage_date = payload.current_mileage_date
    if payload.last_review_date is not None or "last_review_date" in payload.model_fields_set:
        vehicle.last_review_date = payload.last_review_date
    if payload.last_review_mileage is not None or "last_review_mileage" in payload.model_fields_set:
        vehicle.last_review_mileage = payload.last_review_mileage
    if payload.situation is not None or "situation" in payload.model_fields_set:
        vehicle.situation = payload.situation
    if payload.employment is not None or "employment" in payload.model_fields_set:
        vehicle.employment = payload.employment
    if payload.renavam is not None or "renavam" in payload.model_fields_set:
        vehicle.renavam = payload.renavam
    if payload.chassis is not None or "chassis" in payload.model_fields_set:
        vehicle.chassis = payload.chassis
    if payload.color is not None or "color" in payload.model_fields_set:
        vehicle.color = payload.color
    if payload.manufacture_year is not None or "manufacture_year" in payload.model_fields_set:
        vehicle.manufacture_year = payload.manufacture_year
    if payload.model_year is not None or "model_year" in payload.model_fields_set:
        vehicle.model_year = payload.model_year
    if payload.fixed_driver is not None or "fixed_driver" in payload.model_fields_set:
        vehicle.fixed_driver = payload.fixed_driver
    if payload.notes is not None or "notes" in payload.model_fields_set:
        vehicle.notes = payload.notes
    if payload.police_officer_id is not None or "police_officer_id" in payload.model_fields_set:
        vehicle.police_officer_id = payload.police_officer_id
    if payload.is_active is not None:
        vehicle.is_active = payload.is_active

    repository.save_fleet_vehicle(db, vehicle)
    return _serialize_vehicle(vehicle)


def get_vehicle(
    *,
    vehicle_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)
    return _serialize_vehicle(_get_vehicle_or_404(db, current_user, vehicle_id))


def move_vehicle(
    *,
    vehicle_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    vehicle = repository.get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Viatura não encontrada.")

    try:
        require_unit_access(current_user, vehicle.unit_id)
    except PermissionError:
        raise _forbidden()

    target_unit_id = vehicle.unit_id
    if payload.to_unit_id is not None:
        requested_unit_id = resolve_unit_id_for_creation(current_user, payload.to_unit_id)
        if requested_unit_id != payload.to_unit_id:
            raise _forbidden()
        _validate_unit_access(db, current_user, requested_unit_id)
        target_unit_id = requested_unit_id

    target_officer = None
    if payload.to_police_officer_id is not None:
        _validate_police_officer_access(db, current_user, payload.to_police_officer_id, target_unit_id)
        target_officer = repository.get_police_officer_by_id(db, payload.to_police_officer_id)

    movement = FleetVehicleMovement(
        fleet_vehicle_id=vehicle.id,
        user_id=current_user.id,
        movement_type=payload.movement_type,
        from_unit_id=vehicle.unit_id,
        to_unit_id=target_unit_id,
        from_police_officer_id=vehicle.police_officer_id,
        to_police_officer_id=payload.to_police_officer_id,
        details=payload.details,
    )
    db.add(movement)

    vehicle.unit_id = target_unit_id
    vehicle.police_officer_id = payload.to_police_officer_id
    if payload.movement_type == "BAIXA":
        vehicle.is_active = False
        vehicle.police_officer_id = None
    else:
        vehicle.is_active = True
        if target_officer is None and payload.movement_type == "MANUTENCAO":
            vehicle.police_officer_id = None

    db.commit()
    db.refresh(movement)
    return _serialize_vehicle_movement(movement)


def delete_vehicle(
    *,
    vehicle_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    vehicle = _get_vehicle_or_404(db, current_user, vehicle_id)
    if not can_manage_users_in_unit(current_user, vehicle.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem inativar viaturas desta unidade.",
        )
    vehicle.is_active = False
    db.commit()


def restore_vehicle(
    *,
    vehicle_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    vehicle = _get_vehicle_or_404(db, current_user, vehicle_id)
    if not can_manage_users_in_unit(current_user, vehicle.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem reativar viaturas desta unidade.",
        )
    vehicle.is_active = True
    repository.save_fleet_vehicle(db, vehicle)
    return _serialize_vehicle(vehicle)


def _normalize_cdc_fields(
    category: str | None,
    cdc_material_type: str | None,
    cdc_exoskeleton_size: str | None,
):
    if (category or "").strip() != "Material de CDC":
        return None, None

    normalized_type = (cdc_material_type or "").strip().upper()
    normalized_size = (cdc_exoskeleton_size or "").strip().upper()

    if normalized_type not in VALID_CDC_MATERIAL_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Selecione um material valido para Material de CDC.",
        )

    if normalized_type == "EXOESQUELETO":
        if normalized_size not in VALID_EXOSKELETON_SIZES:
            raise HTTPException(
                status_code=400,
                detail="Selecione o tamanho do exoesqueleto.",
            )
        return normalized_type, normalized_size

    return normalized_type, None


def _get_material_belico_scoped_police_officer(
    db: Session,
    current_user: User,
    police_officer_id: int | None,
):
    if police_officer_id is None:
        return None

    officer = repository.get_police_officer_by_id(db, police_officer_id)
    if not officer:
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")

    if not can_access_unit(current_user, officer.unit_id):
        raise HTTPException(status_code=400, detail="Policial informado não encontrado.")

    if not officer.is_active:
        raise HTTPException(status_code=400, detail="Policial informado está inativo.")

    return officer


def _get_material_belico_scoped_sector(
    db: Session,
    current_user: User,
    sector_id: int | None,
    unit_id: int,
):
    if sector_id is None:
        return None

    sector = repository.get_sector_by_id(db, sector_id)
    if not sector:
        raise HTTPException(status_code=400, detail="Setor informado não encontrado.")

    if not can_access_unit(current_user, sector.unit_id) or sector.unit_id != unit_id:
        raise HTTPException(status_code=400, detail="Setor informado não encontrado para a unidade.")

    return sector


def _resolve_unit_or_400(db: Session, unit_id: int):
    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
    return unit


def _normalize_material_belico_custody(
    db: Session,
    current_user: User,
    unit_id: int,
    custody_type: str | None,
    custody_sector_id: int | None,
    police_officer_id: int | None,
):
    normalized_type = (custody_type or "").strip().upper()
    if not normalized_type:
        if police_officer_id is not None:
            normalized_type = "POLICIAL"
        elif custody_sector_id is not None:
            normalized_type = "SETOR"
        else:
            normalized_type = "RESERVA_UNIDADE"

    if normalized_type not in VALID_MATERIAL_BELICO_CUSTODY_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de responsabilidade inválido.")

    sector = _get_material_belico_scoped_sector(db, current_user, custody_sector_id, unit_id)
    officer = _get_material_belico_scoped_police_officer(db, current_user, police_officer_id)

    if officer and officer.unit_id != unit_id:
        raise HTTPException(
            status_code=400,
            detail="O policial informado não pertence à unidade selecionada.",
        )

    if normalized_type == "POLICIAL":
        if officer is None:
            raise HTTPException(
                status_code=400,
                detail="Selecione um policial para responsabilidade individual.",
            )
        return normalized_type, None, officer

    if normalized_type == "SETOR":
        if sector is None:
            raise HTTPException(
                status_code=400,
                detail="Selecione um setor para responsabilidade do setor.",
            )
        return normalized_type, sector, None

    return normalized_type, None, None


def _apply_responsibility_snapshot(
    item: MaterialBelico,
    unit,
    custody_type: str,
    sector,
    officer,
):
    item.custody_type = custody_type
    item.custody_sector_id = sector.id if sector else None
    item.police_officer_id = officer.id if officer else None

    if officer is not None:
        item.posto_grad = officer.rank or item.posto_grad or "Policial"
        item.re = officer.re_with_digit
        item.nome = officer.full_name
        item.cia_em = officer.unit_label or (unit.display_name if unit else item.cia_em)
        item.opm_atual = unit.display_name if unit else (officer.unit_label or item.opm_atual)
        return

    if custody_type == "SETOR" and sector is not None:
        item.posto_grad = "SETOR"
        item.re = "SETOR"
        item.nome = sector.name
        item.cia_em = unit.display_name if unit else item.cia_em
        item.opm_atual = unit.display_name if unit else item.opm_atual
        return

    item.posto_grad = "RESERVA"
    item.re = "RESERVA"
    item.nome = "Reserva da unidade"
    item.cia_em = unit.display_name if unit else item.cia_em
    item.opm_atual = unit.display_name if unit else item.opm_atual


def list_material_belico(
    *,
    category: str | None,
    unit_id: int | None,
    db: Session,
    current_user: User,
    include_inactive: bool,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_material_belico(db), MaterialBelico, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = query.filter(MaterialBelico.unit_id.in_(filter_unit_ids))
    if category:
        query = query.filter(MaterialBelico.category == category)
    if not include_inactive:
        query = query.filter(MaterialBelico.is_active)
    rows = query.order_by(MaterialBelico.ordem.asc()).all()
    return _sanitize_material_belico_models(rows)


def create_material_belico(
    *,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    unit_id = resolve_unit_id_for_creation(current_user, payload.unit_id)
    unit = _resolve_unit_or_400(db, unit_id)
    custody_type, custody_sector, officer = _normalize_material_belico_custody(
        db,
        current_user,
        unit_id,
        payload.custody_type,
        payload.custody_sector_id,
        payload.police_officer_id,
    )
    cdc_material_type, cdc_exoskeleton_size = _normalize_cdc_fields(
        payload.category,
        payload.cdc_material_type,
        payload.cdc_exoskeleton_size,
    )
    normalized_item_model = _normalize_ammo_caliber(payload.item_model)
    municao_lote = payload.municao_lote
    if not municao_lote and _is_municao_category(payload.category):
        municao_lote = payload.lot_number

    item = MaterialBelico(
        unit_id=unit_id,
        custody_type=custody_type,
        custody_sector_id=custody_sector.id if custody_sector else None,
        police_officer_id=officer.id if officer else None,
        category=payload.category,
        ordem=payload.ordem,
        posto_grad=payload.posto_grad,
        re=payload.re,
        nome=payload.nome,
        cia_em=payload.cia_em,
        opm_atual=payload.opm_atual,
        armamento_num_serie=payload.armamento_num_serie,
        armamento_patrimonio=payload.armamento_patrimonio,
        municao_lote=municao_lote,
        algema_num_serie=payload.algema_num_serie,
        algema_patrimonio=payload.algema_patrimonio,
        colete_num_serie=payload.colete_num_serie,
        colete_patrimonio=payload.colete_patrimonio,
        item_name=payload.item_name,
        lot_number=payload.lot_number,
        expiration_date=payload.expiration_date,
        quantity=payload.quantity,
        item_brand=payload.item_brand,
        item_model=normalized_item_model,
        item_model_other=payload.item_model_other,
        item_type=payload.item_type,
        item_gender=payload.item_gender,
        item_size=payload.item_size,
        item_holder=payload.item_holder,
        item_holder_other=payload.item_holder_other,
        cdc_material_type=cdc_material_type,
        cdc_exoskeleton_size=cdc_exoskeleton_size,
        is_active=payload.is_active,
    )
    _apply_responsibility_snapshot(item, unit, custody_type, custody_sector, officer)
    try:
        repository.add_material_belico(db, item)
        return _sanitize_material_belico_model(item)
    except IntegrityError:
        db.rollback()
        logger.exception(
            "Erro de integridade ao cadastrar material bélico da categoria %s",
            payload.category,
        )
        raise HTTPException(status_code=400, detail="Erro ao cadastrar material bélico.")


def list_material_belico_controle_geral(
    *,
    unit_id: int | None,
    db: Session,
    current_user: User,
    include_inactive: bool,
):
    _require_p4_access(current_user)

    query = apply_unit_scope(repository.query_material_belico(db), MaterialBelico, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = query.filter(MaterialBelico.unit_id.in_(filter_unit_ids))
    if not include_inactive:
        query = query.filter(MaterialBelico.is_active)
    rows = query.order_by(MaterialBelico.ordem.asc()).all()
    return _sanitize_material_belico_models(rows)


def list_material_belico_movements(
    *,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    query = (
        repository.query_material_belico_movements(db)
        .join(MaterialBelico, MaterialBelicoMovement.material_belico_id == MaterialBelico.id)
        .order_by(MaterialBelicoMovement.id.desc())
    )
    query = apply_movement_unit_scope(query, MaterialBelicoMovement, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = filter_movements_by_unit_ids(query, MaterialBelicoMovement, filter_unit_ids)
    return _sanitize_material_belico_movements(query.all())


def list_material_belico_transfer_history(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)
    if not _has_material_belico_quantity_transfer(item.category):
        return []

    lot_number = item.lot_number or item.municao_lote
    query = (
        repository.query_material_belico_movements(db)
        .join(MaterialBelico, MaterialBelicoMovement.material_belico_id == MaterialBelico.id)
        .filter(MaterialBelicoMovement.quantity_transferred.isnot(None))
        .order_by(MaterialBelicoMovement.created_at.desc(), MaterialBelicoMovement.id.desc())
    )
    if lot_number:
        query = query.filter(
            or_(MaterialBelico.lot_number == lot_number, MaterialBelico.municao_lote == lot_number)
        )
    if item.item_model:
        query = query.filter(MaterialBelico.item_model == _normalize_ammo_caliber(item.item_model))
    if item.item_type:
        query = query.filter(MaterialBelico.item_type == item.item_type)

    query = apply_movement_unit_scope(query, MaterialBelicoMovement, current_user)
    return _sanitize_material_belico_movements(query.all())


def transfer_material_belico_municao(
    *,
    item_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)

    if not _has_material_belico_quantity_transfer(item.category):
        raise HTTPException(
            status_code=400,
            detail="Transferência disponível apenas para materiais com saldo atual.",
        )

    available_quantity = int(item.quantity or 0)
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="A quantidade transferida deve ser maior que zero.")
    if available_quantity <= 0:
        raise HTTPException(status_code=400, detail="Não há saldo disponível para transferência.")
    if payload.quantity > available_quantity:
        raise HTTPException(status_code=400, detail="A quantidade excede o saldo disponível.")

    requested_unit_id = resolve_unit_id_for_creation(current_user, payload.to_unit_id)
    if requested_unit_id != payload.to_unit_id:
        raise _forbidden()
    if requested_unit_id == item.unit_id:
        raise HTTPException(
            status_code=400,
            detail="Selecione uma unidade de destino diferente da unidade de origem.",
        )

    destination_unit = _resolve_unit_or_400(db, requested_unit_id)
    destination_sector = _get_material_belico_scoped_sector(
        db, current_user, payload.to_custody_sector_id, requested_unit_id
    )
    destination_custody_type = "SETOR" if destination_sector else "RESERVA_UNIDADE"
    normalized_caliber = _normalize_ammo_caliber(item.item_model)
    lot_number = item.lot_number or item.municao_lote

    destination_item = repository.find_matching_ammo_material_belico(
        db,
        category=item.category,
        unit_id=requested_unit_id,
        custody_type=destination_custody_type,
        custody_sector_id=destination_sector.id if destination_sector else None,
        lot_number=lot_number,
        item_model=normalized_caliber,
        item_type=item.item_type,
        exclude_item_id=item.id,
    )

    if destination_item:
        destination_item.quantity = int(destination_item.quantity or 0) + payload.quantity
        destination_item.is_active = True
        destination_item.item_model = normalized_caliber
        destination_item.lot_number = lot_number
        destination_item.municao_lote = lot_number
        _apply_responsibility_snapshot(
            destination_item,
            destination_unit,
            destination_custody_type,
            destination_sector,
            None,
        )
    else:
        destination_item = MaterialBelico(
            unit_id=requested_unit_id,
            custody_type=destination_custody_type,
            custody_sector_id=destination_sector.id if destination_sector else None,
            police_officer_id=None,
            category=item.category,
            ordem=item.ordem,
            posto_grad=item.posto_grad,
            re=item.re,
            nome=item.nome,
            cia_em=item.cia_em,
            opm_atual=item.opm_atual,
            armamento_num_serie=item.armamento_num_serie,
            armamento_patrimonio=item.armamento_patrimonio,
            municao_lote=lot_number,
            algema_num_serie=item.algema_num_serie,
            algema_patrimonio=item.algema_patrimonio,
            colete_num_serie=item.colete_num_serie,
            colete_patrimonio=item.colete_patrimonio,
            item_name=item.item_name,
            lot_number=lot_number,
            expiration_date=item.expiration_date,
            quantity=payload.quantity,
            item_brand=item.item_brand,
            item_model=normalized_caliber,
            item_model_other=item.item_model_other,
            item_type=item.item_type,
            item_gender=item.item_gender,
            item_size=item.item_size,
            item_holder=item.item_holder,
            item_holder_other=item.item_holder_other,
            cdc_material_type=item.cdc_material_type,
            cdc_exoskeleton_size=item.cdc_exoskeleton_size,
            is_active=True,
        )
        _apply_responsibility_snapshot(
            destination_item,
            destination_unit,
            destination_custody_type,
            destination_sector,
            None,
        )
        db.add(destination_item)

    movement = MaterialBelicoMovement(
        material_belico_id=item.id,
        user_id=current_user.id,
        movement_type="TRANSFERENCIA_MUNICAO" if _is_regular_ammo_category(item.category) else "TRANSFERENCIA_QUANTIDADE",
        from_unit_id=item.unit_id,
        to_unit_id=requested_unit_id,
        from_custody_type=item.custody_type,
        to_custody_type=destination_custody_type,
        from_custody_sector_id=item.custody_sector_id,
        to_custody_sector_id=destination_sector.id if destination_sector else None,
        from_police_officer_id=item.police_officer_id,
        to_police_officer_id=None,
        quantity_transferred=payload.quantity,
        details=((payload.details or "").strip() + (" | " if (payload.details or "").strip() else "") + f"Saldo anterior: {available_quantity} | Saldo atual: {available_quantity - payload.quantity}"),
    )
    db.add(movement)

    item.quantity = available_quantity - payload.quantity
    item.item_model = normalized_caliber
    item.lot_number = lot_number
    item.municao_lote = lot_number
    item.is_active = item.quantity > 0

    db.commit()
    db.refresh(movement)
    db.refresh(item)
    return {
        "success": True,
        "message": _normalize_material_belico_text("Transferência realizada com sucesso"),
        "saldo_restante": int(item.quantity or 0),
        "quantidade_transferida": payload.quantity,
    }


def create_material_belico_controle_geral(
    *,
    payload,
    db: Session,
    current_user: User,
):
    return create_material_belico(payload=payload, db=db, current_user=current_user)


def get_material_belico(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)
    return _sanitize_material_belico_model(item)


def update_material_belico(
    *,
    item_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)

    changes = payload.model_dump(exclude_unset=True)
    target_unit_id = item.unit_id
    if "unit_id" in changes and changes["unit_id"] is not None:
        requested_unit_id = changes["unit_id"]
        if resolve_unit_id_for_creation(current_user, requested_unit_id) != requested_unit_id:
            raise _forbidden()
        _resolve_unit_or_400(db, requested_unit_id)
        target_unit_id = requested_unit_id

    custody_type_candidate = changes.get("custody_type", item.custody_type)
    custody_sector_candidate = changes.get("custody_sector_id", item.custody_sector_id)
    police_officer_candidate = changes.get("police_officer_id", item.police_officer_id)
    if "unit_id" in changes and target_unit_id != item.unit_id and "police_officer_id" not in changes:
        police_officer_candidate = None

    custody_type, custody_sector, officer = _normalize_material_belico_custody(
        db,
        current_user,
        target_unit_id,
        custody_type_candidate,
        custody_sector_candidate,
        police_officer_candidate,
    )
    target_category = changes.get("category", item.category)
    cdc_material_type, cdc_exoskeleton_size = _normalize_cdc_fields(
        target_category,
        changes.get("cdc_material_type", item.cdc_material_type),
        changes.get("cdc_exoskeleton_size", item.cdc_exoskeleton_size),
    )
    if "item_model" in changes:
        changes["item_model"] = _normalize_ammo_caliber(changes.get("item_model"))
    if "lot_number" in changes and "municao_lote" not in changes and _is_municao_category(target_category):
        changes["municao_lote"] = changes.get("lot_number")

    for key, value in changes.items():
        if key not in {
            "custody_type",
            "custody_sector_id",
            "police_officer_id",
            "cdc_material_type",
            "cdc_exoskeleton_size",
        }:
            setattr(item, key, value)

    item.cdc_material_type = cdc_material_type
    item.cdc_exoskeleton_size = cdc_exoskeleton_size

    destination_unit = repository.get_unit_by_id(db, target_unit_id)
    _apply_responsibility_snapshot(item, destination_unit, custody_type, custody_sector, officer)
    repository.save_material_belico(db, item)
    return _sanitize_material_belico_model(item)


def delete_material_belico(
    *,
    item_id: int,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)
    item.is_active = False
    repository.save_material_belico(db, item)


def move_material_belico(
    *,
    item_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p4_access(current_user)

    item = repository.get_material_belico_by_id(db, item_id)
    if not item:
        raise _not_found()
    _ensure_scope(current_user, item)

    target_unit_id = item.unit_id
    if payload.to_unit_id is not None:
        requested_unit_id = resolve_unit_id_for_creation(current_user, payload.to_unit_id)
        if requested_unit_id != payload.to_unit_id:
            raise _forbidden()
        _resolve_unit_or_400(db, requested_unit_id)
        target_unit_id = requested_unit_id

    to_custody_type, to_custody_sector, target_officer = _normalize_material_belico_custody(
        db,
        current_user,
        target_unit_id,
        payload.to_custody_type,
        payload.to_custody_sector_id,
        payload.to_police_officer_id,
    )

    movement = MaterialBelicoMovement(
        material_belico_id=item.id,
        user_id=current_user.id,
        movement_type=payload.movement_type,
        from_unit_id=item.unit_id,
        to_unit_id=target_unit_id,
        from_custody_type=item.custody_type,
        to_custody_type=to_custody_type,
        from_custody_sector_id=item.custody_sector_id,
        to_custody_sector_id=to_custody_sector.id if to_custody_sector else None,
        from_police_officer_id=item.police_officer_id,
        to_police_officer_id=target_officer.id if target_officer else None,
        details=payload.details,
    )
    db.add(movement)

    item.unit_id = target_unit_id
    destination_unit = repository.get_unit_by_id(db, target_unit_id)
    _apply_responsibility_snapshot(
        item,
        destination_unit,
        to_custody_type,
        to_custody_sector,
        target_officer,
    )

    if payload.movement_type == "BAIXA":
        item.is_active = False
        _apply_responsibility_snapshot(item, destination_unit, "RESERVA_UNIDADE", None, None)
    elif payload.movement_type == "MANUTENCAO":
        item.police_officer_id = target_officer.id if target_officer else None
    else:
        item.is_active = True

    db.commit()
    db.refresh(movement)
    return _sanitize_material_belico_movement(movement)


def _ensure_p4_access(current_user: User):
    _require_p4_access(current_user)


def _parse_optional_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return value


def _build_ordem_numero(db: Session) -> str:
    count = repository.query_estoque_ordens_manutencao(db).count() + 1
    return f"OM-{datetime.now().year}-{count:04d}"


def _build_estoque_movimentacao_out(movimento: EstoqueMovimentacao):
    return {
        "id": movimento.id,
        "produto_id": movimento.produto_id,
        "tipo": _normalize_estoque_text(movimento.tipo),
        "quantidade": movimento.quantidade,
        "saldo_anterior": movimento.saldo_anterior,
        "saldo_atual": movimento.saldo_atual,
        "responsavel": _normalize_estoque_text(movimento.responsavel),
        "observacao": _normalize_estoque_text(movimento.observacao),
        "unidade_origem_id": movimento.unidade_origem_id,
        "unidade_destino_id": movimento.unidade_destino_id,
        "created_at": movimento.created_at,
        "produto_nome": _normalize_estoque_text(movimento.produto.nome) if movimento.produto else None,
        "unidade_origem_label": _normalize_estoque_text(movimento.unidade_origem.display_name) if movimento.unidade_origem else None,
        "unidade_destino_label": _normalize_estoque_text(movimento.unidade_destino.display_name) if movimento.unidade_destino else None,
    }


def list_estoque_produtos(*, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    rows = repository.query_estoque_produtos(db).order_by(EstoqueProduto.nome.asc()).all()
    return _sanitize_estoque_models(rows, ["nome", "codigo_patrimonio", "categoria", "unidade_medida", "localizacao", "observacoes", "status"])


def create_estoque_produto(*, payload: EstoqueProdutoCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = EstoqueProduto(**payload.model_dump())
    return _sanitize_estoque_model(repository.add_estoque_produto(db, item), ["nome", "codigo_patrimonio", "categoria", "unidade_medida", "localizacao", "observacoes", "status"])


def get_estoque_produto(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_produto_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    return _sanitize_estoque_model(item, ["nome", "codigo_patrimonio", "categoria", "unidade_medida", "localizacao", "observacoes", "status"])


def update_estoque_produto(*, item_id: int, payload: EstoqueProdutoUpdate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_produto_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    return _sanitize_estoque_model(repository.save_estoque_produto(db, item), ["nome", "codigo_patrimonio", "categoria", "unidade_medida", "localizacao", "observacoes", "status"])


def delete_estoque_produto(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_produto_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    item.is_active = False
    item.status = "Inativo"
    item.updated_at = datetime.utcnow()
    repository.save_estoque_produto(db, item)
    return None


def list_estoque_fornecedores(*, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    rows = repository.query_estoque_fornecedores(db).order_by(EstoqueFornecedor.nome.asc()).all()
    return _sanitize_estoque_models(rows, ["nome", "email", "endereco", "produto_servico", "observacoes", "status"])


def create_estoque_fornecedor(*, payload: EstoqueFornecedorCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = EstoqueFornecedor(**payload.model_dump())
    return _sanitize_estoque_model(repository.add_estoque_fornecedor(db, item), ["nome", "email", "endereco", "produto_servico", "observacoes", "status"])


def get_estoque_fornecedor(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_fornecedor_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    return _sanitize_estoque_model(item, ["nome", "email", "endereco", "produto_servico", "observacoes", "status"])


def update_estoque_fornecedor(*, item_id: int, payload: EstoqueFornecedorUpdate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_fornecedor_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    return _sanitize_estoque_model(repository.save_estoque_fornecedor(db, item), ["nome", "email", "endereco", "produto_servico", "observacoes", "status"])


def delete_estoque_fornecedor(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_fornecedor_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    item.is_active = False
    item.status = "Inativo"
    item.updated_at = datetime.utcnow()
    repository.save_estoque_fornecedor(db, item)
    return None


def _registrar_movimentacao_estoque(
    *,
    db: Session,
    produto: EstoqueProduto,
    tipo: str,
    quantidade: int,
    saldo_anterior: int,
    saldo_atual: int,
    responsavel: str | None,
    observacao: str | None,
    unidade_destino_id: int | None = None,
    entrada_id: int | None = None,
    saida_id: int | None = None,
    current_user: User,
):
    movimento = EstoqueMovimentacao(
        produto_id=produto.id,
        tipo=tipo,
        quantidade=quantidade,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
        responsavel=responsavel,
        observacao=observacao,
        unidade_destino_id=unidade_destino_id,
        entrada_id=entrada_id,
        saida_id=saida_id,
        created_by_user_id=current_user.id,
    )
    repository.add_estoque_movimentacao(db, movimento)
    return movimento


def list_estoque_entradas(*, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    rows = repository.query_estoque_entradas(db).order_by(EstoqueEntrada.id.desc()).all()
    return _sanitize_estoque_models(rows, ["numero_documento", "fornecedor_nome", "responsavel_recebimento", "observacoes"])


def create_estoque_entrada(*, payload: EstoqueEntradaCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    produto = repository.get_estoque_produto_by_id(db, payload.produto_id) if payload.produto_id else None
    produto_nome = str(payload.produto_nome or "").strip()

    if not produto and produto_nome:
        produto = (
            repository.query_estoque_produtos(db)
            .filter(EstoqueProduto.nome.ilike(produto_nome))
            .first()
        )

    if not produto and produto_nome:
        produto = EstoqueProduto(
            nome=produto_nome,
            categoria="Outros",
            unidade_medida="Unidade",
            estoque_minimo=0,
            estoque_atual=0,
            status="Ativo",
            is_active=True,
        )
        db.add(produto)
        db.flush()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    saldo_anterior = int(produto.estoque_atual or 0)
    saldo_atual = saldo_anterior + payload.quantidade_recebida
    entrada = EstoqueEntrada(
        produto_id=produto.id,
        quantidade_recebida=payload.quantidade_recebida,
        data_entrada=_parse_optional_datetime(payload.data_entrada) or datetime.utcnow(),
        numero_documento=payload.numero_documento,
        fornecedor_id=payload.fornecedor_id,
        fornecedor_nome=payload.fornecedor_nome,
        responsavel_recebimento=payload.responsavel_recebimento,
        unidade_destino_id=payload.unidade_destino_id,
        observacoes=payload.observacoes,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
        created_by_user_id=current_user.id,
    )
    db.add(entrada)
    produto.estoque_atual = saldo_atual
    db.commit()
    db.refresh(entrada)
    db.refresh(produto)
    _registrar_movimentacao_estoque(
        db=db,
        produto=produto,
        tipo="Entrada",
        quantidade=payload.quantidade_recebida,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
        responsavel=payload.responsavel_recebimento,
        observacao=payload.observacoes,
        unidade_destino_id=payload.unidade_destino_id,
        entrada_id=entrada.id,
        current_user=current_user,
    )
    return _sanitize_estoque_model(entrada, ["numero_documento", "fornecedor_nome", "responsavel_recebimento", "observacoes"])


def get_estoque_entrada(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_entrada_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Entrada não encontrada.")
    return _sanitize_estoque_model(item, ["numero_documento", "fornecedor_nome", "responsavel_recebimento", "observacoes"])


def update_estoque_entrada(*, item_id: int, payload: EstoqueEntradaUpdate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_entrada_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Entrada não encontrada.")
    produto = repository.get_estoque_produto_by_id(db, item.produto_id)
    novo_produto = repository.get_estoque_produto_by_id(db, payload.produto_id) if payload.produto_id else produto
    if not novo_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    if novo_produto.id != produto.id:
        raise HTTPException(status_code=400, detail="A edição da entrada não permite trocar o produto.")
    saldo_base = int(produto.estoque_atual or 0) - int(item.quantidade_recebida or 0)
    nova_quantidade = payload.quantidade_recebida if payload.quantidade_recebida is not None else item.quantidade_recebida
    produto.estoque_atual = saldo_base + int(nova_quantidade or 0)
    item.quantidade_recebida = nova_quantidade
    item.data_entrada = _parse_optional_datetime(payload.data_entrada) or item.data_entrada
    item.numero_documento = payload.numero_documento if payload.numero_documento is not None else item.numero_documento
    item.fornecedor_id = payload.fornecedor_id if payload.fornecedor_id is not None else item.fornecedor_id
    item.fornecedor_nome = payload.fornecedor_nome if payload.fornecedor_nome is not None else item.fornecedor_nome
    item.responsavel_recebimento = payload.responsavel_recebimento if payload.responsavel_recebimento is not None else item.responsavel_recebimento
    item.unidade_destino_id = payload.unidade_destino_id if payload.unidade_destino_id is not None else item.unidade_destino_id
    item.observacoes = payload.observacoes if payload.observacoes is not None else item.observacoes
    item.saldo_anterior = saldo_base
    item.saldo_atual = produto.estoque_atual
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    db.refresh(produto)
    return _sanitize_estoque_model(item, ["numero_documento", "fornecedor_nome", "responsavel_recebimento", "observacoes"])


def delete_estoque_entrada(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_entrada_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Entrada não encontrada.")
    produto = repository.get_estoque_produto_by_id(db, item.produto_id)
    if produto:
        produto.estoque_atual = max(int(produto.estoque_atual or 0) - int(item.quantidade_recebida or 0), 0)
    db.delete(item)
    db.commit()
    return None


def list_estoque_saidas(*, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    rows = repository.query_estoque_saidas(db).order_by(EstoqueSaida.id.desc()).all()
    return _sanitize_estoque_models(rows, ["motivo_saida", "destino_solicitante", "responsavel", "observacoes"])


def create_estoque_saida(*, payload: EstoqueSaidaCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    produto = repository.get_estoque_produto_by_id(db, payload.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    saldo_anterior = int(produto.estoque_atual or 0)
    if payload.quantidade > saldo_anterior:
        raise HTTPException(
            status_code=400,
            detail=f"Estoque insuficiente. Saldo disponível: {saldo_anterior} unidades.",
        )
    saldo_atual = saldo_anterior - payload.quantidade
    saida = EstoqueSaida(
        produto_id=payload.produto_id,
        quantidade=payload.quantidade,
        data_saida=_parse_optional_datetime(payload.data_saida) or datetime.utcnow(),
        motivo_saida=payload.motivo_saida,
        destino_solicitante=payload.destino_solicitante,
        responsavel=payload.responsavel,
        observacoes=payload.observacoes,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
        created_by_user_id=current_user.id,
    )
    db.add(saida)
    produto.estoque_atual = saldo_atual
    db.commit()
    db.refresh(saida)
    db.refresh(produto)
    _registrar_movimentacao_estoque(
        db=db,
        produto=produto,
        tipo="Saída",
        quantidade=payload.quantidade,
        saldo_anterior=saldo_anterior,
        saldo_atual=saldo_atual,
        responsavel=payload.responsavel,
        observacao=payload.observacoes,
        saida_id=saida.id,
        current_user=current_user,
    )
    return _sanitize_estoque_model(saida, ["motivo_saida", "destino_solicitante", "responsavel", "observacoes"])


def get_estoque_saida(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_saida_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Saída não encontrada.")
    return _sanitize_estoque_model(item, ["motivo_saida", "destino_solicitante", "responsavel", "observacoes"])


def update_estoque_saida(*, item_id: int, payload: EstoqueSaidaUpdate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_saida_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Saída não encontrada.")
    produto = repository.get_estoque_produto_by_id(db, item.produto_id)
    nova_quantidade = payload.quantidade if payload.quantidade is not None else item.quantidade
    saldo_base = int(produto.estoque_atual or 0) + int(item.quantidade or 0)
    if int(nova_quantidade or 0) > saldo_base:
        raise HTTPException(
            status_code=400,
            detail=f"Estoque insuficiente. Saldo disponível: {saldo_base} unidades.",
        )
    produto.estoque_atual = saldo_base - int(nova_quantidade or 0)
    item.quantidade = nova_quantidade
    item.data_saida = _parse_optional_datetime(payload.data_saida) or item.data_saida
    item.motivo_saida = payload.motivo_saida if payload.motivo_saida is not None else item.motivo_saida
    item.destino_solicitante = payload.destino_solicitante if payload.destino_solicitante is not None else item.destino_solicitante
    item.responsavel = payload.responsavel if payload.responsavel is not None else item.responsavel
    item.observacoes = payload.observacoes if payload.observacoes is not None else item.observacoes
    item.saldo_anterior = saldo_base
    item.saldo_atual = produto.estoque_atual
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    db.refresh(produto)
    return _sanitize_estoque_model(item, ["motivo_saida", "destino_solicitante", "responsavel", "observacoes"])


def delete_estoque_saida(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_saida_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Saída não encontrada.")
    produto = repository.get_estoque_produto_by_id(db, item.produto_id)
    if produto:
        produto.estoque_atual = int(produto.estoque_atual or 0) + int(item.quantidade or 0)
    db.delete(item)
    db.commit()
    return None


def list_estoque_ordens_manutencao(*, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    rows = repository.query_estoque_ordens_manutencao(db).order_by(EstoqueOrdemManutencao.id.desc()).all()
    return _sanitize_estoque_models(rows, ["tipo", "item_equipamento", "patrimonio_placa", "descricao_problema", "responsavel_tecnico", "pecas_utilizadas", "status", "observacoes"])


def create_estoque_ordem_manutencao(*, payload: EstoqueOrdemManutencaoCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = EstoqueOrdemManutencao(
        numero_ordem=_build_ordem_numero(db),
        tipo=payload.tipo,
        item_equipamento=payload.item_equipamento,
        patrimonio_placa=payload.patrimonio_placa,
        descricao_problema=payload.descricao_problema,
        data_abertura=_parse_optional_datetime(payload.data_abertura) or datetime.utcnow(),
        previsao_conclusao=_parse_optional_datetime(payload.previsao_conclusao),
        data_conclusao=_parse_optional_datetime(payload.data_conclusao),
        responsavel_tecnico=payload.responsavel_tecnico,
        pecas_utilizadas=payload.pecas_utilizadas,
        custo_estimado=payload.custo_estimado,
        custo_real=payload.custo_real,
        status=payload.status,
        observacoes=payload.observacoes,
        is_active=True,
    )
    return _sanitize_estoque_model(repository.add_estoque_ordem_manutencao(db, item), ["tipo", "item_equipamento", "patrimonio_placa", "descricao_problema", "responsavel_tecnico", "pecas_utilizadas", "status", "observacoes"])


def get_estoque_ordem_manutencao(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_ordem_manutencao_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ordem de manutenção não encontrada.")
    return _sanitize_estoque_model(item, ["tipo", "item_equipamento", "patrimonio_placa", "descricao_problema", "responsavel_tecnico", "pecas_utilizadas", "status", "observacoes"])


def update_estoque_ordem_manutencao(*, item_id: int, payload: EstoqueOrdemManutencaoUpdate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_ordem_manutencao_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ordem de manutenção não encontrada.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    return _sanitize_estoque_model(repository.save_estoque_ordem_manutencao(db, item), ["tipo", "item_equipamento", "patrimonio_placa", "descricao_problema", "responsavel_tecnico", "pecas_utilizadas", "status", "observacoes"])


def delete_estoque_ordem_manutencao(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_ordem_manutencao_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ordem de manutenção não encontrada.")
    item.is_active = False
    item.status = "Cancelada"
    item.updated_at = datetime.utcnow()
    repository.save_estoque_ordem_manutencao(db, item)
    return None


def list_estoque_movimentacoes(*, produto_id: int | None = None, data_inicial: datetime | None = None, data_final: datetime | None = None, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    query = repository.query_estoque_movimentacoes(db)
    if produto_id is not None:
        query = query.filter(EstoqueMovimentacao.produto_id == produto_id)
    if data_inicial is not None:
        query = query.filter(EstoqueMovimentacao.created_at >= data_inicial)
    if data_final is not None:
        query = query.filter(EstoqueMovimentacao.created_at <= data_final)
    rows = query.order_by(EstoqueMovimentacao.created_at.desc()).all()
    return [_build_estoque_movimentacao_out(row) for row in rows]


def get_estoque_movimentacao(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_movimentacao_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada.")
    return _build_estoque_movimentacao_out(item)


def create_estoque_movimentacao(*, payload: EstoqueMovimentacaoCreate, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    produto = repository.get_estoque_produto_by_id(db, payload.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    item = EstoqueMovimentacao(
        produto_id=payload.produto_id,
        entrada_id=payload.entrada_id,
        saida_id=payload.saida_id,
        tipo=payload.tipo,
        quantidade=payload.quantidade,
        saldo_anterior=payload.saldo_anterior,
        saldo_atual=payload.saldo_atual,
        responsavel=payload.responsavel,
        observacao=payload.observacao,
        unidade_origem_id=payload.unidade_origem_id,
        unidade_destino_id=payload.unidade_destino_id,
        created_by_user_id=current_user.id,
    )
    movimento = repository.add_estoque_movimentacao(db, item)
    return _build_estoque_movimentacao_out(movimento)


def delete_estoque_movimentacao(*, item_id: int, db: Session, current_user: User):
    _ensure_p4_access(current_user)
    item = repository.get_estoque_movimentacao_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada.")
    db.delete(item)
    db.commit()
    return None


__all__ = [
    "create_item",
    "create_material_belico",
    "create_material_belico_controle_geral",
    "create_movement",
    "create_tpd_talonario",
    "create_estoque_entrada",
    "create_estoque_fornecedor",
    "create_estoque_movimentacao",
    "create_estoque_ordem_manutencao",
    "create_estoque_produto",
    "create_estoque_saida",
    "create_vehicle",
    "delete_estoque_entrada",
    "delete_estoque_fornecedor",
    "delete_estoque_movimentacao",
    "delete_estoque_ordem_manutencao",
    "delete_estoque_produto",
    "delete_estoque_saida",
    "delete_item",
    "delete_material_belico",
    "delete_tpd_talonario",
    "delete_vehicle",
    "get_item",
    "get_estoque_entrada",
    "get_estoque_fornecedor",
    "get_estoque_movimentacao",
    "get_estoque_ordem_manutencao",
    "get_estoque_produto",
    "get_estoque_saida",
    "get_material_belico",
    "get_tpd_talonario",
    "get_vehicle",
    "list_vehicle_movements",
    "list_items",
    "list_estoque_entradas",
    "list_estoque_fornecedores",
    "list_estoque_movimentacoes",
    "list_estoque_ordens_manutencao",
    "list_estoque_produtos",
    "list_estoque_saidas",
    "list_material_belico",
    "list_material_belico_controle_geral",
    "list_material_belico_movements",
    "list_material_belico_transfer_history",
    "list_movements",
    "list_tpd_talonarios",
    "move_material_belico",
    "list_vehicles",
    "move_vehicle",
    "restore_item",
    "restore_tpd_talonario",
    "restore_vehicle",
    "search_items",
    "search_tpd_talonarios",
    "transfer_material_belico_municao",
    "update_estoque_entrada",
    "update_estoque_fornecedor",
    "update_estoque_ordem_manutencao",
    "update_estoque_produto",
    "update_estoque_saida",
    "update_item",
    "update_material_belico",
    "update_tpd_talonario",
    "update_vehicle",
]





