import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.item import Item
from app.models.item_movement import ItemMovement
from app.models.police_officer import PoliceOfficer
from app.models.sector import Sector
from app.models.unit import Unit
from app.models.user import User
from app.models.user_module_access import UserModuleAccess
from app.routes.item_movement import create_movement
from app.routes.item_movement import list_movements
from app.routes.items import create_item
from app.routes.items import list_items, search_items
from app.routes.items import update_item
from app.schemas.item import ItemCreate, ItemUpdate
from app.schemas.item_movement import ItemMovementCreate
from app.utils.scope import collect_descendant_unit_ids_from_db


class ItemUnitFilterTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            future=True,
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
            future=True,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        self._seed_data()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def _seed_data(self):
        units = [
            Unit(id=1, name="5BPRv-EM", type="batalhao", can_view_all=True, is_active=True),
            Unit(id=2, name="1Cia", type="cia", parent_unit_id=1, is_active=True),
            Unit(id=3, name="2Cia", type="cia", parent_unit_id=1, is_active=True),
            Unit(id=4, name="3Cia", type="cia", parent_unit_id=1, is_active=True),
            Unit(id=8, name="1Pel", type="pelotao", parent_unit_id=2, is_active=True),
            Unit(id=9, name="2Pel", type="pelotao", parent_unit_id=2, is_active=True),
            Unit(id=10, name="1Pel", type="pelotao", parent_unit_id=3, is_active=True),
            Unit(id=11, name="2Pel", type="pelotao", parent_unit_id=3, is_active=True),
            Unit(id=12, name="1Pel", type="pelotao", parent_unit_id=4, is_active=True),
            Unit(id=13, name="2Pel", type="pelotao", parent_unit_id=4, is_active=True),
        ]
        self.db.add_all(units)

        sectors = [
            Sector(id=1, unit_id=1, name="P4", code="P4", is_active=True),
            Sector(id=2, unit_id=2, name="P4", code="P4", is_active=True),
            Sector(id=3, unit_id=3, name="P4", code="P4", is_active=True),
        ]
        self.db.add_all(sectors)

        officers = [
            PoliceOfficer(
                id=1,
                full_name="Joao da Silva",
                war_name="Silva",
                rank="CB",
                re_with_digit="123456-7",
                cpf="44444444444",
                unit_id=2,
                is_active=True,
            ),
            PoliceOfficer(
                id=2,
                full_name="Carlos Pereira",
                war_name="Pereira",
                rank="SD",
                re_with_digit="765432-1",
                cpf="55555555555",
                unit_id=2,
                is_active=True,
            ),
        ]
        self.db.add_all(officers)

        self.em_user = User(
            id=1,
            cpf="11111111111",
            name="Bille",
            unit_id=1,
            sector_id=1,
            role_code="OPERADOR",
            password_hash="hash",
            is_admin=False,
            is_active=True,
        )
        self.em_admin = User(
            id=2,
            cpf="22222222222",
            name="Admin EM",
            unit_id=1,
            sector_id=1,
            role_code="ADMIN_GLOBAL",
            password_hash="hash",
            is_admin=True,
            is_active=True,
        )
        self.cia_user = User(
            id=3,
            cpf="33333333333",
            name="Usuario 1Cia",
            unit_id=2,
            sector_id=2,
            role_code="OPERADOR",
            password_hash="hash",
            is_admin=False,
            is_active=True,
        )
        self.db.add_all([self.em_user, self.em_admin, self.cia_user])
        self.db.add_all(
            [
                UserModuleAccess(user=self.em_user, module_code="P4"),
                UserModuleAccess(user=self.cia_user, module_code="P4"),
            ]
        )

        items = [
            Item(id=1, name="Furadeira", unit_id=1, category="Infra", serial_number="FUR-001", asset_tag="PAT-001", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=2, name="Furadeira", unit_id=2, category="Infra", serial_number="FUR-002", asset_tag="PAT-002", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=3, name="Furadeira", unit_id=8, category="Infra", serial_number="FUR-008", asset_tag="PAT-008", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=4, name="Furadeira", unit_id=9, category="Infra", serial_number="FUR-009", asset_tag="PAT-009", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=5, name="Furadeira", unit_id=3, category="Infra", serial_number="FUR-003", asset_tag="PAT-003", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=6, name="Furadeira", unit_id=10, category="Infra", serial_number="FUR-010", asset_tag="PAT-010", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=7, name="Furadeira", unit_id=11, category="Infra", serial_number="FUR-011", asset_tag="PAT-011", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
            Item(id=8, name="Furadeira", unit_id=12, category="Infra", serial_number="FUR-012", asset_tag="PAT-012", status="EM_USO", is_active=True, custody_type="RESERVA_UNIDADE"),
        ]
        self.db.add_all(items)
        self.db.add_all(
            [
                ItemMovement(
                    id=1,
                    item_id=2,
                    user_id=1,
                    movement_type="TRANSFERENCIA",
                    from_unit_id=2,
                    to_unit_id=3,
                    details="Movimento 1Cia para 2Cia",
                ),
                ItemMovement(
                    id=2,
                    item_id=1,
                    user_id=1,
                    movement_type="TRANSFERENCIA",
                    from_unit_id=1,
                    to_unit_id=2,
                    details="Movimento EM para 1Cia",
                ),
                ItemMovement(
                    id=3,
                    item_id=5,
                    user_id=2,
                    movement_type="TRANSFERENCIA",
                    from_unit_id=3,
                    to_unit_id=10,
                    details="Movimento 2Cia para 1Pel da 2Cia",
                ),
            ]
        )
        self.db.commit()

    def test_collect_descendant_unit_ids_for_company(self):
        self.assertEqual(
            collect_descendant_unit_ids_from_db(self.db, 2),
            {2, 8, 9},
        )

    def test_list_items_with_company_filter_returns_only_company_and_children(self):
        rows = list_items(
            include_inactive=False,
            unit_id=2,
            db=self.db,
            current_user=self.em_user,
        )
        self.assertEqual([row.unit_id for row in rows], [9, 8, 2])

    def test_search_items_company_filter_with_keyword_returns_only_company_scope(self):
        rows = search_items(
            q="furadeira",
            include_inactive=False,
            unit_id=2,
            db=self.db,
            current_user=self.em_user,
        )
        self.assertEqual([row.unit_id for row in rows], [9, 8, 2])

    def test_search_items_company_filter_with_missing_keyword_returns_empty(self):
        rows = search_items(
            q="nao-existe",
            include_inactive=False,
            unit_id=2,
            db=self.db,
            current_user=self.em_user,
        )
        self.assertEqual(rows, [])

    def test_search_items_battalion_filter_returns_only_battalion_items(self):
        rows = search_items(
            q="furadeira",
            include_inactive=False,
            unit_id=1,
            db=self.db,
            current_user=self.em_user,
        )
        self.assertEqual([row.unit_id for row in rows], [1])

    def test_search_items_other_company_filter_respects_that_hierarchy(self):
        rows = search_items(
            q="furadeira",
            include_inactive=False,
            unit_id=3,
            db=self.db,
            current_user=self.em_admin,
        )
        self.assertEqual([row.unit_id for row in rows], [11, 10, 3])

    def test_search_items_company_user_respects_company_scope(self):
        rows = search_items(
            q="furadeira",
            include_inactive=False,
            unit_id=2,
            db=self.db,
            current_user=self.cia_user,
        )
        self.assertEqual([row.unit_id for row in rows], [9, 8, 2])

    def test_list_movements_company_filter_uses_origin_and_destination_units(self):
        rows = list_movements(
            unit_id=2,
            db=self.db,
            current_user=self.em_user,
        )
        self.assertEqual([row.id for row in rows], [2, 1])

    def test_list_movements_company_user_only_sees_company_history(self):
        rows = list_movements(
            unit_id=None,
            db=self.db,
            current_user=self.cia_user,
        )
        self.assertEqual([row.id for row in rows], [2, 1])

    def test_update_item_persists_location_and_police_custody(self):
        payload = ItemUpdate(
            unit_id=2,
            custody_type="POLICIAL",
            police_officer_id=1,
            location="Sala de som - armario 2",
        )

        updated = update_item(
            item_id=2,
            payload=payload,
            db=self.db,
            current_user=self.em_admin,
        )

        self.assertEqual(updated.custody_type, "POLICIAL")
        self.assertEqual(updated.police_officer_id, 1)
        self.assertIsNone(updated.custody_sector_id)
        self.assertEqual(updated.location, "Sala de som - armario 2")

    def test_create_item_persists_police_custody_and_location(self):
        payload = ItemCreate(
            name="Mesa de som",
            unit_id=2,
            category="Audio",
            custody_type="POLICIAL",
            police_officer_id=1,
            serial_number="SOM-100",
            asset_tag="PAT-SOM-100",
            status="EM_USO",
            location="Sala de operacoes",
        )

        created = create_item(
            payload=payload,
            db=self.db,
            current_user=self.em_admin,
        )

        self.assertEqual(created.custody_type, "POLICIAL")
        self.assertEqual(created.police_officer_id, 1)
        self.assertIsNone(created.custody_sector_id)
        self.assertEqual(created.location, "Sala de operacoes")

    def test_update_item_persists_sector_custody_for_battalion_unit(self):
        payload = ItemUpdate(
            unit_id=1,
            sector_id=1,
            custody_type="SETOR",
            custody_sector_id=1,
            location="Academia",
        )

        updated = update_item(
            item_id=1,
            payload=payload,
            db=self.db,
            current_user=self.em_admin,
        )

        self.assertEqual(updated.custody_type, "SETOR")
        self.assertEqual(updated.sector_id, 1)
        self.assertEqual(updated.custody_sector_id, 1)
        self.assertIsNone(updated.police_officer_id)
        self.assertEqual(updated.location, "Academia")

    def test_update_item_requires_custody_sector_when_type_is_sector(self):
        payload = ItemUpdate(
            unit_id=1,
            custody_type="SETOR",
            custody_sector_id=None,
        )

        with self.assertRaisesRegex(
            HTTPException,
            "Selecione um setor para responsabilidade do setor.",
        ):
            update_item(
                item_id=1,
                payload=payload,
                db=self.db,
                current_user=self.em_admin,
            )

    def test_create_movement_persists_destination_location_and_police_custody(self):
        item = self.db.get(Item, 2)
        item.custody_type = "RESERVA_UNIDADE"
        item.custody_sector_id = None
        item.police_officer_id = None
        item.location = "Mesa anterior"
        self.db.commit()

        payload = ItemMovementCreate(
            item_id=2,
            movement_type="TRANSFERENCIA",
            from_unit_id=2,
            to_unit_id=2,
            from_custody_type="RESERVA_UNIDADE",
            to_custody_type="POLICIAL",
            to_police_officer_id=2,
            from_location="Mesa anterior",
            to_location="Mesa de som - apoio",
            details="Transferencia interna da mesa de som",
        )

        movement = create_movement(
            payload=payload,
            db=self.db,
            current_user=self.em_admin,
        )

        refreshed_item = self.db.get(Item, 2)

        self.assertEqual(movement.to_police_officer_id, 2)
        self.assertEqual(movement.to_location, "Mesa de som - apoio")
        self.assertEqual(refreshed_item.custody_type, "POLICIAL")
        self.assertEqual(refreshed_item.police_officer_id, 2)
        self.assertEqual(refreshed_item.location, "Mesa de som - apoio")


if __name__ == "__main__":
    unittest.main()
