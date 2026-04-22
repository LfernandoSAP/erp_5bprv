from sqlalchemy import inspect, text

from app.modules.logistica.fleet_constants import VALID_FLEET_GROUP_CODES


def ensure_fleet_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "fleet_vehicles" if is_sqlite else "logistica.fleet_vehicles"
    movement_table_ref = "fleet_vehicle_movements" if is_sqlite else "logistica.fleet_vehicle_movements"

    if "fleet_vehicles" in table_names:
        columns = {column["name"] for column in inspector.get_columns("fleet_vehicles", schema=schema)}
        statements = []
        if "police_officer_id" not in columns:
            statements.append(f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER")
            statements.append(
                f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_police_officer_id ON {table_ref} (police_officer_id)"
            )
        optional_columns = {
            "group_code": f"ALTER TABLE {table_ref} ADD COLUMN group_code VARCHAR(80)",
            "telemetry": f"ALTER TABLE {table_ref} ADD COLUMN telemetry VARCHAR(10)",
            "wheel_count": f"ALTER TABLE {table_ref} ADD COLUMN wheel_count VARCHAR(10)",
            "patrimony": f"ALTER TABLE {table_ref} ADD COLUMN patrimony VARCHAR(80)",
            "rental_company": f"ALTER TABLE {table_ref} ADD COLUMN rental_company VARCHAR(160)",
            "contract_number": f"ALTER TABLE {table_ref} ADD COLUMN contract_number VARCHAR(80)",
            "contract_start": f"ALTER TABLE {table_ref} ADD COLUMN contract_start VARCHAR(20)",
            "contract_end": f"ALTER TABLE {table_ref} ADD COLUMN contract_end VARCHAR(20)",
            "contract_term": f"ALTER TABLE {table_ref} ADD COLUMN contract_term VARCHAR(80)",
            "licensing": f"ALTER TABLE {table_ref} ADD COLUMN licensing VARCHAR(20)",
            "plate": f"ALTER TABLE {table_ref} ADD COLUMN plate VARCHAR(20)",
            "fuel_type": f"ALTER TABLE {table_ref} ADD COLUMN fuel_type VARCHAR(60)",
            "current_mileage": f"ALTER TABLE {table_ref} ADD COLUMN current_mileage VARCHAR(20)",
            "current_mileage_date": f"ALTER TABLE {table_ref} ADD COLUMN current_mileage_date VARCHAR(20)",
            "last_review_date": f"ALTER TABLE {table_ref} ADD COLUMN last_review_date VARCHAR(20)",
            "last_review_mileage": f"ALTER TABLE {table_ref} ADD COLUMN last_review_mileage VARCHAR(20)",
            "situation": f"ALTER TABLE {table_ref} ADD COLUMN situation VARCHAR(120)",
            "employment": f"ALTER TABLE {table_ref} ADD COLUMN employment VARCHAR(80)",
            "renavam": f"ALTER TABLE {table_ref} ADD COLUMN renavam VARCHAR(40)",
            "chassis": f"ALTER TABLE {table_ref} ADD COLUMN chassis VARCHAR(80)",
            "color": f"ALTER TABLE {table_ref} ADD COLUMN color VARCHAR(60)",
            "manufacture_year": f"ALTER TABLE {table_ref} ADD COLUMN manufacture_year VARCHAR(4)",
            "model_year": f"ALTER TABLE {table_ref} ADD COLUMN model_year VARCHAR(4)",
            "fixed_driver": f"ALTER TABLE {table_ref} ADD COLUMN fixed_driver VARCHAR(160)",
            "notes": f"ALTER TABLE {table_ref} ADD COLUMN notes VARCHAR(500)",
        }
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                statements.append(statement)

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))
    else:
        create_sql = """
        CREATE TABLE fleet_vehicles (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER,
            category VARCHAR(50) NOT NULL DEFAULT 'VIATURA_04_RODAS',
            brand VARCHAR(120) NOT NULL,
            model VARCHAR(120) NOT NULL,
            year VARCHAR(4) NOT NULL,
            prefix VARCHAR(80) NOT NULL,
            group_code VARCHAR(80),
            telemetry VARCHAR(10),
            wheel_count VARCHAR(10),
            holder VARCHAR(160) NOT NULL,
            patrimony VARCHAR(80),
            rental_company VARCHAR(160),
            contract_number VARCHAR(80),
            contract_start VARCHAR(20),
            contract_end VARCHAR(20),
            contract_term VARCHAR(80),
            licensing VARCHAR(20),
            plate VARCHAR(20),
            fuel_type VARCHAR(60),
            current_mileage VARCHAR(20),
            current_mileage_date VARCHAR(20),
            last_review_date VARCHAR(20),
            last_review_mileage VARCHAR(20),
            situation VARCHAR(120),
            employment VARCHAR(80),
            renavam VARCHAR(40),
            chassis VARCHAR(80),
            color VARCHAR(60),
            manufacture_year VARCHAR(4),
            model_year VARCHAR(4),
            fixed_driver VARCHAR(160),
            notes VARCHAR(500),
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME,
            FOREIGN KEY(unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(police_officer_id) REFERENCES rh.police_officers (id)
        )
        """

        index_sql = [
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_police_officer_id ON {table_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_category ON {table_ref} (category)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_brand ON {table_ref} (brand)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_model ON {table_ref} (model)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_year ON {table_ref} (year)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_prefix ON {table_ref} (prefix)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_holder ON {table_ref} (holder)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_group_code ON {table_ref} (group_code)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_telemetry ON {table_ref} (telemetry)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_patrimony ON {table_ref} (patrimony)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_plate ON {table_ref} (plate)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_renavam ON {table_ref} (renavam)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_chassis ON {table_ref} (chassis)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_situation ON {table_ref} (situation)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicles_employment ON {table_ref} (employment)",
        ]

        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in index_sql:
                connection.execute(text(statement))

    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            connection.execute(text(f"ALTER TABLE {table_ref} ALTER COLUMN group_code TYPE VARCHAR(80)"))
        allowed_group_values = ", ".join(f"'{value}'" for value in VALID_FLEET_GROUP_CODES)
        connection.execute(
            text(
                f"UPDATE {table_ref} "
                "SET group_code = NULL "
                f"WHERE group_code IS NOT NULL AND group_code NOT IN ({allowed_group_values})"
            )
        )
        connection.execute(
            text(
                f"UPDATE {table_ref} "
                "SET telemetry = NULL "
                "WHERE telemetry IS NOT NULL AND telemetry NOT IN ('Sim', 'Não')"
            )
        )

    if "fleet_vehicle_movements" not in inspector.get_table_names(schema=schema):
        movement_sql = """
        CREATE TABLE logistica.fleet_vehicle_movements (
            id INTEGER PRIMARY KEY,
            fleet_vehicle_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            movement_type VARCHAR(30) NOT NULL,
            from_unit_id INTEGER,
            to_unit_id INTEGER,
            from_police_officer_id INTEGER,
            to_police_officer_id INTEGER,
            details VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(fleet_vehicle_id) REFERENCES logistica.fleet_vehicles (id),
            FOREIGN KEY(user_id) REFERENCES public.users (id),
            FOREIGN KEY(from_unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(to_unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(from_police_officer_id) REFERENCES rh.police_officers (id),
            FOREIGN KEY(to_police_officer_id) REFERENCES rh.police_officers (id)
        )
        """
        if is_sqlite:
            movement_sql = movement_sql.replace("logistica.", "").replace("public.", "").replace("rh.", "")
        movement_indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_id ON {movement_table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_fleet_vehicle_id ON {movement_table_ref} (fleet_vehicle_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_user_id ON {movement_table_ref} (user_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_from_unit_id ON {movement_table_ref} (from_unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_to_unit_id ON {movement_table_ref} (to_unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_from_police_officer_id ON {movement_table_ref} (from_police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_fleet_vehicle_movements_to_police_officer_id ON {movement_table_ref} (to_police_officer_id)",
        ]
        with engine.begin() as connection:
            connection.execute(text(movement_sql))
            for statement in movement_indexes:
                connection.execute(text(statement))
