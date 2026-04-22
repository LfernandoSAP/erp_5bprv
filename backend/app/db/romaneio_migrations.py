from app.models.police_officer import PoliceOfficer  # noqa: F401
from app.models.romaneio_medida import RomaneioMedida


def ensure_romaneio_schema_compatibility(engine) -> None:
    RomaneioMedida.__table__.create(bind=engine, checkfirst=True)
