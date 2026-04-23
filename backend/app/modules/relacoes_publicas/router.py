from fastapi import APIRouter

from app.routes.relacoes_publicas_birthdays import router as relacoes_publicas_birthdays_router

router = APIRouter()
router.include_router(relacoes_publicas_birthdays_router)
