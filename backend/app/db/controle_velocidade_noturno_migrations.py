from sqlalchemy import inspect, text


def ensure_controle_velocidade_noturno_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "estatistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "controle_velocidade_noturno" if is_sqlite else "estatistica.controle_velocidade_noturno"

    if "controle_velocidade_noturno" not in table_names:
        create_sql = """
        CREATE TABLE estatistica.controle_velocidade_noturno (
            id INTEGER PRIMARY KEY,
            data_registro DATE NOT NULL,
            unit_id INTEGER NOT NULL,
            quantidade_autuados INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(unit_id) REFERENCES rh.units (id),
            FOREIGN KEY(created_by) REFERENCES users (id)
        )
        """
        if is_sqlite:
            create_sql = create_sql.replace("estatistica.", "").replace("rh.", "")

        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_controle_velocidade_noturno_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_velocidade_noturno_data_registro ON {table_ref} (data_registro)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_velocidade_noturno_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_velocidade_noturno_created_by ON {table_ref} (created_by)",
        ]

        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
    else:
        columns = {column["name"] for column in inspector.get_columns("controle_velocidade_noturno", schema=schema)}
        if "quantidade_autuados" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_ref} ADD COLUMN quantidade_autuados INTEGER NOT NULL DEFAULT 0"
                    )
                )
