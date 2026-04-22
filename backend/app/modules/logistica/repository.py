from sqlalchemy.orm import Query, Session

from app.models.action_log import ActionLog
from app.models.estoque import (
    EstoqueEntrada,
    EstoqueFornecedor,
    EstoqueMovimentacao,
    EstoqueOrdemManutencao,
    EstoqueProduto,
    EstoqueSaida,
)
from app.models.fleet_vehicle import FleetVehicle
from app.models.fleet_vehicle_movement import FleetVehicleMovement
from app.models.item import Item
from app.models.item_movement import ItemMovement
from app.models.material_belico import MaterialBelico
from app.models.material_belico_movement import MaterialBelicoMovement
from app.models.police_officer import PoliceOfficer
from app.models.tpd_talonario import TpdTalonario
from app.models.sector import Sector
from app.models.unit import Unit


def query_items(db: Session) -> Query:
    return db.query(Item)


def query_item_movements(db: Session) -> Query:
    return db.query(ItemMovement)


def query_fleet_vehicles(db: Session) -> Query:
    return db.query(FleetVehicle)


def query_fleet_vehicle_movements(db: Session) -> Query:
    return db.query(FleetVehicleMovement)


def query_material_belico(db: Session) -> Query:
    return db.query(MaterialBelico)


def query_material_belico_movements(db: Session) -> Query:
    return db.query(MaterialBelicoMovement)


def query_tpd_talonarios(db: Session) -> Query:
    return db.query(TpdTalonario)


def query_estoque_produtos(db: Session) -> Query:
    return db.query(EstoqueProduto)


def query_estoque_entradas(db: Session) -> Query:
    return db.query(EstoqueEntrada)


def query_estoque_saidas(db: Session) -> Query:
    return db.query(EstoqueSaida)


def query_estoque_fornecedores(db: Session) -> Query:
    return db.query(EstoqueFornecedor)


def query_estoque_ordens_manutencao(db: Session) -> Query:
    return db.query(EstoqueOrdemManutencao)


def query_estoque_movimentacoes(db: Session) -> Query:
    return db.query(EstoqueMovimentacao)


def get_item_by_id(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()


def get_item_movement_by_id(db: Session, movement_id: int):
    return db.query(ItemMovement).filter(ItemMovement.id == movement_id).first()


def get_vehicle_by_id(db: Session, vehicle_id: int):
    return db.query(FleetVehicle).filter(FleetVehicle.id == vehicle_id).first()


def get_fleet_vehicle_movement_by_id(db: Session, movement_id: int):
    return db.query(FleetVehicleMovement).filter(FleetVehicleMovement.id == movement_id).first()


def get_material_belico_by_id(db: Session, item_id: int):
    return db.query(MaterialBelico).filter(MaterialBelico.id == item_id).first()


def get_material_belico_movement_by_id(db: Session, movement_id: int):
    return db.query(MaterialBelicoMovement).filter(MaterialBelicoMovement.id == movement_id).first()


def get_tpd_talonario_by_id(db: Session, item_id: int):
    return db.query(TpdTalonario).filter(TpdTalonario.id == item_id).first()


def get_estoque_produto_by_id(db: Session, item_id: int):
    return db.query(EstoqueProduto).filter(EstoqueProduto.id == item_id).first()


def get_estoque_entrada_by_id(db: Session, item_id: int):
    return db.query(EstoqueEntrada).filter(EstoqueEntrada.id == item_id).first()


def get_estoque_saida_by_id(db: Session, item_id: int):
    return db.query(EstoqueSaida).filter(EstoqueSaida.id == item_id).first()


def get_estoque_fornecedor_by_id(db: Session, item_id: int):
    return db.query(EstoqueFornecedor).filter(EstoqueFornecedor.id == item_id).first()


def get_estoque_ordem_manutencao_by_id(db: Session, item_id: int):
    return db.query(EstoqueOrdemManutencao).filter(EstoqueOrdemManutencao.id == item_id).first()


def get_estoque_movimentacao_by_id(db: Session, item_id: int):
    return db.query(EstoqueMovimentacao).filter(EstoqueMovimentacao.id == item_id).first()


def get_unit_by_id(db: Session, unit_id: int):
    return db.query(Unit).filter(Unit.id == unit_id).first()


def get_sector_by_id(db: Session, sector_id: int):
    return db.query(Sector).filter(Sector.id == sector_id).first()


def get_police_officer_by_id(db: Session, police_officer_id: int):
    return db.query(PoliceOfficer).filter(PoliceOfficer.id == police_officer_id).first()


def get_fleet_vehicle_by_id(db: Session, fleet_vehicle_id: int):
    return db.query(FleetVehicle).filter(FleetVehicle.id == fleet_vehicle_id).first()


def add_item(db: Session, item: Item) -> Item:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_fleet_vehicle(db: Session, vehicle: FleetVehicle) -> FleetVehicle:
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def add_item_movement(db: Session, movement: ItemMovement) -> ItemMovement:
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def add_fleet_vehicle_movement(db: Session, movement: FleetVehicleMovement) -> FleetVehicleMovement:
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def add_material_belico(db: Session, item: MaterialBelico) -> MaterialBelico:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_material_belico_movement(db: Session, movement: MaterialBelicoMovement) -> MaterialBelicoMovement:
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def find_matching_ammo_material_belico(
    db: Session,
    *,
    category: str,
    unit_id: int,
    custody_type: str,
    custody_sector_id: int | None,
    lot_number: str | None,
    item_model: str | None,
    item_type: str | None,
    exclude_item_id: int | None = None,
):
    query = db.query(MaterialBelico).filter(
        MaterialBelico.category == category,
        MaterialBelico.unit_id == unit_id,
        MaterialBelico.custody_type == custody_type,
        MaterialBelico.custody_sector_id == custody_sector_id,
        MaterialBelico.lot_number == lot_number,
        MaterialBelico.item_model == item_model,
        MaterialBelico.item_type == item_type,
    )
    if exclude_item_id is not None:
        query = query.filter(MaterialBelico.id != exclude_item_id)
    return query.first()


def add_tpd_talonario(db: Session, item: TpdTalonario) -> TpdTalonario:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_produto(db: Session, item: EstoqueProduto) -> EstoqueProduto:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_fornecedor(db: Session, item: EstoqueFornecedor) -> EstoqueFornecedor:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_entrada(db: Session, item: EstoqueEntrada) -> EstoqueEntrada:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_saida(db: Session, item: EstoqueSaida) -> EstoqueSaida:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_ordem_manutencao(
    db: Session, item: EstoqueOrdemManutencao
) -> EstoqueOrdemManutencao:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_estoque_movimentacao(db: Session, item: EstoqueMovimentacao) -> EstoqueMovimentacao:
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def save_item(db: Session, item: Item) -> Item:
    db.commit()
    db.refresh(item)
    return item


def save_fleet_vehicle(db: Session, vehicle: FleetVehicle) -> FleetVehicle:
    db.commit()
    db.refresh(vehicle)
    return vehicle


def save_material_belico(db: Session, item: MaterialBelico) -> MaterialBelico:
    db.commit()
    db.refresh(item)
    return item


def save_tpd_talonario(db: Session, item: TpdTalonario) -> TpdTalonario:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_produto(db: Session, item: EstoqueProduto) -> EstoqueProduto:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_fornecedor(db: Session, item: EstoqueFornecedor) -> EstoqueFornecedor:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_entrada(db: Session, item: EstoqueEntrada) -> EstoqueEntrada:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_saida(db: Session, item: EstoqueSaida) -> EstoqueSaida:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_ordem_manutencao(
    db: Session, item: EstoqueOrdemManutencao
) -> EstoqueOrdemManutencao:
    db.commit()
    db.refresh(item)
    return item


def save_estoque_movimentacao(
    db: Session, item: EstoqueMovimentacao
) -> EstoqueMovimentacao:
    db.commit()
    db.refresh(item)
    return item


def add_action_log(db: Session, *, item_id: int, user_id: int, action: str, details: str):
    log = ActionLog(
        item_id=item_id,
        user_id=user_id,
        action=action,
        details=details,
    )
    db.add(log)
    db.commit()
    return log
