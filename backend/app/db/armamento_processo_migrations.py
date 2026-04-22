from sqlalchemy import inspect, text


def ensure_armamento_processo_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "armamento_processos" if is_sqlite else "logistica.armamento_processos"

    if "armamento_processos" not in table_names:
        create_sql = f"""
        CREATE TABLE {table_ref} (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER,
            police_status VARCHAR(20) NOT NULL,
            re_dc VARCHAR(20),
            rank VARCHAR(80),
            full_name VARCHAR(180),
            unit_name_snapshot VARCHAR(160),
            entry_date VARCHAR(20) NOT NULL,
            caliber VARCHAR(20) NOT NULL,
            process_text TEXT,
            internal_bulletin VARCHAR(160),
            observations TEXT,
            status VARCHAR(40) NOT NULL,
            cmb_sent_date VARCHAR(20),
            result VARCHAR(60),
            result_date VARCHAR(20),
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(unit_id) REFERENCES {"units" if is_sqlite else "rh.units"} (id),
            FOREIGN KEY(police_officer_id) REFERENCES {"police_officers" if is_sqlite else "rh.police_officers"} (id)
        )
        """
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_police_officer_id ON {table_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_police_status ON {table_ref} (police_status)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_re_dc ON {table_ref} (re_dc)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_full_name ON {table_ref} (full_name)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_caliber ON {table_ref} (caliber)",
            f"CREATE INDEX IF NOT EXISTS ix_armamento_processos_status ON {table_ref} (status)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
        return

    columns = {column["name"] for column in inspector.get_columns("armamento_processos", schema=schema)}
    optional_columns = {
        "police_officer_id": f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER",
        "police_status": f"ALTER TABLE {table_ref} ADD COLUMN police_status VARCHAR(20) NOT NULL DEFAULT 'ATIVO'",
        "re_dc": f"ALTER TABLE {table_ref} ADD COLUMN re_dc VARCHAR(20)",
        "rank": f"ALTER TABLE {table_ref} ADD COLUMN rank VARCHAR(80)",
        "full_name": f"ALTER TABLE {table_ref} ADD COLUMN full_name VARCHAR(180)",
        "unit_name_snapshot": f"ALTER TABLE {table_ref} ADD COLUMN unit_name_snapshot VARCHAR(160)",
        "entry_date": f"ALTER TABLE {table_ref} ADD COLUMN entry_date VARCHAR(20) NOT NULL DEFAULT ''",
        "caliber": f"ALTER TABLE {table_ref} ADD COLUMN caliber VARCHAR(20) NOT NULL DEFAULT 'PERMITIDO'",
        "process_text": f"ALTER TABLE {table_ref} ADD COLUMN process_text TEXT",
        "internal_bulletin": f"ALTER TABLE {table_ref} ADD COLUMN internal_bulletin VARCHAR(160)",
        "observations": f"ALTER TABLE {table_ref} ADD COLUMN observations TEXT",
        "status": f"ALTER TABLE {table_ref} ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'EM_ANDAMENTO'",
        "cmb_sent_date": f"ALTER TABLE {table_ref} ADD COLUMN cmb_sent_date VARCHAR(20)",
        "result": f"ALTER TABLE {table_ref} ADD COLUMN result VARCHAR(60)",
        "result_date": f"ALTER TABLE {table_ref} ADD COLUMN result_date VARCHAR(20)",
        "is_active": f"ALTER TABLE {table_ref} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1",
        "created_at": f"ALTER TABLE {table_ref} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": f"ALTER TABLE {table_ref} ADD COLUMN updated_at TIMESTAMP",
    }

    with engine.begin() as connection:
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))
