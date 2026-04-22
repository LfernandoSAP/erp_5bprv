from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.rh import service as rh_service
from app.routes.quinquenio import router as quinquenio_router
from app.routes.police_officer import router as police_officer_router
from app.routes.sector import router as sector_router
from app.routes.unit import router as unit_router

router = APIRouter()
router.include_router(police_officer_router)
router.include_router(sector_router)
router.include_router(unit_router)
router.include_router(quinquenio_router)


@router.get("/policiais/buscar")
def buscar_policial(
    termo: str | None = None,
    re: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_term = (termo or re or "").strip()
    return rh_service.search_police_officers(
        term_value=search_term,
        db=db,
        current_user=current_user,
    )


@router.get("/policiais/{policial_id}/exportar-pdf")
def exportar_pdf_policial(
    policial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    policial = rh_service.get_police_officer_complete(
        officer_id=policial_id,
        db=db,
        current_user=current_user,
    )
    if not policial:
        raise HTTPException(status_code=404, detail="Policial não encontrado.")

    pdf_bytes = rh_service.generate_police_officer_pdf(
        officer=policial,
        emitido_por=current_user.name,
    )

    safe_re = "".join(ch for ch in str(policial.re_with_digit or policial.id) if ch.isalnum() or ch in ("-", "_"))
    nome_arquivo = f"policial_{safe_re}_{date.today().isoformat()}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{nome_arquivo}"'
        },
    )
