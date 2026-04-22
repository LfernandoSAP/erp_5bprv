from fastapi import APIRouter

from app.routes.fleet_vehicle import router as fleet_vehicle_router
from app.routes.armamento_processo import router as armamento_processo_router
from app.routes.estoque import router as estoque_router
from app.routes.item_movement import router as item_movement_router
from app.routes.items import router as items_router
from app.routes.material_belico import router as material_belico_router
from app.routes.rancho import router as rancho_router
from app.routes.tpd_talonario import router as tpd_talonario_router

router = APIRouter()
router.include_router(items_router)
router.include_router(estoque_router)
router.include_router(tpd_talonario_router)
router.include_router(item_movement_router)
router.include_router(material_belico_router)
router.include_router(fleet_vehicle_router)
router.include_router(armamento_processo_router)
router.include_router(rancho_router)
