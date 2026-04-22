from sqlalchemy import inspect, text


def ensure_mapa_forca_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "mapa_forca" if is_sqlite else "logistica.mapa_forca"

    if "mapa_forca" not in table_names:
        create_sql = """
        CREATE TABLE logistica.mapa_forca (
            id INTEGER PRIMARY KEY,
            viatura_id INTEGER NOT NULL,
            seq INTEGER,
            bprv INTEGER NOT NULL DEFAULT 5,
            cia INTEGER NOT NULL DEFAULT 0,
            pel INTEGER NOT NULL DEFAULT 0,
            grafismo VARCHAR(40),
            tag_sem_parar VARCHAR(10),
            observacao VARCHAR(500),
            ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(viatura_id) REFERENCES logistica.fleet_vehicles (id),
            FOREIGN KEY(updated_by) REFERENCES users (id)
        )
        """
        if is_sqlite:
            create_sql = create_sql.replace("logistica.", "")
        indexes = [
            f"CREATE UNIQUE INDEX IF NOT EXISTS uq_mapa_forca_viatura_id ON {table_ref} (viatura_id)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_seq ON {table_ref} (seq)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_bprv ON {table_ref} (bprv)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_cia ON {table_ref} (cia)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_pel ON {table_ref} (pel)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_grafismo ON {table_ref} (grafismo)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_tag_sem_parar ON {table_ref} (tag_sem_parar)",
            f"CREATE INDEX IF NOT EXISTS ix_mapa_forca_updated_by ON {table_ref} (updated_by)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
        return

    columns = {column["name"] for column in inspector.get_columns("mapa_forca", schema=schema)}
    optional_columns = {
        "seq": f"ALTER TABLE {table_ref} ADD COLUMN seq INTEGER",
        "bprv": f"ALTER TABLE {table_ref} ADD COLUMN bprv INTEGER NOT NULL DEFAULT 5",
        "cia": f"ALTER TABLE {table_ref} ADD COLUMN cia INTEGER NOT NULL DEFAULT 0",
        "pel": f"ALTER TABLE {table_ref} ADD COLUMN pel INTEGER NOT NULL DEFAULT 0",
        "grafismo": f"ALTER TABLE {table_ref} ADD COLUMN grafismo VARCHAR(40)",
        "tag_sem_parar": f"ALTER TABLE {table_ref} ADD COLUMN tag_sem_parar VARCHAR(10)",
        "observacao": f"ALTER TABLE {table_ref} ADD COLUMN observacao VARCHAR(500)",
        "ultima_atualizacao": f"ALTER TABLE {table_ref} ADD COLUMN ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP",
        "updated_by": f"ALTER TABLE {table_ref} ADD COLUMN updated_by INTEGER",
        "created_at": f"ALTER TABLE {table_ref} ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    }
    with engine.begin() as connection:
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))
        connection.execute(text(f"CREATE UNIQUE INDEX IF NOT EXISTS uq_mapa_forca_viatura_id ON {table_ref} (viatura_id)"))
