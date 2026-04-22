from fastapi import APIRouter

from app.routes.controle_velocidade_noturno import router as controle_velocidade_noturno_router
from app.routes.eap_registro import router as eap_registro_router
from app.routes.logs import router as logs_router
from app.routes.planilha_acidente_viatura import router as planilha_acidente_viatura_router

router = APIRouter()
router.include_router(logs_router)
router.include_router(controle_velocidade_noturno_router)
router.include_router(planilha_acidente_viatura_router)
router.include_router(eap_registro_router)
