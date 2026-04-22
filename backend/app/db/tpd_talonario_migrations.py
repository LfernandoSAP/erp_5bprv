from app.models.tpd_talonario import TpdTalonario


def ensure_tpd_talonario_schema_compatibility(engine) -> None:
    TpdTalonario.__table__.create(bind=engine, checkfirst=True)
