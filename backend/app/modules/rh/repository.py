from sqlalchemy.orm import Query, Session, joinedload

from app.models.item import Item
from app.models.material_belico import MaterialBelico
from app.models.police_officer import PoliceOfficer
from app.models.police_officer_movement import PoliceOfficerMovement
from app.models.sector import Sector
from app.models.unit import Unit


def query_police_officers(db: Session) -> Query:
    return db.query(PoliceOfficer)


def query_police_officer_movements(db: Session) -> Query:
    return db.query(PoliceOfficerMovement)


def query_items(db: Session) -> Query:
    return db.query(Item)


def query_material_belico(db: Session) -> Query:
    return db.query(MaterialBelico)


def query_sectors(db: Session) -> Query:
    return db.query(Sector)


def query_units(db: Session) -> Query:
    return db.query(Unit)


def get_police_officer_by_id(db: Session, officer_id: int):
    return db.query(PoliceOfficer).filter(PoliceOfficer.id == officer_id).first()


def get_police_officer_complete(db: Session, officer_id: int):
    return (
        db.query(PoliceOfficer)
        .options(joinedload(PoliceOfficer.unit))
        .filter(PoliceOfficer.id == officer_id)
        .first()
    )


def get_police_officer_movement_by_id(db: Session, movement_id: int):
    return db.query(PoliceOfficerMovement).filter(PoliceOfficerMovement.id == movement_id).first()


def get_unit_by_id(db: Session, unit_id: int):
    return db.query(Unit).filter(Unit.id == unit_id).first()


def get_sector_by_id(db: Session, sector_id: int):
    return db.query(Sector).filter(Sector.id == sector_id).first()


def list_units(db: Session):
    return db.query(Unit).order_by(Unit.id.asc()).all()


def list_sectors(db: Session):
    return db.query(Sector).order_by(Sector.id.asc()).all()


def add_police_officer(db: Session, officer: PoliceOfficer) -> PoliceOfficer:
    db.add(officer)
    db.commit()
    db.refresh(officer)
    return officer


def add_police_officer_movement(db: Session, movement: PoliceOfficerMovement) -> PoliceOfficerMovement:
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def save_police_officer(db: Session, officer: PoliceOfficer) -> PoliceOfficer:
    db.commit()
    db.refresh(officer)
    return officer


def add_sector(db: Session, sector: Sector) -> Sector:
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


def save_sector(db: Session, sector: Sector) -> Sector:
    db.commit()
    db.refresh(sector)
    return sector


def add_unit(db: Session, unit: Unit) -> Unit:
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


def save_unit(db: Session, unit: Unit) -> Unit:
    db.commit()
    db.refresh(unit)
    return unit
