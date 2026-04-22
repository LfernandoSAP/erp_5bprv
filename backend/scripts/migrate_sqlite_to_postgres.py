import os
import sys
from pathlib import Path

from sqlalchemy import MetaData, create_engine, select, text


ROOT_DIR = Path(__file__).resolve().parents[1]
APP_DIR = ROOT_DIR / "app"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.db.database import Base  # noqa: E402
from app.models.unit import Unit  # noqa: F401,E402
from app.models.user import User  # noqa: F401,E402
from app.models.user_module_access import UserModuleAccess  # noqa: F401,E402
from app.models.category import Category  # noqa: F401,E402
from app.models.item import Item  # noqa: F401,E402
from app.models.fleet_vehicle import FleetVehicle  # noqa: F401,E402
from app.models.fleet_vehicle_movement import FleetVehicleMovement  # noqa: F401,E402
from app.models.action_log import ActionLog  # noqa: F401,E402
from app.models.item_movement import ItemMovement  # noqa: F401,E402
from app.models.material_belico import MaterialBelico  # noqa: F401,E402
from app.models.material_belico_movement import MaterialBelicoMovement  # noqa: F401,E402
from app.models.police_officer import PoliceOfficer  # noqa: F401,E402
from app.models.police_officer_movement import PoliceOfficerMovement  # noqa: F401,E402
from app.models.sector import Sector  # noqa: F401,E402


SOURCE_URL = os.getenv("SOURCE_DATABASE_URL", "sqlite:///./erp5bprv.db")
TARGET_URL = os.getenv("TARGET_DATABASE_URL")

if not TARGET_URL:
    raise SystemExit("TARGET_DATABASE_URL não informado.")

source_engine = create_engine(SOURCE_URL, future=True)
target_engine = create_engine(TARGET_URL, future=True)


def reflect_metadata(engine):
    metadata = MetaData()
    metadata.reflect(bind=engine)
    return metadata


def reset_postgres_sequences(connection, metadata):
    for table in metadata.sorted_tables:
        if "id" not in table.c:
            continue
        table_name = table.name
        connection.execute(
            text(
                f"""
                SELECT setval(
                    pg_get_serial_sequence('{table_name}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table_name}), 1),
                    EXISTS (SELECT 1 FROM {table_name})
                )
                """
            )
        )


def main():
    print(f"Origem: {SOURCE_URL}")
    print(f"Destino: {TARGET_URL}")

    Base.metadata.create_all(bind=target_engine)

    source_metadata = reflect_metadata(source_engine)
    target_metadata = reflect_metadata(target_engine)

    preferred_order = [
        "categories",
        "units",
        "sectors",
        "police_officers",
        "users",
        "user_module_access",
        "fleet_vehicles",
        "items",
        "material_belico",
        "action_logs",
        "item_movements",
        "material_belico_movements",
        "fleet_vehicle_movements",
        "police_officer_movements",
    ]

    ordered_table_names = [
        table_name for table_name in preferred_order if table_name in source_metadata.tables
    ]

    ordered_table_names.extend(
        [
            table.name
            for table in source_metadata.sorted_tables
            if table.name in target_metadata.tables and table.name not in ordered_table_names
        ]
    )

    migrated_counts = {}

    with source_engine.connect() as source_conn, target_engine.begin() as target_conn:
        for table_name in ordered_table_names:
            source_table = source_metadata.tables[table_name]
            target_table = target_metadata.tables[table_name]
            rows = source_conn.execute(select(source_table)).mappings().all()
            payload = [dict(row) for row in rows]
            if payload:
                target_conn.execute(target_table.insert(), payload)
            migrated_counts[table_name] = len(payload)
            print(f"{table_name}: {len(payload)} registro(s)")

        reset_postgres_sequences(target_conn, target_metadata)

    print("Migração concluída.")
    print("Resumo:")
    for table_name in ordered_table_names:
        print(f"- {table_name}: {migrated_counts.get(table_name, 0)}")


if __name__ == "__main__":
    main()
