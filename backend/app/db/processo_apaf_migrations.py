from sqlalchemy import inspect, text


def ensure_processo_apaf_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "processos_apaf" if is_sqlite else "logistica.processos_apaf"

    if "processos_apaf" not in table_names:
        create_sql = f"""
        CREATE TABLE {table_ref} (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER,
            re_dc VARCHAR(30) NOT NULL,
            posto_graduacao VARCHAR(80),
            nome VARCHAR(200) NOT NULL,
            cia_entregou VARCHAR(160),
            data_entrada VARCHAR(20),
            parte VARCHAR(80),
            sigma VARCHAR(80),
            data_cadastro VARCHAR(20),
            solic_consulta_pi VARCHAR(40),
            sei VARCHAR(120),
            envio_cprv_link TEXT,
            cert_1 VARCHAR(40),
            cert_2 VARCHAR(40),
            cert_3 VARCHAR(40),
            rg VARCHAR(30),
            cpf VARCHAR(20),
            comp_residencia VARCHAR(40),
            boletim_geral VARCHAR(80),
            apafi VARCHAR(80),
            data_entrega VARCHAR(20),
            observacao TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(unit_id) REFERENCES {"units" if is_sqlite else "rh.units"} (id),
            FOREIGN KEY(police_officer_id) REFERENCES {"police_officers" if is_sqlite else "rh.police_officers"} (id)
        )
        """
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_police_officer_id ON {table_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_re_dc ON {table_ref} (re_dc)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_nome ON {table_ref} (nome)",
            f"CREATE INDEX IF NOT EXISTS ix_processos_apaf_cia_entregou ON {table_ref} (cia_entregou)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
        return

    columns = {column["name"] for column in inspector.get_columns("processos_apaf", schema=schema)}
    optional_columns = {
        "police_officer_id": f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER",
        "re_dc": f"ALTER TABLE {table_ref} ADD COLUMN re_dc VARCHAR(30)",
        "posto_graduacao": f"ALTER TABLE {table_ref} ADD COLUMN posto_graduacao VARCHAR(80)",
        "nome": f"ALTER TABLE {table_ref} ADD COLUMN nome VARCHAR(200)",
        "cia_entregou": f"ALTER TABLE {table_ref} ADD COLUMN cia_entregou VARCHAR(160)",
        "data_entrada": f"ALTER TABLE {table_ref} ADD COLUMN data_entrada VARCHAR(20)",
        "parte": f"ALTER TABLE {table_ref} ADD COLUMN parte VARCHAR(80)",
        "sigma": f"ALTER TABLE {table_ref} ADD COLUMN sigma VARCHAR(80)",
        "data_cadastro": f"ALTER TABLE {table_ref} ADD COLUMN data_cadastro VARCHAR(20)",
        "solic_consulta_pi": f"ALTER TABLE {table_ref} ADD COLUMN solic_consulta_pi VARCHAR(40)",
        "sei": f"ALTER TABLE {table_ref} ADD COLUMN sei VARCHAR(120)",
        "envio_cprv_link": f"ALTER TABLE {table_ref} ADD COLUMN envio_cprv_link TEXT",
        "cert_1": f"ALTER TABLE {table_ref} ADD COLUMN cert_1 VARCHAR(40)",
        "cert_2": f"ALTER TABLE {table_ref} ADD COLUMN cert_2 VARCHAR(40)",
        "cert_3": f"ALTER TABLE {table_ref} ADD COLUMN cert_3 VARCHAR(40)",
        "rg": f"ALTER TABLE {table_ref} ADD COLUMN rg VARCHAR(30)",
        "cpf": f"ALTER TABLE {table_ref} ADD COLUMN cpf VARCHAR(20)",
        "comp_residencia": f"ALTER TABLE {table_ref} ADD COLUMN comp_residencia VARCHAR(40)",
        "boletim_geral": f"ALTER TABLE {table_ref} ADD COLUMN boletim_geral VARCHAR(80)",
        "apafi": f"ALTER TABLE {table_ref} ADD COLUMN apafi VARCHAR(80)",
        "data_entrega": f"ALTER TABLE {table_ref} ADD COLUMN data_entrega VARCHAR(20)",
        "observacao": f"ALTER TABLE {table_ref} ADD COLUMN observacao TEXT",
        "is_active": f"ALTER TABLE {table_ref} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1",
        "created_at": f"ALTER TABLE {table_ref} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": f"ALTER TABLE {table_ref} ADD COLUMN updated_at TIMESTAMP",
    }

    with engine.begin() as connection:
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))
