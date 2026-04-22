from sqlalchemy import inspect, text


def ensure_processo_craf_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "processos_craf" if is_sqlite else "logistica.processos_craf"

    if "processos_craf" not in table_names:
        create_sql = f"""
        CREATE TABLE {table_ref} (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER,
            tipo_craf VARCHAR(20) NOT NULL,
            re_dc VARCHAR(30) NOT NULL,
            posto_graduacao VARCHAR(80),
            nome VARCHAR(200) NOT NULL,
            data_entrada VARCHAR(20),
            parte VARCHAR(80),
            pm_l80 VARCHAR(40),
            nbi VARCHAR(40),
            bol_int_res VARCHAR(40),
            xerox_doc VARCHAR(40),
            sigma VARCHAR(80),
            bo VARCHAR(120),
            msg_cmb VARCHAR(180),
            data_processo VARCHAR(20),
            observacao TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(unit_id) REFERENCES {"units" if is_sqlite else "rh.units"} (id),
            FOREIGN KEY(police_officer_id) REFERENCES {"police_officers" if is_sqlite else "rh.police_officers"} (id)
        )
        """
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_police_officer_id ON {table_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_tipo_craf ON {table_ref} (tipo_craf)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_re_dc ON {table_ref} (re_dc)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_craf_nome ON {table_ref} (nome)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
        return

    columns = {column["name"] for column in inspector.get_columns("processos_craf", schema=schema)}
    optional_columns = {
        "police_officer_id": f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER",
        "tipo_craf": f"ALTER TABLE {table_ref} ADD COLUMN tipo_craf VARCHAR(20)",
        "re_dc": f"ALTER TABLE {table_ref} ADD COLUMN re_dc VARCHAR(30)",
        "posto_graduacao": f"ALTER TABLE {table_ref} ADD COLUMN posto_graduacao VARCHAR(80)",
        "nome": f"ALTER TABLE {table_ref} ADD COLUMN nome VARCHAR(200)",
        "data_entrada": f"ALTER TABLE {table_ref} ADD COLUMN data_entrada VARCHAR(20)",
        "parte": f"ALTER TABLE {table_ref} ADD COLUMN parte VARCHAR(80)",
        "pm_l80": f"ALTER TABLE {table_ref} ADD COLUMN pm_l80 VARCHAR(40)",
        "nbi": f"ALTER TABLE {table_ref} ADD COLUMN nbi VARCHAR(40)",
        "bol_int_res": f"ALTER TABLE {table_ref} ADD COLUMN bol_int_res VARCHAR(40)",
        "xerox_doc": f"ALTER TABLE {table_ref} ADD COLUMN xerox_doc VARCHAR(40)",
        "sigma": f"ALTER TABLE {table_ref} ADD COLUMN sigma VARCHAR(80)",
        "bo": f"ALTER TABLE {table_ref} ADD COLUMN bo VARCHAR(120)",
        "msg_cmb": f"ALTER TABLE {table_ref} ADD COLUMN msg_cmb VARCHAR(180)",
        "data_processo": f"ALTER TABLE {table_ref} ADD COLUMN data_processo VARCHAR(20)",
        "observacao": f"ALTER TABLE {table_ref} ADD COLUMN observacao TEXT",
        "is_active": f"ALTER TABLE {table_ref} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1",
        "created_at": f"ALTER TABLE {table_ref} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": f"ALTER TABLE {table_ref} ADD COLUMN updated_at TIMESTAMP",
    }

    with engine.begin() as connection:
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))
