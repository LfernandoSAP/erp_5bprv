from fastapi import APIRouter

from app.routes.audit_events import router as audit_events_router
from app.routes.user import router as user_router

router = APIRouter()
router.include_router(audit_events_router)
router.include_router(user_router)
