from sqlalchemy import inspect, text


def ensure_controle_efetivo_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "rh"
    table_names = inspector.get_table_names(schema=schema)
    table_ref = "controle_efetivo" if is_sqlite else "rh.controle_efetivo"

    if "controle_efetivo" not in table_names:
        create_sql = f"""
        CREATE TABLE {table_ref} (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER,
            re_dc VARCHAR(30) NOT NULL,
            quadro VARCHAR(20) NOT NULL,
            nome VARCHAR(200) NOT NULL,
            sexo VARCHAR(30),
            unidade VARCHAR(180),
            opm_atual VARCHAR(20),
            sinesp VARCHAR(10),
            processo_regular VARCHAR(10),
            numero_processo VARCHAR(120),
            situacao VARCHAR(80) NOT NULL,
            situacao_outros VARCHAR(180),
            obs_situacao TEXT,
            cep_tran_rv VARCHAR(10),
            data_admissao VARCHAR(20),
            data_25_anos VARCHAR(20),
            averbacao_inss VARCHAR(120),
            averbacao_militar VARCHAR(120),
            inatividade VARCHAR(120),
            cprv VARCHAR(10),
            data_apresentacao VARCHAR(20),
            data_nascimento VARCHAR(20),
            nivel_escolaridade VARCHAR(80),
            curso VARCHAR(180),
            rg VARCHAR(30),
            cpf VARCHAR(20),
            telefone_celular VARCHAR(20),
            telefone_2 VARCHAR(20),
            email_funcional VARCHAR(180),
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(unit_id) REFERENCES {"units" if is_sqlite else "rh.units"} (id),
            FOREIGN KEY(police_officer_id) REFERENCES {"police_officers" if is_sqlite else "rh.police_officers"} (id)
        )
        """
        indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_id ON {table_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_unit_id ON {table_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_police_officer_id ON {table_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_re_dc ON {table_ref} (re_dc)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_nome ON {table_ref} (nome)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_quadro ON {table_ref} (quadro)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_unidade ON {table_ref} (unidade)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_opm_atual ON {table_ref} (opm_atual)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_situacao ON {table_ref} (situacao)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_sinesp ON {table_ref} (sinesp)",
            f"CREATE INDEX IF NOT EXISTS ix_controle_efetivo_cprv ON {table_ref} (cprv)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_sql))
            for statement in indexes:
                connection.execute(text(statement))
        return

    columns = {column["name"] for column in inspector.get_columns("controle_efetivo", schema=schema)}
    optional_columns = {
        "police_officer_id": f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER",
        "re_dc": f"ALTER TABLE {table_ref} ADD COLUMN re_dc VARCHAR(30)",
        "quadro": f"ALTER TABLE {table_ref} ADD COLUMN quadro VARCHAR(20)",
        "nome": f"ALTER TABLE {table_ref} ADD COLUMN nome VARCHAR(200)",
        "sexo": f"ALTER TABLE {table_ref} ADD COLUMN sexo VARCHAR(30)",
        "unidade": f"ALTER TABLE {table_ref} ADD COLUMN unidade VARCHAR(180)",
        "opm_atual": f"ALTER TABLE {table_ref} ADD COLUMN opm_atual VARCHAR(20)",
        "sinesp": f"ALTER TABLE {table_ref} ADD COLUMN sinesp VARCHAR(10)",
        "processo_regular": f"ALTER TABLE {table_ref} ADD COLUMN processo_regular VARCHAR(10)",
        "numero_processo": f"ALTER TABLE {table_ref} ADD COLUMN numero_processo VARCHAR(120)",
        "situacao": f"ALTER TABLE {table_ref} ADD COLUMN situacao VARCHAR(80)",
        "situacao_outros": f"ALTER TABLE {table_ref} ADD COLUMN situacao_outros VARCHAR(180)",
        "obs_situacao": f"ALTER TABLE {table_ref} ADD COLUMN obs_situacao TEXT",
        "cep_tran_rv": f"ALTER TABLE {table_ref} ADD COLUMN cep_tran_rv VARCHAR(10)",
        "data_admissao": f"ALTER TABLE {table_ref} ADD COLUMN data_admissao VARCHAR(20)",
        "data_25_anos": f"ALTER TABLE {table_ref} ADD COLUMN data_25_anos VARCHAR(20)",
        "averbacao_inss": f"ALTER TABLE {table_ref} ADD COLUMN averbacao_inss VARCHAR(120)",
        "averbacao_militar": f"ALTER TABLE {table_ref} ADD COLUMN averbacao_militar VARCHAR(120)",
        "inatividade": f"ALTER TABLE {table_ref} ADD COLUMN inatividade VARCHAR(120)",
        "cprv": f"ALTER TABLE {table_ref} ADD COLUMN cprv VARCHAR(10)",
        "data_apresentacao": f"ALTER TABLE {table_ref} ADD COLUMN data_apresentacao VARCHAR(20)",
        "data_nascimento": f"ALTER TABLE {table_ref} ADD COLUMN data_nascimento VARCHAR(20)",
        "nivel_escolaridade": f"ALTER TABLE {table_ref} ADD COLUMN nivel_escolaridade VARCHAR(80)",
        "curso": f"ALTER TABLE {table_ref} ADD COLUMN curso VARCHAR(180)",
        "rg": f"ALTER TABLE {table_ref} ADD COLUMN rg VARCHAR(30)",
        "cpf": f"ALTER TABLE {table_ref} ADD COLUMN cpf VARCHAR(20)",
        "telefone_celular": f"ALTER TABLE {table_ref} ADD COLUMN telefone_celular VARCHAR(20)",
        "telefone_2": f"ALTER TABLE {table_ref} ADD COLUMN telefone_2 VARCHAR(20)",
        "email_funcional": f"ALTER TABLE {table_ref} ADD COLUMN email_funcional VARCHAR(180)",
        "is_active": f"ALTER TABLE {table_ref} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1",
        "created_at": f"ALTER TABLE {table_ref} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": f"ALTER TABLE {table_ref} ADD COLUMN updated_at TIMESTAMP",
    }

    with engine.begin() as connection:
        for column_name, statement in optional_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))
