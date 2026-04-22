from app.models.sector import Sector
from app.models.unit import Unit
from app.models.user import User


EM_SECTORS = [
    ("P1 - Recursos Humanos", "P1"),
    ("P3 - Estatística", "P3"),
    ("P4 - Logística/Frota", "P4"),
    ("P5 - Relações Públicas", "P5"),
    ("UGE - Convênios/Financeiro", "UGE_CONVENIOS"),
    ("PJMD - Justica e Disciplina", "PJMD"),
    ("StCor - Sala de Operações", "STCOR"),
    ("Telemática - Setor de Tecnologia e Telecomunicações", "TELEMATICA"),
]

CIA_SECTORS = [
    ("P1 - Recursos Humanos", "P1"),
    ("P2 - Inteligência", "P2"),
    ("P3 - Estatística", "P3"),
    ("P4 - Logística/Frota", "P4"),
    ("P5 - Relações Públicas", "P5"),
    ("UGE - Convênios/Financeiro", "UGE_CONVENIOS"),
    ("PJMD - Justica e Disciplina", "PJMD"),
    ("Sala de Radio - PDR", "PDR"),
    ("Telemática - Setor de Tecnologia e Telecomunicações", "TELEMATICA"),
]


def ensure_core_sectors(session) -> None:
    units = session.query(Unit).all()
    sectors = session.query(Sector).all()
    sectors_by_unit_and_code = {
        (sector.unit_id, sector.code): sector
        for sector in sectors
        if sector.code
    }

    for unit in units:
        sector_specs = EM_SECTORS if unit.code == "5BPRV_EM" else CIA_SECTORS

        for name, code in sector_specs:
            sector = sectors_by_unit_and_code.get((unit.id, code))
            if sector is None:
                sector = (
                    session.query(Sector)
                    .filter(Sector.unit_id == unit.id, Sector.name == name)
                    .first()
                )

            if sector is None:
                session.add(
                    Sector(
                        unit_id=unit.id,
                        name=name,
                        code=code,
                        is_active=True,
                    )
                )
            else:
                sector.name = name
                sector.code = code
                sector.is_active = True

    session.flush()

    telematica_by_unit = {
        sector.unit_id: sector
        for sector in session.query(Sector).filter(Sector.code == "TELEMATICA").all()
    }

    for user in session.query(User).all():
        if not user.role_code:
            if user.is_admin and user.unit_id == 1:
                user.role_code = "ADMIN_GLOBAL"
            elif user.is_admin:
                user.role_code = "ADMIN_UNIDADE"
            else:
                user.role_code = "OPERADOR"

        if user.sector_id is None:
            default_sector = telematica_by_unit.get(user.unit_id)
            if default_sector:
                user.sector_id = default_sector.id

    session.commit()
