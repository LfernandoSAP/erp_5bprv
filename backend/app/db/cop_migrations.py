from sqlalchemy import inspect, text


def ensure_cops_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    cops_ref = "cops" if is_sqlite else "logistica.cops"
    movements_ref = "cop_movements" if is_sqlite else "logistica.cop_movements"

    if "cops" not in table_names:
        create_sql = """
        CREATE TABLE logistica.cops (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            name VARCHAR(180) NOT NULL,
            model VARCHAR(180) NOT NULL,
            serial_number VARCHAR(120),
            patrimony VARCHAR(120),
            responsibility_type VARCHAR(40),
            material_sector_id INTEGER,
            responsible_sector_id INTEGER,
            police_officer_id INTEGER,
            fleet_vehicle_id INTEGER,
            holder VARCHAR(40),
            holder_concessionaria VARCHAR(180),
            status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
            location VARCHAR(240),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME,
            FOREIGN KEY(unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(material_sector_id) REFERENCES rh.sectors (id),
            FOREIGN KEY(responsible_sector_id) REFERENCES rh.sectors (id),
            FOREIGN KEY(police_officer_id) REFERENCES rh.police_officers (id),
            FOREIGN KEY(fleet_vehicle_id) REFERENCES logistica.fleet_vehicles (id)
        )
        """
        if is_sqlite:
            create_sql = create_sql.replace("logistica.", "").replace("rh.", "")
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_cops_id ON {cops_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_unit_id ON {cops_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_name ON {cops_ref} (name)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_model ON {cops_ref} (model)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_serial_number ON {cops_ref} (serial_number)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_patrimony ON {cops_ref} (patrimony)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_responsibility_type ON {cops_ref} (responsibility_type)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_material_sector_id ON {cops_ref} (material_sector_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_responsible_sector_id ON {cops_ref} (responsible_sector_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_police_officer_id ON {cops_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_fleet_vehicle_id ON {cops_ref} (fleet_vehicle_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_holder ON {cops_ref} (holder)",
            f"CREATE INDEX IF NOT EXISTS ix_cops_status ON {cops_ref} (status)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
    else:
        columns = {column["name"] for column in inspector.get_columns("cops", schema=schema)}
        optional_columns = {
            "serial_number": f"ALTER TABLE {cops_ref} ADD COLUMN serial_number VARCHAR(120)",
            "patrimony": f"ALTER TABLE {cops_ref} ADD COLUMN patrimony VARCHAR(120)",
            "responsibility_type": f"ALTER TABLE {cops_ref} ADD COLUMN responsibility_type VARCHAR(40)",
            "material_sector_id": f"ALTER TABLE {cops_ref} ADD COLUMN material_sector_id INTEGER",
            "responsible_sector_id": f"ALTER TABLE {cops_ref} ADD COLUMN responsible_sector_id INTEGER",
            "police_officer_id": f"ALTER TABLE {cops_ref} ADD COLUMN police_officer_id INTEGER",
            "fleet_vehicle_id": f"ALTER TABLE {cops_ref} ADD COLUMN fleet_vehicle_id INTEGER",
            "holder": f"ALTER TABLE {cops_ref} ADD COLUMN holder VARCHAR(40)",
            "holder_concessionaria": f"ALTER TABLE {cops_ref} ADD COLUMN holder_concessionaria VARCHAR(180)",
            "status": f"ALTER TABLE {cops_ref} ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'Ativo'",
            "location": f"ALTER TABLE {cops_ref} ADD COLUMN location VARCHAR(240)",
            "notes": f"ALTER TABLE {cops_ref} ADD COLUMN notes TEXT",
        }
        with engine.begin() as connection:
            for column_name, statement in optional_columns.items():
                if column_name not in columns:
                    connection.execute(text(statement))

    if "cop_movements" not in inspector.get_table_names(schema=schema):
        movement_sql = """
        CREATE TABLE logistica.cop_movements (
            id INTEGER PRIMARY KEY,
            cop_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            movement_type VARCHAR(40) NOT NULL,
            from_unit_id INTEGER,
            to_unit_id INTEGER,
            to_sector_id INTEGER,
            to_police_officer_id INTEGER,
            movement_date VARCHAR(20),
            observation TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(cop_id) REFERENCES logistica.cops (id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users (id),
            FOREIGN KEY(from_unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(to_unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(to_sector_id) REFERENCES rh.sectors (id),
            FOREIGN KEY(to_police_officer_id) REFERENCES rh.police_officers (id)
        )
        """
        if is_sqlite:
            movement_sql = movement_sql.replace("logistica.", "").replace("rh.", "")
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_id ON {movements_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_cop_id ON {movements_ref} (cop_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_user_id ON {movements_ref} (user_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_movement_type ON {movements_ref} (movement_type)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_from_unit_id ON {movements_ref} (from_unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_to_unit_id ON {movements_ref} (to_unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_to_sector_id ON {movements_ref} (to_sector_id)",
            f"CREATE INDEX IF NOT EXISTS ix_cop_movements_to_police_officer_id ON {movements_ref} (to_police_officer_id)",
        ]
        with engine.begin() as connection:
            connection.execute(text(movement_sql))
            for statement in indexes:
                connection.execute(text(statement))
