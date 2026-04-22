from datetime import date, datetime
from html import escape
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.material_belico import MaterialBelico
from app.models.police_officer import PoliceOfficer
from app.models.police_officer_movement import PoliceOfficerMovement
from app.models.romaneio_medida import RomaneioMedida
from app.models.sector import Sector
from app.models.unit import Unit
from app.models.user import User
from app.modules.rh import repository
from app.shared.utils.scope import (
    MODULE_P1,
    MODULE_TELEMATICA,
    apply_movement_unit_scope,
    apply_unit_scope,
    can_access_unit,
    can_manage_users_in_unit,
    filter_movements_by_unit_ids,
    get_accessible_unit_ids,
    require_module_access,
    resolve_filter_unit_ids,
    user_has_global_scope,
)


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")


def _require_p1_access(current_user: User) -> None:
    try:
        require_module_access(current_user, MODULE_P1)
    except PermissionError:
        raise _forbidden()


def _normalize_rh_text(value: str | None) -> str | None:
    if value is None:
        return None

    return (
        str(value)
        .replace("nÃƒÂ£o", "não")
        .replace("NÃƒÂ£o", "Não")
        .replace("jÃƒÂ¡", "já")
        .replace("MovimentaÃƒÂ§ÃƒÂ£o", "Movimentação")
        .replace("lotaÃƒÂ§ÃƒÂ£o", "lotação")
        .replace("VocÃƒÂª", "Você")
        .replace("permissÃƒÂ£o", "permissão")
        .replace("usuÃƒÂ¡rio", "usuário")
        .replace("UsuÃƒÂ¡rio", "Usuário")
        .replace("TelemÃƒÂ¡tica", "Telemática")
        .replace("OperaÃƒÂ§ÃƒÂµes", "Operações")
        .replace("PolÃƒÂ­cia", "Polícia")
        .replace("SÃƒÂ£o", "São")
        .replace("DescriÃƒÂ§ÃƒÂ£o", "Descrição")
        .replace("ObservaÃƒÂ§ÃƒÂ£o", "Observação")
        .replace("HistÃƒÂ³rico", "Histórico")
        .replace("EndereÃƒÂ§o", "Endereço")
        .replace("AssociaÃƒÂ§ÃƒÂµes", "Associações")
        .replace("cÃƒÂ´njuge", "cônjuge")
        .replace("ciÃƒÂªncia", "ciência")
        .replace("servico", "serviço")
    )


def _sanitize_police_officer_model(officer: PoliceOfficer | None):
    if officer is None:
        return None

    for field in [
        "full_name",
        "war_name",
        "rank",
        "address",
        "external_unit_name",
        "city",
        "state",
        "observation",
        "functional_email",
        "personal_email",
    ]:
        if hasattr(officer, field):
            current = getattr(officer, field)
            if isinstance(current, str) or current is None:
                setattr(officer, field, _normalize_rh_text(current))
    return officer


def _sanitize_police_officer_models(officers):
    return [_sanitize_police_officer_model(officer) for officer in officers]


def _sanitize_sector_model(sector: Sector | None):
    if sector is None:
        return None
    for field in ["name", "code"]:
        if hasattr(sector, field):
            current = getattr(sector, field)
            if isinstance(current, str) or current is None:
                setattr(sector, field, _normalize_rh_text(current))
    return sector


def _sanitize_sector_models(sectors):
    return [_sanitize_sector_model(sector) for sector in sectors]


def _sanitize_unit_model(unit: Unit | None):
    if unit is None:
        return None
    for field in ["name", "code", "codigo_opm", "type"]:
        if hasattr(unit, field):
            current = getattr(unit, field)
            if isinstance(current, str) or current is None:
                setattr(unit, field, _normalize_rh_text(current))
    return unit


def _sanitize_unit_models(units):
    return [_sanitize_unit_model(unit) for unit in units]


def _build_address_summary(payload) -> str | None:
    parts = []

    street_parts = [payload.street, payload.street_number]
    first_line = ", ".join([part.strip() for part in street_parts if part and part.strip()])
    if first_line:
        parts.append(first_line)

    if payload.address_details and payload.address_details.strip():
        parts.append(payload.address_details.strip())
    if payload.neighborhood and payload.neighborhood.strip():
        parts.append(payload.neighborhood.strip())

    city_parts = [payload.city, payload.cep]
    city_line = " - ".join([part.strip() for part in city_parts if part and part.strip()])
    if city_line:
        parts.append(city_line)

    return " | ".join(parts) if parts else payload.address


def _scoped_query(db: Session, current_user: User):
    return apply_unit_scope(repository.query_police_officers(db), PoliceOfficer, current_user)


def _get_scoped_or_404(db: Session, current_user: User, officer_id: int) -> PoliceOfficer:
    officer = _scoped_query(db, current_user).filter(PoliceOfficer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Policial não encontrado.")
    return officer


def _register_movement(
    db: Session,
    *,
    officer_id: int,
    user_id: int,
    from_unit_id: int | None,
    to_unit_id: int | None,
    from_external_unit_name: str | None,
    to_external_unit_name: str | None,
    details: str | None,
):
    db.add(
        PoliceOfficerMovement(
            police_officer_id=officer_id,
            user_id=user_id,
            from_unit_id=from_unit_id,
            to_unit_id=to_unit_id,
            from_external_unit_name=from_external_unit_name,
            to_external_unit_name=to_external_unit_name,
            details=details,
        )
    )


def list_police_officers(
    *,
    q: str | None,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    query = _scoped_query(db, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = query.filter(PoliceOfficer.unit_id.in_(filter_unit_ids))

    if not include_inactive:
        query = query.filter(PoliceOfficer.is_active)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                PoliceOfficer.full_name.ilike(term),
                PoliceOfficer.war_name.ilike(term),
                PoliceOfficer.cpf.ilike(term),
                PoliceOfficer.re_with_digit.ilike(term),
            )
        )

    return _sanitize_police_officer_models(query.order_by(PoliceOfficer.full_name.asc()).all())


def create_police_officer(
    *,
    payload,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    if not can_manage_users_in_unit(current_user, payload.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem cadastrar policiais nesta unidade.",
        )

    unit = repository.get_unit_by_id(db, payload.unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    officer_data = payload.model_dump()
    children = officer_data.pop("children", [])
    officer_data["address"] = _build_address_summary(payload)
    officer = PoliceOfficer(**officer_data)
    _apply_children_snapshot(officer, children)

    try:
        repository.add_police_officer(db, officer)
        return _sanitize_police_officer_model(officer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="CPF ou RE já cadastrado para outro policial.",
        )


def get_police_officer(
    *,
    officer_id: int,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)
    return _sanitize_police_officer_model(_get_scoped_or_404(db, current_user, officer_id))


def search_police_officers(
    *,
    term_value: str,
    db: Session,
    current_user: User,
):
    raw_query = str(term_value or "").strip()
    if not raw_query:
        return []

    if len(raw_query) < 2:
        return []

    normalized_target = "".join(ch for ch in raw_query.upper() if ch.isalnum())
    lowered_query = raw_query.lower()
    query = apply_unit_scope(repository.query_police_officers(db), PoliceOfficer, current_user)
    scoped_officers = query.order_by(PoliceOfficer.full_name.asc()).all()
    exact_matches = []
    partial_re_matches = []
    name_matches = []

    for item in scoped_officers:
        item_re = str(item.re_with_digit or "").strip()
        normalized_item_re = "".join(ch for ch in item_re.upper() if ch.isalnum())
        item_full_name = str(item.full_name or "").lower()
        item_war_name = str(item.war_name or "").lower()

        if item_re.lower() == lowered_query or (
            normalized_target and normalized_item_re == normalized_target
        ):
            exact_matches.append(item)
            continue

        if normalized_target and normalized_item_re.startswith(normalized_target):
            partial_re_matches.append(item)
            continue

        if lowered_query in item_full_name or lowered_query in item_war_name:
            name_matches.append(item)

    ordered_results = exact_matches + partial_re_matches + name_matches
    if not ordered_results:
        return []

    unique_results = []
    seen_ids = set()
    for item in ordered_results:
        if item.id in seen_ids:
            continue
        seen_ids.add(item.id)
        unique_results.append(item)
        if len(unique_results) >= 20:
            break

    return [
        {
            "nome_guerra": officer.war_name,
            "nome_completo": officer.full_name,
            "re_dc": officer.re_with_digit,
            "posto_graduacao": officer.rank,
            "policial_id": officer.id,
            "unidade": officer.unit_label,
            "status": "Ativo" if officer.is_active else "Inativo",
            "is_active": officer.is_active,
        }
        for officer in unique_results
    ]


def get_police_officer_detail_with_measures(
    *,
    re_value: str,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    normalized_target = "".join(ch for ch in str(re_value or "").upper() if ch.isalnum())
    if not normalized_target:
        raise HTTPException(status_code=400, detail="Informe um RE-DC válido.")

    officer = next(
        (
            item
            for item in apply_unit_scope(repository.query_police_officers(db), PoliceOfficer, current_user).all()
            if "".join(ch for ch in str(item.re_with_digit or "").upper() if ch.isalnum()) == normalized_target
        ),
        None,
    )

    if not officer:
        raise HTTPException(status_code=404, detail="Policial não encontrado.")

    officer = _sanitize_police_officer_model(officer)
    officer_data = {
        column.name: getattr(officer, column.name)
        for column in PoliceOfficer.__table__.columns
    }
    officer_data["unit_label"] = officer.unit_label
    officer_data["children"] = officer.children

    medida = (
        db.query(RomaneioMedida)
        .filter(
            (RomaneioMedida.policial_id == officer.id)
            | (RomaneioMedida.re == officer.re_with_digit)
        )
        .first()
    )
    officer_data["medidas"] = (
        {
            column.name: getattr(medida, column.name)
            for column in RomaneioMedida.__table__.columns
        }
        if medida
        else None
    )
    return officer_data


def get_police_officer_linked_assets(
    *,
    officer_id: int,
    db: Session,
    current_user: User,
    linked_asset_out,
    linked_assets_response,
):
    _require_p1_access(current_user)

    officer = _get_scoped_or_404(db, current_user, officer_id)

    items = (
        apply_unit_scope(repository.query_items(db), Item, current_user)
        .filter(Item.police_officer_id == officer_id, Item.is_active.is_(True))
        .order_by(Item.name.asc(), Item.id.desc())
        .all()
    )

    material_belico = (
        apply_unit_scope(repository.query_material_belico(db), MaterialBelico, current_user)
        .filter(MaterialBelico.police_officer_id == officer_id, MaterialBelico.is_active.is_(True))
        .order_by(MaterialBelico.category.asc(), MaterialBelico.id.desc())
        .all()
    )

    item_assets = [
        linked_asset_out(
            id=item.id,
            module="MATERIAIS",
            name=item.name,
            category=item.category,
            unit_label=item.unit_label,
            status=item.status,
            location=item.location,
            serial_number=item.serial_number,
            asset_tag=item.asset_tag,
            details=item.notes,
        )
        for item in items
    ]

    belico_assets = [
        linked_asset_out(
            id=item.id,
            module="MATERIAL_BELICO",
            name=item.category or "Material B?lico",
            category=item.category,
            unit_label=item.unit_label,
            status="Ativo" if item.is_active else "Inativo",
            location=item.custody_sector_name or item.opm_atual,
            serial_number=(
                item.armamento_num_serie
                or item.algema_num_serie
                or item.colete_num_serie
                or item.municao_lote
            ),
            asset_tag=(
                item.armamento_patrimonio
                or item.algema_patrimonio
                or item.colete_patrimonio
            ),
            details=f"RE {item.re} - {item.nome}",
        )
        for item in material_belico
    ]

    return linked_assets_response(
        police_officer_id=officer.id,
        officer_name=officer.war_name or officer.full_name,
        items=item_assets,
        material_belico=belico_assets,
        total_count=len(item_assets) + len(belico_assets),
    )


def list_police_officer_movements(
    *,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    query = (
        repository.query_police_officer_movements(db)
        .join(PoliceOfficer, PoliceOfficerMovement.police_officer_id == PoliceOfficer.id)
        .order_by(PoliceOfficerMovement.id.desc())
    )
    query = apply_movement_unit_scope(query, PoliceOfficerMovement, current_user)
    if unit_id is not None:
        if not can_access_unit(current_user, unit_id):
            raise _forbidden()
        try:
            filter_unit_ids = resolve_filter_unit_ids(db, unit_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        query = filter_movements_by_unit_ids(query, PoliceOfficerMovement, filter_unit_ids)
    return query.all()


def move_police_officer(
    *,
    officer_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    officer = _get_scoped_or_404(db, current_user, officer_id)
    if not can_manage_users_in_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem movimentar policiais desta unidade.",
        )

    normalized_external_unit_name = (payload.external_unit_name or "").strip() or None
    details = (payload.details or "").strip() or "Movimentação de lotação do policial"

    if payload.unit_id is None and not normalized_external_unit_name:
        raise HTTPException(
            status_code=400,
            detail="Informe a unidade de destino ou a unidade externa.",
        )

    target_unit_id = officer.unit_id
    target_external_unit_name = normalized_external_unit_name

    if payload.unit_id is not None:
        unit = repository.get_unit_by_id(db, payload.unit_id)
        if not unit:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
        if not can_manage_users_in_unit(current_user, payload.unit_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores autorizados podem mover policiais para esta unidade.",
            )
        target_unit_id = payload.unit_id
        target_external_unit_name = None

    if (
        target_unit_id == officer.unit_id
        and (target_external_unit_name or None) == (officer.external_unit_name or None)
    ):
        raise HTTPException(
            status_code=400,
            detail="Nenhuma alteração de lotação foi informada.",
        )

    previous_unit_id = officer.unit_id
    previous_external_unit_name = officer.external_unit_name

    officer.unit_id = target_unit_id
    officer.external_unit_name = target_external_unit_name

    _register_movement(
        db,
        officer_id=officer.id,
        user_id=current_user.id,
        from_unit_id=previous_unit_id,
        to_unit_id=officer.unit_id,
        from_external_unit_name=previous_external_unit_name,
        to_external_unit_name=officer.external_unit_name,
        details=details,
    )

    repository.save_police_officer(db, officer)
    return _sanitize_police_officer_model(officer)


def update_police_officer(
    *,
    officer_id: int,
    payload,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    officer = _get_scoped_or_404(db, current_user, officer_id)
    target_unit_id = payload.unit_id if payload.unit_id is not None else officer.unit_id

    if not can_manage_users_in_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem editar policiais desta unidade.",
        )

    if target_unit_id != officer.unit_id and not can_manage_users_in_unit(current_user, target_unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem mover policiais para esta unidade.",
        )

    if payload.unit_id is not None:
        unit = repository.get_unit_by_id(db, payload.unit_id)
        if not unit:
            raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")

    previous_unit_id = officer.unit_id
    previous_external_unit_name = officer.external_unit_name
    next_external_unit_name = (
        payload.external_unit_name
        if payload.external_unit_name is not None
        else officer.external_unit_name
    )

    changes = payload.model_dump(exclude_unset=True)
    children = changes.pop("children", None)

    for field, value in changes.items():
        setattr(officer, field, value)

    officer.address = _build_address_summary(officer)
    if children is not None:
        _apply_children_snapshot(officer, children)

    moved_unit = payload.unit_id is not None and payload.unit_id != previous_unit_id
    moved_external = payload.external_unit_name is not None and (
        (payload.external_unit_name or None) != (previous_external_unit_name or None)
    )

    if moved_unit or moved_external:
        _register_movement(
            db,
            officer_id=officer.id,
            user_id=current_user.id,
            from_unit_id=previous_unit_id,
            to_unit_id=officer.unit_id,
            from_external_unit_name=previous_external_unit_name,
            to_external_unit_name=next_external_unit_name,
            details="Movimentação de lotação do policial",
        )

    try:
        repository.save_police_officer(db, officer)
        return _sanitize_police_officer_model(officer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="CPF ou RE já cadastrado para outro policial.",
        )


def delete_police_officer(
    *,
    officer_id: int,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)
    officer = _get_scoped_or_404(db, current_user, officer_id)

    if not can_manage_users_in_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem inativar policiais desta unidade.",
        )

    officer.is_active = False
    repository.save_police_officer(db, officer)


def restore_police_officer(
    *,
    officer_id: int,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)
    officer = _get_scoped_or_404(db, current_user, officer_id)

    if not can_manage_users_in_unit(current_user, officer.unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem reativar policiais desta unidade.",
        )

    officer.is_active = True
    repository.save_police_officer(db, officer)
    return _sanitize_police_officer_model(officer)


def _scoped_sector_query(db: Session, current_user: User):
    return apply_unit_scope(repository.query_sectors(db), Sector, current_user)


def _get_scoped_sector_or_404(db: Session, current_user: User, sector_id: int) -> Sector:
    sector = _scoped_sector_query(db, current_user).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Setor não encontrado.")
    return _sanitize_sector_model(sector)


def _validate_unit_access(db: Session, current_user: User, unit_id: int) -> None:
    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=400, detail="Unidade informada não encontrada.")
    if not can_access_unit(current_user, unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a esta unidade.",
        )


def _require_sector_management(current_user: User, unit_id: int) -> None:
    if not can_manage_users_in_unit(current_user, unit_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores autorizados podem gerenciar setores desta unidade.",
        )


def list_sectors(
    *,
    q: str | None,
    include_inactive: bool,
    unit_id: int | None,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()

    query = _scoped_sector_query(db, current_user)

    if unit_id is not None:
        _validate_unit_access(db, current_user, unit_id)
        query = query.filter(Sector.unit_id == unit_id)

    if not include_inactive:
        query = query.filter(Sector.is_active.is_(True))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(Sector.name.ilike(term), Sector.code.ilike(term)))

    return _sanitize_sector_models(query.order_by(Sector.unit_id, Sector.name).all())


def get_sector(
    *,
    sector_id: int,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    return _get_scoped_sector_or_404(db, current_user, sector_id)


def create_sector(
    *,
    payload,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    _validate_unit_access(db, current_user, payload.unit_id)
    _require_sector_management(current_user, payload.unit_id)

    existing = (
        repository.query_sectors(db)
        .filter(Sector.unit_id == payload.unit_id, Sector.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um setor com este nome na unidade.")

    sector = Sector(
        unit_id=payload.unit_id,
        name=payload.name,
        code=payload.code,
        is_active=payload.is_active,
    )
    repository.add_sector(db, sector)
    return _sanitize_sector_model(sector)


def update_sector(
    *,
    sector_id: int,
    payload,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()

    sector = _get_scoped_sector_or_404(db, current_user, sector_id)
    target_unit_id = payload.unit_id if payload.unit_id is not None else sector.unit_id

    _validate_unit_access(db, current_user, target_unit_id)
    _require_sector_management(current_user, sector.unit_id)
    if target_unit_id != sector.unit_id:
        _require_sector_management(current_user, target_unit_id)

    if payload.unit_id is not None:
        sector.unit_id = payload.unit_id
    if payload.name is not None:
        sector.name = payload.name
    if payload.code is not None:
        sector.code = payload.code
    if payload.is_active is not None:
        sector.is_active = payload.is_active

    duplicate = (
        repository.query_sectors(db)
        .filter(
            Sector.id != sector.id,
            Sector.unit_id == sector.unit_id,
            Sector.name == sector.name,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Já existe um setor com este nome na unidade.")

    repository.save_sector(db, sector)
    return _sanitize_sector_model(sector)


def delete_sector(
    *,
    sector_id: int,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    sector = _get_scoped_sector_or_404(db, current_user, sector_id)
    _require_sector_management(current_user, sector.unit_id)
    sector.is_active = False
    repository.save_sector(db, sector)


def restore_sector(
    *,
    sector_id: int,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    sector = _get_scoped_sector_or_404(db, current_user, sector_id)
    _require_sector_management(current_user, sector.unit_id)
    sector.is_active = True
    repository.save_sector(db, sector)
    return _sanitize_sector_model(sector)


CANONICAL_UNIT_TYPES = {"batalhao", "cia", "pelotao"}


def _resolved_parent_unit_id(payload) -> int | None:
    return payload.parent_unit_id if payload.parent_unit_id is not None else payload.parent_id


def _normalize_unit_type(value: str | None) -> str | None:
    if not value:
        return value
    return str(value).strip().lower()


def create_unit(
    *,
    payload,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    if not user_has_global_scope(current_user):
        raise _forbidden()

    parent_unit_id = _resolved_parent_unit_id(payload)
    if parent_unit_id is not None:
        parent = repository.get_unit_by_id(db, parent_unit_id)
        if not parent:
            raise HTTPException(status_code=400, detail="parent_unit_id not found.")

    unit = Unit(
        name=payload.name,
        code=payload.code,
        codigo_opm=payload.codigo_opm,
        type=_normalize_unit_type(payload.type),
        parent_id=parent_unit_id,
        parent_unit_id=parent_unit_id,
        can_view_all=payload.can_view_all,
        is_active=payload.is_active,
    )
    repository.add_unit(db, unit)
    return _sanitize_unit_model(unit)


def update_unit(
    *,
    unit_id: int,
    payload,
    db: Session,
    current_user: User,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    if not user_has_global_scope(current_user):
        raise _forbidden()

    unit = repository.get_unit_by_id(db, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")

    unit.codigo_opm = payload.codigo_opm.strip() if payload.codigo_opm else None
    if payload.can_view_all is not None:
        unit.can_view_all = payload.can_view_all
    if payload.is_active is not None:
        unit.is_active = payload.is_active

    repository.save_unit(db, unit)
    return _sanitize_unit_model(unit)


def list_units(
    *,
    db: Session,
    current_user: User,
):
    query = repository.query_units(db)
    query = query.filter(Unit.type.in_(CANONICAL_UNIT_TYPES))
    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is not None:
        query = query.filter(Unit.id.in_(accessible_ids))
    return _sanitize_unit_models(query.order_by(Unit.id).all())


def _build_tree(node: Unit, unit_tree_schema):
    visible_children = [
        child
        for child in (node.children or [])
        if child.type in CANONICAL_UNIT_TYPES
    ]
    return unit_tree_schema(
        id=node.id,
        name=_normalize_rh_text(node.name),
        code=_normalize_rh_text(node.code),
        codigo_opm=_normalize_rh_text(node.codigo_opm),
        type=_normalize_rh_text(node.type),
        parent_unit_id=node.effective_parent_unit_id,
        parent_id=node.parent_id,
        can_view_all=node.can_view_all,
        is_active=node.is_active,
        created_at=node.created_at,
        updated_at=node.updated_at,
        children=[_build_tree(child, unit_tree_schema) for child in visible_children],
    )


def get_unit_tree(
    *,
    db: Session,
    current_user: User,
    unit_tree_schema,
):
    try:
        require_module_access(current_user, MODULE_TELEMATICA)
    except PermissionError:
        raise _forbidden()
    roots = (
        repository.query_units(db)
        .filter(Unit.type.in_(CANONICAL_UNIT_TYPES))
        .filter(Unit.parent_unit_id.is_(None))
        .order_by(Unit.id)
        .all()
    )
    return [_build_tree(root, unit_tree_schema) for root in roots]


def get_police_officer_complete(
    *,
    officer_id: int,
    db: Session,
    current_user: User,
):
    _require_p1_access(current_user)

    officer = repository.get_police_officer_complete(db, officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Policial não encontrado.")

    accessible_ids = get_accessible_unit_ids(current_user)
    if accessible_ids is not None and officer.unit_id not in accessible_ids:
        raise _forbidden()

    return _sanitize_police_officer_model(officer)


def _format_bool(value: bool | None) -> str:
    return "Sim" if value else "Não"


def _format_date(value) -> str:
    if not value:
        return "-"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    return str(value)


def _format_datetime(value) -> str:
    if not value:
        return "-"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    return str(value)


def _format_cpf(value: str | None) -> str:
    digits = "".join(filter(str.isdigit, str(value or "")))
    if len(digits) != 11:
        return value or "-"
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def _format_phone(value: str | None) -> str:
    digits = "".join(filter(str.isdigit, str(value or "")))
    if len(digits) == 10:
        return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
    if len(digits) == 11:
        return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
    return value or "-"


def _format_associations(officer: PoliceOfficer) -> str:
    associations = []
    if officer.associate_cb_sd:
        associations.append("CB/SD")
    if officer.associate_afam:
        associations.append("AFAM")
    if officer.associate_coopmil:
        associations.append("COOPMIL")
    if officer.associate_adepom:
        associations.append("ADEPOM")
    if officer.associate_apmdfesp:
        associations.append("APMDFESP")
    if officer.associate_other:
        associations.append(officer.associate_other)
    return ", ".join(associations) if associations else "-"


def _format_service_time(value) -> str:
    if not value:
        return "-"
    today = date.today()
    years = today.year - value.year
    months = today.month - value.month
    if today.day < value.day:
        months -= 1
    if months < 0:
        years -= 1
        months += 12
    parts = []
    if years > 0:
        parts.append(f"{years} ano{'s' if years != 1 else ''}")
    if months > 0:
        parts.append(f"{months} mes{'es' if months != 1 else ''}")
    return ", ".join(parts) if parts else "Menos de 1 mes"


def _safe_text(value) -> str:
    if value is None:
        return "-"
    text = str(value).strip()
    return escape(text) if text else "-"


def _field_html(label: str, value: str) -> str:
    return (
        "<div class='field'>"
        f"<div class='label'>{escape(label)}</div>"
        f"<div class='value'>{value}</div>"
        "</div>"
    )


def _render_section(title: str, fields: list[tuple[str, str]]) -> str:
    content = "".join(_field_html(label, value) for label, value in fields)
    return (
        "<section class='report-section'>"
        f"<h2>{escape(title)}</h2>"
        f"<div class='field-grid'>{content}</div>"
        "</section>"
    )


def _logo_uri() -> str | None:
    project_root = Path(__file__).resolve().parents[4]
    candidates = [
        project_root / "frontend" / "public" / "images" / "reports" / "logo_ouro.png",
        project_root / "frontend" / "public" / "images" / "reports" / "logo_pmesp.png",
        project_root / "frontend" / "public" / "images" / "reports" / "logo_5rv.png",
        project_root / "frontend" / "public" / "images" / "css" / "logo_5rv.png",
        project_root / "frontend" / "public" / "images" / "css" / "bolachao_rodoviaria.png",
    ]
    for path in candidates:
        if path.exists():
            return path.as_uri()
    return None


def _secondary_logo_uri() -> str | None:
    project_root = Path(__file__).resolve().parents[4]
    candidates = [
        project_root / "frontend" / "public" / "images" / "reports" / "logo_5rv.png",
        project_root / "frontend" / "public" / "images" / "reports" / "bolachao_rodoviaria.png",
        project_root / "frontend" / "public" / "images" / "css" / "logo_5rv.png",
    ]
    for path in candidates:
        if path.exists():
            return path.as_uri()
    return None


def _build_police_officer_pdf_html(
    *,
    officer: PoliceOfficer,
    emitido_por: str,
    generated_at: datetime,
) -> str:
    logo_uri = _logo_uri()
    generated_label = generated_at.strftime("%d/%m/%Y %H:%M")

    sections = [
        (
            "Detalhes gerais",
            [
                ("Status", _safe_text("Ativo" if officer.is_active else "Inativo")),
                ("Tempo de serviço", _safe_text(_format_service_time(officer.admission_date))),
                ("Tipo sanguíneo", _safe_text(officer.blood_type)),
                ("Motorista", _safe_text(_format_bool(officer.is_driver))),
            ],
        ),
        (
            "Dados pessoais",
            [
                ("Nome completo", _safe_text(officer.full_name)),
                ("Nome de guerra", _safe_text(officer.war_name)),
                ("Posto/Graduação", _safe_text(officer.rank)),
                ("RE-DC", _safe_text(officer.re_with_digit)),
                ("Data de apresentação", _safe_text(_format_date(officer.presentation_date))),
                ("Data de admissão", _safe_text(_format_date(officer.admission_date))),
                ("CPF", _safe_text(_format_cpf(officer.cpf))),
                ("RG", _safe_text(" / ".join([part for part in [officer.rg, officer.rg_state] if part]) or "-")),
                ("Data de nascimento", _safe_text(_format_date(officer.birth_date))),
                (
                    "Naturalidade",
                    _safe_text(
                        " / ".join(
                            [part for part in [officer.naturality, officer.naturality_state] if part]
                        )
                        or "-"
                    ),
                ),
                ("Nacionalidade", _safe_text(officer.nationality)),
                ("Unidade", _safe_text(officer.unit_label)),
                ("OPM anterior", _safe_text(officer.previous_opm)),
                ("Profissão civil", _safe_text(officer.civil_profession)),
                ("Idiomas", _safe_text(officer.spoken_languages)),
                ("Cursos PMESP", _safe_text(officer.pmesp_courses)),
                ("Grau de instrução", _safe_text(officer.education_level)),
                ("Curso superior", _safe_text(officer.higher_education_course)),
            ],
        ),
        (
            "Motorista e SAT PM",
            [
                ("Motorista", _safe_text(_format_bool(officer.is_driver))),
                ("CAT", _safe_text(officer.driver_category)),
                ("N do registro", _safe_text(officer.driver_registration_number)),
                ("Expedição", _safe_text(_format_date(officer.driver_issue_date))),
                ("Validade", _safe_text(_format_date(officer.driver_expiration_date))),
                ("SAT PM", _safe_text(_format_bool(officer.has_sat_pm))),
            ],
        ),
        (
            "Família",
            [
                ("Nome da mae", _safe_text(officer.mother_name)),
                ("Nome do pai", _safe_text(officer.father_name)),
                ("Estado civil", _safe_text(officer.marital_status)),
                ("Data do casamento", _safe_text(_format_date(officer.marriage_date))),
                ("Nome do cônjuge", _safe_text(officer.spouse_name)),
                ("Nascimento do cônjuge", _safe_text(_format_date(officer.spouse_birth_date))),
                (
                    "RG do cônjuge",
                    _safe_text(
                        " / ".join(
                            [part for part in [officer.spouse_rg, officer.spouse_rg_state] if part]
                        )
                        or "-"
                    ),
                ),
                ("CPF do cônjuge", _safe_text(_format_cpf(officer.spouse_cpf))),
                (
                    "1º filho",
                    _safe_text(
                        " - ".join(
                            [part for part in [officer.child_1_name, _format_date(officer.child_1_birth_date)] if part and part != "-"]
                        )
                        or "-"
                    ),
                ),
                (
                    "2º filho",
                    _safe_text(
                        " - ".join(
                            [part for part in [officer.child_2_name, _format_date(officer.child_2_birth_date)] if part and part != "-"]
                        )
                        or "-"
                    ),
                ),
                (
                    "3º filho",
                    _safe_text(
                        " - ".join(
                            [part for part in [officer.child_3_name, _format_date(officer.child_3_birth_date)] if part and part != "-"]
                        )
                        or "-"
                    ),
                ),
            ],
        ),
        (
            "Endereço residencial",
            [
                ("CEP", _safe_text(officer.cep)),
                ("Rua", _safe_text(officer.street)),
                ("Número", _safe_text(officer.street_number)),
                ("Complemento", _safe_text(officer.address_details)),
                ("Bairro", _safe_text(officer.neighborhood)),
                ("Cidade", _safe_text(officer.city)),
                ("Estado", _safe_text(officer.state)),
                ("Ponto de referencia", _safe_text(officer.reference_point)),
                ("CPA", _safe_text(officer.nearest_unit_cpa)),
                ("BTL", _safe_text(officer.nearest_unit_btl)),
                ("CIA", _safe_text(officer.nearest_unit_cia)),
                ("Fone da unidade próxima", _safe_text(_format_phone(officer.nearest_unit_phone))),
                ("Endereço resumido", _safe_text(officer.address)),
            ],
        ),
        (
            "Contatos",
            [
                ("Telefone celular", _safe_text(_format_phone(officer.cell_phone))),
                ("Telefone residencial", _safe_text(_format_phone(officer.residential_phone))),
                ("Telefone do cônjuge", _safe_text(_format_phone(officer.spouse_phone))),
                ("Telefone para recado", _safe_text(_format_phone(officer.message_phone))),
                ("E-mail funcional", _safe_text(officer.functional_email)),
                ("E-mail particular", _safe_text(officer.personal_email)),
            ],
        ),
        (
            "Associações e seguro",
            [
                ("Associações", _safe_text(_format_associations(officer))),
                ("Seguro particular", _safe_text(_format_bool(officer.has_private_insurance))),
                ("Detalhes do seguro", _safe_text(officer.private_insurance_details)),
                ("Telefone do seguro", _safe_text(_format_phone(officer.private_insurance_phone))),
            ],
        ),
        (
            "Observações e ciência",
            [
                ("Observação", _safe_text(officer.observation)),
                ("Data de ciência", _safe_text(_format_date(officer.acknowledgement_date))),
                ("Assinatura do PM", _safe_text(officer.acknowledgement_signature)),
            ],
        ),
        (
            "Dados complementares e controle",
            [
                ("ID do registro", _safe_text(officer.id)),
                ("ID da unidade", _safe_text(officer.unit_id)),
                ("Unidade externa", _safe_text(officer.external_unit_name)),
                ("Orientacao sexual", _safe_text(officer.sexual_orientation)),
                ("Categoria SAT PM", _safe_text(officer.sat_pm_category)),
                ("Criado em", _safe_text(_format_datetime(officer.created_at))),
                ("Atualizado em", _safe_text(_format_datetime(officer.updated_at))),
            ],
        ),
    ]

    sections_html = "".join(_render_section(title, fields) for title, fields in sections)
    logo_html = (
        f"<img class='header-logo' src='{logo_uri}' alt='Logo institucional' />" if logo_uri else ""
    )

    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <style>
          @page {{
            size: A4;
            margin: 2cm;
            @bottom-center {{
              content: "Emitido por: {escape(emitido_por)} | Página " counter(page) " de " counter(pages);
              font-size: 9pt;
              color: #5b6573;
            }}
          }}

          body {{
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5pt;
            color: #102033;
            line-height: 1.35;
          }}

          .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #16324f;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }}

          .header-brand {{
            display: flex;
            gap: 14px;
            align-items: center;
          }}

          .header-logo {{
            width: 64px;
            height: 64px;
            object-fit: contain;
          }}

          .header-meta h1 {{
            margin: 0 0 4px;
            font-size: 18pt;
            color: #16324f;
          }}

          .header-meta p {{
            margin: 2px 0;
            color: #415063;
          }}

          .report-section {{
            margin-top: 18px;
            page-break-inside: avoid;
          }}

          .report-section h2 {{
            margin: 0 0 10px;
            padding: 8px 12px;
            font-size: 12pt;
            color: #ffffff;
            background: #16324f;
            border-radius: 8px;
          }}

          .field-grid {{
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 12px;
          }}

          .field {{
            border: 1px solid #d4dde7;
            border-radius: 8px;
            padding: 8px 10px;
            background: #f8fafc;
            min-height: 42px;
          }}

          .label {{
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #5b6573;
            margin-bottom: 4px;
          }}

          .value {{
            color: #102033;
            white-space: pre-wrap;
            word-break: break-word;
          }}

          .signature-block {{
            margin-top: 28px;
            border-top: 2px solid #16324f;
            padding-top: 16px;
            page-break-inside: avoid;
          }}

          .signature-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px 18px;
            margin-top: 14px;
          }}

          .signature-line {{
            border-bottom: 1px solid #5b6573;
            padding-top: 30px;
          }}

          .signature-label {{
            margin-top: 6px;
            font-size: 9pt;
            color: #415063;
          }}

          .signature-footnote {{
            margin-top: 16px;
            font-size: 9pt;
            color: #5b6573;
          }}
        </style>
      </head>
      <body>
        <header class="header">
          <div class="header-brand">
            {logo_html}
            <div class="header-meta">
              <h1>Ficha Cadastral do Policial</h1>
              <p><strong>Instituição:</strong> ERP 5BPRv | Policiamento Rodoviário</p>
              <p><strong>Gerado em:</strong> {escape(generated_label)}</p>
              <p><strong>Emitido por:</strong> {escape(emitido_por)}</p>
            </div>
          </div>
        </header>

        {sections_html}

        <section class="signature-block">
          <h2 style="margin: 0 0 8px; padding: 0; background: none; color: #16324f;">Assinatura</h2>
          <div class="signature-grid">
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Local e data</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Nome/Posto/RE</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Cargo/Função</div>
            </div>
          </div>

          <div class="signature-footnote">Documento gerado pelo ERP 5BPRv em {escape(generated_label)}</div>
          <div class="signature-footnote">Emitido por: {escape(emitido_por)}</div>
        </section>
      </body>
    </html>
    """


def _build_police_officer_sections(officer: PoliceOfficer) -> list[tuple[str, list[tuple[str, str]]]]:
    def child_entry(name: str | None, birth_date) -> str:
        parts = [part for part in [name, _format_date(birth_date)] if part and part != "-"]
        return " - ".join(parts) if parts else "-"

    return [
        (
            "DADOS PESSOAIS",
            [
                ("Status", "Ativo" if officer.is_active else "Inativo"),
                ("Tempo de serviço", _format_service_time(officer.admission_date)),
                ("Data de apresentação", _format_date(officer.presentation_date)),
                ("OPM anterior", officer.previous_opm or "-"),
                ("RE-DC", officer.re_with_digit or "-"),
                ("Posto / Graduação", officer.rank or "-"),
                ("Nome completo", officer.full_name or "-"),
                ("Nome de guerra", officer.war_name or "-"),
                ("Data de admissão na PMESP", _format_date(officer.admission_date)),
                ("Data de nascimento", _format_date(officer.birth_date)),
                (
                    "Natural de / UF",
                    " / ".join([part for part in [officer.naturality, officer.naturality_state] if part]) or "-",
                ),
                ("Motorista", _format_bool(officer.is_driver)),
                ("CAT", officer.driver_category or "-"),
                ("Nº do registro", officer.driver_registration_number or "-"),
                ("Data de expedição", _format_date(officer.driver_issue_date)),
                ("Validade", _format_date(officer.driver_expiration_date)),
                ("SAT PM", _format_bool(officer.has_sat_pm)),
                ("Cursos realizados na PMESP", officer.pmesp_courses or "-"),
                ("Grau de instrução", officer.education_level or "-"),
                ("Superior / curso", officer.higher_education_course or "-"),
                ("Tipo sanguíneo", officer.blood_type or "-"),
                ("RG / Estado", " / ".join([part for part in [officer.rg, officer.rg_state] if part]) or "-"),
                ("CPF", _format_cpf(officer.cpf)),
                ("Profissão civil", officer.civil_profession or "-"),
                ("Idiomas que domina", officer.spoken_languages or "-"),
                ("Nacionalidade", officer.nationality or "-"),
                ("Unidade", officer.unit_label or "-"),
            ],
        ),
        (
            "FILIAÇÃO",
            [
                ("Nome da mãe", officer.mother_name or "-"),
                ("Nome do pai", officer.father_name or "-"),
            ],
        ),
        (
            "ESTADO CIVIL",
            [
                ("Estado civil", officer.marital_status or "-"),
                ("Data do casamento", _format_date(officer.marriage_date)),
                ("Nome do cônjuge", officer.spouse_name or "-"),
                ("Nascimento do cônjuge", _format_date(officer.spouse_birth_date)),
                (
                    "RG / Estado do cônjuge",
                    " / ".join([part for part in [officer.spouse_rg, officer.spouse_rg_state] if part]) or "-",
                ),
                ("CPF do cônjuge", _format_cpf(officer.spouse_cpf)),
            ],
        ),
        (
            "FILHOS(AS)",
            [
                ("Filho(a) 1", child_entry(officer.child_1_name, officer.child_1_birth_date)),
                ("Filho(a) 2", child_entry(officer.child_2_name, officer.child_2_birth_date)),
                ("Filho(a) 3", child_entry(officer.child_3_name, officer.child_3_birth_date)),
            ],
        ),
        (
            "ENDEREÇO RESIDENCIAL",
            [
                ("AV / Rua", officer.street or "-"),
                ("Número", officer.street_number or "-"),
                ("Complemento", officer.address_details or "-"),
                ("Bairro", officer.neighborhood or "-"),
                ("Cidade / Estado", " / ".join([part for part in [officer.city, officer.state] if part]) or "-"),
                ("CEP", officer.cep or "-"),
                ("Ponto de referência", officer.reference_point or "-"),
                ("CPA", officer.nearest_unit_cpa or "-"),
                ("BTL", officer.nearest_unit_btl or "-"),
                ("CIA", officer.nearest_unit_cia or "-"),
                ("Fone", _format_phone(officer.nearest_unit_phone)),
            ],
        ),
        (
            "CONTATOS",
            [
                ("Telefone celular", _format_phone(officer.cell_phone)),
                ("Telefone residencial", _format_phone(officer.residential_phone)),
                ("Telefone do cônjuge", _format_phone(officer.spouse_phone)),
                ("Telefone para recado", _format_phone(officer.message_phone)),
                ("E-mail funcional", officer.functional_email or "-"),
                ("E-mail particular", officer.personal_email or "-"),
            ],
        ),
        (
            "ASSOCIADO",
            [
                ("Associações", _format_associations(officer)),
            ],
        ),
        (
            "SEGURO PARTICULAR",
            [
                ("Possui seguro particular", _format_bool(officer.has_private_insurance)),
                ("Descrição do seguro", officer.private_insurance_details or "-"),
                ("Telefone do seguro", _format_phone(officer.private_insurance_phone)),
            ],
        ),
        (
            "OBSERVAÇÃO",
            [
                ("Observação", officer.observation or "-"),
            ],
        ),
        (
            "CIÊNCIA",
            [
                (
                    "Texto de ciência",
                    "Estou ciente de que quando houver qualquer alteração dos dados acima, providenciarei de imediato a atualização junto ao SIRH e NQ P/I desta CIA.",
                ),
                ("Data", _format_date(officer.acknowledgement_date)),
                ("Assinatura do PM", officer.acknowledgement_signature or "-"),
            ],
        ),
        (
            "INFORMAÇÕES COMPLEMENTARES",
            [
                ("Unidade externa", officer.external_unit_name or "-"),
                ("Endereço resumido", officer.address or "-"),
                ("Criado em", _format_datetime(officer.created_at)),
                ("Atualizado em", _format_datetime(officer.updated_at)),
            ],
        ),
    ]


def _build_pdf_cell(label: str, value: str, styles) -> Paragraph:
    safe_label = escape(label)
    safe_value = escape(value or "-").replace("\n", "<br/>")
    return Paragraph(f"<font color='#415063'><b>{safe_label}</b></font><br/>{safe_value}", styles["field"])


class _NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, footer_text: str = "", **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.footer_text = footer_text

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(total_pages)
            super().showPage()
        super().save()

    def _draw_footer(self, total_pages: int):
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#5b6573"))
        self.drawCentredString(
            A4[0] / 2,
            1.2 * cm,
            f"{self.footer_text} | Página {self._pageNumber} de {total_pages}",
        )


def generate_police_officer_pdf(
    *,
    officer: PoliceOfficer,
    emitido_por: str,
) -> bytes:
    generated_at = datetime.now()
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.2 * cm,
        title="Ficha Cadastral do Policial",
    )

    base_styles = getSampleStyleSheet()
    custom_styles = {
        "meta": ParagraphStyle(
            "meta",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=11.5,
            textColor=colors.HexColor("#415063"),
        ),
        "title": ParagraphStyle(
            "title",
            parent=base_styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=20,
            textColor=colors.HexColor("#16324f"),
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#8a6b00"),
        ),
        "section": ParagraphStyle(
            "section",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=colors.white,
        ),
        "field": ParagraphStyle(
            "field",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=9.4,
            leading=11.4,
            textColor=colors.HexColor("#102033"),
        ),
        "footnote": ParagraphStyle(
            "footnote",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#5b6573"),
        ),
    }

    story = []
    def resolve_logo_path(uri: str | None):
        if not uri:
          return None
        try:
            return Path(uri.replace("file:///", "")).resolve()
        except Exception:
            return None

    logo_path = resolve_logo_path(_logo_uri())
    secondary_logo_path = resolve_logo_path(_secondary_logo_uri())

    title_block = Table(
        [
            [Paragraph("POLÍCIA MILITAR DO ESTADO DE SÃO PAULO", custom_styles["subtitle"])],
            [Paragraph("Ficha Individual do Policial", custom_styles["title"])],
        ],
        colWidths=[9.3 * cm],
    )
    title_block.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    header_meta = Paragraph(
        "<br/>".join(
            [
                "Instituição: ERP 5BPRv | Policiamento Rodoviário",
                f"Unidade do policial: {escape(officer.unit_label or '-')}",
                f"Gerado em: {generated_at.strftime('%d/%m/%Y %H:%M')}",
                f"Emitido por: {escape(emitido_por)}",
            ]
        ),
        custom_styles["meta"],
    )

    left_logo = ""
    if logo_path and logo_path.exists():
        left_logo = Image(str(logo_path), width=2.2 * cm, height=2.2 * cm)

    right_logo = ""
    if secondary_logo_path and secondary_logo_path.exists():
        right_logo = Image(str(secondary_logo_path), width=1.9 * cm, height=1.9 * cm)

    left_header = Table([[left_logo, title_block]], colWidths=[2.7 * cm, 8.3 * cm])
    left_header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    right_header = Table([[header_meta], [right_logo]], colWidths=[5.4 * cm])
    right_header.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )

    header_table = Table(
        [[left_header, right_header]],
        colWidths=[11.2 * cm, 5.8 * cm],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f5ec")),
                ("BOX", (0, 0), (-1, -1), 1.1, colors.HexColor("#bda36a")),
                ("LINEBELOW", (0, 0), (-1, -1), 1.4, colors.HexColor("#8a6b00")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 0.18 * cm))

    executive_summary = Table(
        [[
            Paragraph(f"<b>Status</b><br/>{escape('Ativo' if officer.is_active else 'Inativo')}", custom_styles["field"]),
            Paragraph(f"<b>RE-DC</b><br/>{escape(officer.re_with_digit or '-')}", custom_styles["field"]),
            Paragraph(f"<b>Unidade</b><br/>{escape(officer.unit_label or '-')}", custom_styles["field"]),
            Paragraph(f"<b>Tempo de serviço</b><br/>{escape(_format_service_time(officer.admission_date))}", custom_styles["field"]),
        ]],
        colWidths=[4.15 * cm, 4.15 * cm, 4.8 * cm, 3.9 * cm],
    )
    executive_summary.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#16324f")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#f7f4e8")),
                ("BOX", (0, 0), (-1, -1), 0.9, colors.HexColor("#8a6b00")),
                ("INNERGRID", (0, 0), (-1, -1), 0.55, colors.HexColor("#58718d")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(executive_summary)
    story.append(Spacer(1, 0.22 * cm))

    wide_field_labels = {
        "Nome completo",
        "OPM anterior",
        "Cursos realizados na PMESP",
        "Associações",
        "Descrição do seguro",
        "Observação",
        "Texto de ciência",
        "Endereço resumido",
        "Unidade externa",
    }
    wide_sections = {"ASSOCIADO", "OBSERVAÇÃO", "CIÊNCIA"}
    single_row_sections = {"FILIAÇÃO", "FILHOS(AS)"}
    form_like_groups = {
        "ENDEREÇO RESIDENCIAL": [
            ("AV / Rua", "Número"),
            ("Complemento", "Bairro"),
            ("Cidade / Estado", "CEP"),
            ("Ponto de referência", None),
            ("CPA", "BTL"),
            ("CIA", "Fone"),
        ]
    }

    for section_title, fields in _build_police_officer_sections(officer):
        title_table = Table([[Paragraph(section_title, custom_styles["section"])]], colWidths=[17 * cm])
        title_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1f3654")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#f4d35e")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("BOX", (0, 0), (-1, -1), 0.85, colors.HexColor("#8a6b00")),
                ]
            )
        )
        story.append(title_table)
        story.append(Spacer(1, 0.08 * cm))

        rows = []
        span_rows = []
        field_map = {label: value for label, value in fields}

        if section_title in form_like_groups:
            for left_label, right_label in form_like_groups[section_title]:
                left_cell = _build_pdf_cell(left_label, field_map.get(left_label) or "-", custom_styles)
                if right_label:
                    right_cell = _build_pdf_cell(right_label, field_map.get(right_label) or "-", custom_styles)
                    rows.append([left_cell, right_cell])
                else:
                    rows.append([left_cell, ""])
                    span_rows.append(len(rows) - 1)
        elif section_title in single_row_sections:
            for label, value in fields:
                rows.append([_build_pdf_cell(label, value or "-", custom_styles), ""])
                span_rows.append(len(rows) - 1)
        else:
            pending_cell = None

            for label, value in fields:
                text_value = value or "-"
                should_span = (
                    section_title in wide_sections
                    or label in wide_field_labels
                    or len(str(text_value)) > 72
                    or "\n" in str(text_value)
                )

                current_cell = _build_pdf_cell(label, text_value, custom_styles)

                if should_span:
                    if pending_cell is not None:
                        rows.append([pending_cell, Paragraph("<b>&nbsp;</b><br/>-", custom_styles["field"])])
                        pending_cell = None
                    rows.append([current_cell, ""])
                    span_rows.append(len(rows) - 1)
                    continue

                if pending_cell is None:
                    pending_cell = current_cell
                else:
                    rows.append([pending_cell, current_cell])
                    pending_cell = None

            if pending_cell is not None:
                rows.append([pending_cell, Paragraph("<b>&nbsp;</b><br/>-", custom_styles["field"])])

        table = Table(rows, colWidths=[8.45 * cm, 8.45 * cm], hAlign="LEFT")
        table_style = [
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fbfbf8")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#c8ced6")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dee5")),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f9fafc"), colors.HexColor("#ffffff")]),
        ]
        for row_index in span_rows:
            table_style.append(("SPAN", (0, row_index), (1, row_index)))

        table.setStyle(TableStyle(table_style))
        story.append(table)
        story.append(Spacer(1, 0.16 * cm))

    signature_title = Paragraph("Ciência e assinatura", custom_styles["title"])
    story.append(signature_title)
    story.append(
        Paragraph(
            "Estou ciente de que quando houver qualquer alteração dos dados acima, providenciarei de imediato a atualização junto ao SIRH e NQ P/I desta CIA.",
            custom_styles["meta"],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    signature_table = Table(
        [
            ["", ""],
            ["Local e data", "Assinatura"],
            ["", ""],
            ["Nome/Posto/RE", "Cargo/Função"],
        ],
        colWidths=[8.45 * cm, 8.45 * cm],
    )
    signature_table.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, 0), 1.0, colors.HexColor("#5b6573")),
                ("LINEBELOW", (0, 2), (-1, 2), 1.0, colors.HexColor("#5b6573")),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TEXTCOLOR", (0, 1), (-1, 3), colors.HexColor("#415063")),
                ("FONTSIZE", (0, 1), (-1, 3), 9),
            ]
        )
    )
    story.append(signature_table)
    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            f"Documento gerado pelo ERP 5BPRv em {generated_at.strftime('%d/%m/%Y %H:%M')}",
            custom_styles["footnote"],
        )
    )
    story.append(Paragraph(f"Emitido por: {escape(emitido_por)}", custom_styles["footnote"]))

    footer_text = f"Documento gerado pelo ERP 5BPRv em {generated_at.strftime('%d/%m/%Y %H:%M')} | Emitido por: {emitido_por}"
    document.build(
        story,
        canvasmaker=lambda *args, **kwargs: _NumberedCanvas(*args, footer_text=footer_text, **kwargs),
    )
    return buffer.getvalue()


__all__ = [
    "create_police_officer",
    "create_sector",
    "create_unit",
    "delete_police_officer",
    "generate_police_officer_pdf",
    "delete_sector",
    "get_police_officer_complete",
    "get_police_officer",
    "get_police_officer_linked_assets",
    "get_sector",
    "list_police_officer_movements",
    "list_police_officers",
    "list_sectors",
    "list_units",
    "get_unit_tree",
    "move_police_officer",
    "restore_police_officer",
    "restore_sector",
    "update_police_officer",
    "update_sector",
]
def _normalize_children_payload(children) -> tuple[list[dict], list[dict]]:
    normalized = []
    legacy_rows = []
    for child in children or []:
        if isinstance(child, dict):
            nome = (child.get("nome") or "").strip()
            data_nascimento = child.get("data_nascimento")
        else:
            nome = (getattr(child, "nome", "") or "").strip()
            data_nascimento = getattr(child, "data_nascimento", None)

        if not nome and not data_nascimento:
            continue

        normalized.append({
            "nome": nome or None,
            "dataNascimento": data_nascimento.isoformat() if data_nascimento else None,
        })
        legacy_rows.append({
            "nome": nome or None,
            "data_nascimento": data_nascimento,
        })
    return normalized, legacy_rows


def _apply_children_snapshot(officer: PoliceOfficer, children) -> None:
    normalized_children, legacy_rows = _normalize_children_payload(children)
    officer.children = normalized_children

    first_three = legacy_rows[:3]
    for index in range(3):
        child = first_three[index] if index < len(first_three) else {}
        setattr(officer, f"child_{index + 1}_name", child.get("nome"))
        setattr(officer, f"child_{index + 1}_birth_date", child.get("data_nascimento"))


