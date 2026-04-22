from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.db.access_migrations import ensure_access_schema_compatibility
from app.db.armamento_processo_migrations import ensure_armamento_processo_schema_compatibility
from app.db.audit_migrations import ensure_audit_schema_compatibility
from app.db.controle_efetivo_migrations import ensure_controle_efetivo_schema_compatibility
from app.db.controle_velocidade_noturno_migrations import ensure_controle_velocidade_noturno_schema_compatibility
from app.db.cop_migrations import ensure_cops_schema_compatibility
from app.db.eap_migrations import ensure_eap_schema_compatibility
from app.db.planilha_acidente_viatura_migrations import ensure_planilha_acidente_viatura_schema_compatibility
from app.db.access_seed import ensure_core_sectors
from app.db.database import Base, SessionLocal, engine
from app.db.estoque_migrations import ensure_estoque_schema_compatibility
from app.db.fleet_migrations import ensure_fleet_schema_compatibility
from app.db.item_migrations import ensure_item_schema_compatibility
from app.db.lp_migrations import ensure_lp_schema_compatibility
from app.db.lsv_migrations import ensure_lsv_schema_compatibility
from app.db.mapa_forca_migrations import ensure_mapa_forca_schema_compatibility
from app.db.material_belico_migrations import ensure_material_belico_schema_compatibility
from app.db.movement_migrations import ensure_movement_schema_compatibility
from app.db.police_migrations import ensure_police_schema_compatibility
from app.db.police_movement_migrations import ensure_police_movement_schema_compatibility
from app.db.processo_apaf_migrations import ensure_processo_apaf_schema_compatibility
from app.db.processo_craf_migrations import ensure_processo_craf_schema_compatibility
from app.db.quinquenio_migrations import ensure_quinquenio_schema_compatibility
from app.db.rancho_migrations import ensure_rancho_schema_compatibility
from app.db.romaneio_migrations import ensure_romaneio_schema_compatibility
from app.db.security_migrations import ensure_security_schema_compatibility
from app.db.tpd_talonario_migrations import ensure_tpd_talonario_schema_compatibility
from app.db.unit_migrations import ensure_unit_schema_compatibility
from app.db.unit_seed import ensure_core_units
from app.models.action_log import ActionLog  # noqa: F401
from app.models.audit_event import AuditEvent  # noqa: F401
from app.models.armamento_processo import ArmamentoProcesso  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.controle_efetivo import ControleEfetivo  # noqa: F401
from app.models.controle_velocidade_noturno import ControleVelocidadeNoturno  # noqa: F401
from app.models.cop import Cop  # noqa: F401
from app.models.cop_movement import CopMovement  # noqa: F401
from app.models.eap_modulo import EapModulo  # noqa: F401
from app.models.eap_modulo_participante import EapModuloParticipante  # noqa: F401
from app.models.eap_registro import EapRegistro  # noqa: F401
from app.models.planilha_acidente_viatura import PlanilhaAcidenteViatura  # noqa: F401
from app.models.estoque import (  # noqa: F401
    EstoqueEntrada,
    EstoqueFornecedor,
    EstoqueMovimentacao,
    EstoqueOrdemManutencao,
    EstoqueProduto,
    EstoqueSaida,
)
from app.models.fleet_vehicle import FleetVehicle  # noqa: F401
from app.models.fleet_vehicle_movement import FleetVehicleMovement  # noqa: F401
from app.models.item import Item  # noqa: F401
from app.models.item_movement import ItemMovement  # noqa: F401
from app.models.login_attempt import LoginAttempt  # noqa: F401
from app.models.mapa_forca import MapaForca  # noqa: F401
from app.models.lp_bloco import LpBloco  # noqa: F401
from app.models.lp_registro import LpRegistro  # noqa: F401
from app.models.lsv_bloco import LsvBloco  # noqa: F401
from app.models.lsv_registro import LsvRegistro  # noqa: F401
from app.models.material_belico import MaterialBelico  # noqa: F401
from app.models.material_belico_movement import MaterialBelicoMovement  # noqa: F401
from app.models.police_officer import PoliceOfficer  # noqa: F401
from app.models.police_officer_movement import PoliceOfficerMovement  # noqa: F401
from app.models.quinquenio_bloco import QuinquenioBloco  # noqa: F401
from app.models.quinquenio_bloco_interrupcao import QuinquenioBlocoInterrupcao  # noqa: F401
from app.models.quinquenio_periodo import QuinquenioPeriodo  # noqa: F401
from app.models.processo_apaf import ProcessoApaf  # noqa: F401
from app.models.processo_craf import ProcessoCraf  # noqa: F401
from app.models.rancho_configuracao import RanchoConfiguracao  # noqa: F401
from app.models.rancho_lancamento import RanchoLancamento  # noqa: F401
from app.models.rancho_participante import RanchoParticipante  # noqa: F401
from app.models.romaneio_medida import RomaneioMedida  # noqa: F401
from app.models.sector import Sector  # noqa: F401
from app.models.tpd_talonario import TpdTalonario  # noqa: F401
from app.models.unit import Unit  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_module_access import UserModuleAccess  # noqa: F401
from app.modules.estatistica.router import router as estatistica_router
from app.modules.inteligencia.router import router as inteligencia_router
from app.modules.logistica.router import router as logistica_router
from app.modules.relacoes_publicas.router import router as relacoes_publicas_router
from app.modules.rh.router import router as rh_router
from app.modules.stcor.router import router as stcor_router
from app.modules.telematica.router import router as telematica_router
from app.modules.uge.router import router as uge_router
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.cop import router as cop_router
from app.routes.lp import router as lp_router
from app.routes.lsv import router as lsv_router
from app.routes.mapa_forca import router as mapa_forca_router
from app.routes.policiais import router as policiais_search_router
from app.routes.processo_apaf import router as processo_apaf_router
from app.routes.controle_efetivo import router as controle_efetivo_router
from app.routes.processo_craf import router as processo_craf_router
from app.routes.romaneio import router as romaneio_router

app = FastAPI(title="Controle de Materiais API", version="1.0.0")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if "server" in response.headers:
            del response.headers["server"]
        return response


def ensure_initial_admin(db):
    if db.query(User).count() > 0:
        return

    default_unit = db.query(Unit).order_by(Unit.id.asc()).first()
    if not default_unit:
        return

    from app.core.security import get_password_hash

    admin_user = User(
        cpf=settings.default_admin_cpf,
        name="Administrador",
        unit_id=default_unit.id,
        password_hash=get_password_hash(settings.default_admin_password),
        role_code="ADMIN_GLOBAL" if default_unit.id == 1 else "ADMIN_UNIDADE",
        is_admin=True,
        is_active=True,
        require_password_change=True,
    )
    db.add(admin_user)
    db.commit()
    print("✅ Admin inicial criado.")
    print("⚠ Troque a senha padrão imediatamente.")


def bootstrap_application():
    if engine.dialect.name == "postgresql":
        schema_sql = Path(__file__).resolve().parent / "db" / "create_schemas.sql"
        if schema_sql.exists():
            with engine.begin() as conn:
                conn.execute(text(schema_sql.read_text(encoding="utf-8")))

    Base.metadata.create_all(bind=engine)
    ensure_unit_schema_compatibility(engine)
    ensure_access_schema_compatibility(engine)
    ensure_item_schema_compatibility(engine)
    ensure_material_belico_schema_compatibility(engine)
    ensure_movement_schema_compatibility(engine)
    ensure_police_schema_compatibility(engine)
    ensure_police_movement_schema_compatibility(engine)
    ensure_quinquenio_schema_compatibility(engine)
    ensure_fleet_schema_compatibility(engine)
    ensure_armamento_processo_schema_compatibility(engine)
    ensure_controle_efetivo_schema_compatibility(engine)
    ensure_controle_velocidade_noturno_schema_compatibility(engine)
    ensure_eap_schema_compatibility(engine)
    ensure_planilha_acidente_viatura_schema_compatibility(engine)
    ensure_cops_schema_compatibility(engine)
    ensure_mapa_forca_schema_compatibility(engine)
    ensure_lp_schema_compatibility(engine)
    ensure_lsv_schema_compatibility(engine)
    ensure_processo_apaf_schema_compatibility(engine)
    ensure_processo_craf_schema_compatibility(engine)
    ensure_rancho_schema_compatibility(engine)
    ensure_tpd_talonario_schema_compatibility(engine)
    ensure_estoque_schema_compatibility(engine)
    ensure_romaneio_schema_compatibility(engine)
    ensure_security_schema_compatibility(engine)
    ensure_audit_schema_compatibility(engine)

    with SessionLocal() as db:
        ensure_core_units(db)
        ensure_core_sectors(db)
        ensure_initial_admin(db)


allowed_origins_env = settings.cors_allowed_origins
if allowed_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

# Compatibilidade dupla durante a transição:
# aceita tanto os endpoints antigos sem /api quanto os novos com /api.
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

app.include_router(rh_router, prefix="/api/rh", tags=["P1 - Recursos Humanos"])
app.include_router(inteligencia_router, prefix="/api/inteligencia", tags=["P2 - Inteligência"])
app.include_router(estatistica_router, prefix="/api/estatistica", tags=["P3 - Estatística"])
app.include_router(logistica_router, prefix="/api/logistica", tags=["P4 - Logística e Frota"])
app.include_router(
    relacoes_publicas_router,
    prefix="/api/relacoes_publicas",
    tags=["P5 - Relações Públicas"],
)
app.include_router(uge_router, prefix="/api/uge", tags=["UGE - Convênios e Financeiro"])
app.include_router(stcor_router, prefix="/api/stcor", tags=["StCor - Sala de Operações"])
app.include_router(telematica_router, prefix="/api/telematica", tags=["Telemática - Tecnologia"])
app.include_router(romaneio_router, prefix="/api")
app.include_router(policiais_search_router, prefix="/api")
app.include_router(controle_efetivo_router, prefix="/api")
app.include_router(cop_router, prefix="/api")
app.include_router(mapa_forca_router, prefix="/api")
app.include_router(lp_router, prefix="/api")
app.include_router(lsv_router, prefix="/api")
app.include_router(processo_apaf_router, prefix="/api")
app.include_router(processo_craf_router, prefix="/api")

# As rotas legadas abaixo foram aposentadas do bootstrap principal
# depois da migração do frontend para endpoints modulares:
# - /telematica/users
# - /rh/units
# - /rh/sectors
# - /rh/police-officers
# - /estatistica/logs
# - /logistica/items
# - /logistica/movements
# - /logistica/material-belico
# - /logistica/fleet/vehicles


@app.on_event("startup")
def startup():
    bootstrap_application()


@app.get("/")
def root():
    return {"status": "online"}


@app.get("/health")
def health():
    return {"status": "healthy"}
