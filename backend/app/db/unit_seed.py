from app.models.unit import Unit


def _upsert_unit(
    session,
    *,
    name: str,
    code: str,
    codigo_opm: str | None,
    type: str,
    parent_unit_id: int | None,
    can_view_all: bool,
    is_active: bool,
) -> Unit:
    units_by_code = {
        unit.code: unit
        for unit in session.query(Unit).all()
        if unit.code
    }

    unit = units_by_code.get(code)
    if unit is None:
        query = session.query(Unit).filter(Unit.name == name)
        if parent_unit_id is None:
            query = query.filter(Unit.parent_unit_id.is_(None))
        else:
            query = query.filter(Unit.parent_unit_id == parent_unit_id)
        unit = query.first()

    if unit is None:
        unit = Unit(
            name=name,
            code=code,
            codigo_opm=codigo_opm,
            type=type,
            parent_id=parent_unit_id,
            parent_unit_id=parent_unit_id,
            can_view_all=can_view_all,
            is_active=is_active,
        )
        session.add(unit)
        session.flush()
        return unit

    unit.name = name
    unit.code = code
    unit.codigo_opm = codigo_opm
    unit.type = type
    unit.parent_id = parent_unit_id
    unit.parent_unit_id = parent_unit_id
    unit.can_view_all = can_view_all
    unit.is_active = is_active
    session.flush()
    return unit


def ensure_core_units(session) -> None:
    root = session.query(Unit).filter(Unit.code == "5BPRV_EM").first()
    if root is None:
        root = session.query(Unit).filter(Unit.name.in_(["5BPRv - EM", "5BPRv-EM"])).first()

    if root is None:
        root = session.query(Unit).filter(Unit.id == 1).first()

    if root is None:
        root = _upsert_unit(
            session,
            name="5BPRv-EM",
            code="5BPRV_EM",
            codigo_opm="620050000",
            type="batalhao",
            parent_unit_id=None,
            can_view_all=True,
            is_active=True,
        )
    else:
        root = _upsert_unit(
            session,
            name="5BPRv-EM",
            code="5BPRV_EM",
            codigo_opm="620050000",
            type="batalhao",
            parent_unit_id=None,
            can_view_all=True,
            is_active=True,
        )

    cia_specs = [
        ("1Cia", "1CIA", "620051000"),
        ("2Cia", "2CIA", "620052000"),
        ("3Cia", "3CIA", "620053000"),
        ("4Cia", "4CIA", "620054000"),
    ]

    created_cias = []
    for name, code, codigo_opm in cia_specs:
        cia = _upsert_unit(
            session,
            name=name,
            code=code,
            codigo_opm=codigo_opm,
            type="cia",
            parent_unit_id=root.id,
            can_view_all=False,
            is_active=True,
        )
        created_cias.append(cia)

    for cia in created_cias:
        for pel_number in range(1, 3):
            if cia.code == "1CIA":
                codigo_opm = "620051100" if pel_number == 1 else "620051200"
            elif cia.code == "2CIA":
                codigo_opm = "620052100" if pel_number == 1 else "620052200"
            elif cia.code == "3CIA":
                codigo_opm = "620053100" if pel_number == 1 else "620053200"
            elif cia.code == "4CIA":
                codigo_opm = "620054100" if pel_number == 1 else "620054200"
            else:
                codigo_opm = None
            _upsert_unit(
                session,
                name=f"{pel_number}Pel",
                code=f"{cia.code}_{pel_number}PEL",
                codigo_opm=codigo_opm,
                type="pelotao",
                parent_unit_id=cia.id,
                can_view_all=False,
                is_active=True,
            )

    session.commit()
