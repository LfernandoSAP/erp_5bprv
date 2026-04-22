from sqlalchemy import inspect, text


def ensure_lsv_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "rh"
    table_names = inspector.get_table_names(schema=schema)

    registro_ref = "lsv_registros" if is_sqlite else "rh.lsv_registros"
    bloco_ref = "lsv_blocos" if is_sqlite else "rh.lsv_blocos"
    unit_ref = "units" if is_sqlite else "rh.units"
    officer_ref = "police_officers" if is_sqlite else "rh.police_officers"

    if "lsv_registros" not in table_names:
        create_registro_sql = f"""
        CREATE TABLE {registro_ref} (
            id INTEGER PRIMARY KEY,
            unit_id INTEGER NOT NULL,
            police_officer_id INTEGER NOT NULL,
            re_dc VARCHAR(30) NOT NULL,
            nome VARCHAR(200) NOT NULL,
            posto_graduacao VARCHAR(60),
            unidade VARCHAR(180),
            quadro VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(unit_id) REFERENCES {unit_ref} (id),
            FOREIGN KEY(police_officer_id) REFERENCES {officer_ref} (id)
        )
        """
        registro_indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_id ON {registro_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_unit_id ON {registro_ref} (unit_id)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_police_officer_id ON {registro_ref} (police_officer_id)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_re_dc ON {registro_ref} (re_dc)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_nome ON {registro_ref} (nome)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_registros_quadro ON {registro_ref} (quadro)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_registro_sql))
            for statement in registro_indexes:
                connection.execute(text(statement))

    if "lsv_blocos" not in table_names:
        create_bloco_sql = f"""
        CREATE TABLE {bloco_ref} (
            id INTEGER PRIMARY KEY,
            registro_id INTEGER NOT NULL,
            numero_bloco INTEGER NOT NULL DEFAULT 1,
            tipo_bloco VARCHAR(20) NOT NULL DEFAULT 'fruicao',
            bol_g_pm_concessao VARCHAR(60) NOT NULL,
            dias INTEGER NOT NULL DEFAULT 30,
            inicio_gozo VARCHAR(20),
            boletim_interno VARCHAR(120),
            mes_conversao VARCHAR(40),
            pecunia_bol_g VARCHAR(60),
            linha_1_dias INTEGER NOT NULL DEFAULT 30,
            linha_1_inicio VARCHAR(20),
            linha_1_bol_int VARCHAR(120),
            linha_1_mes_conversao VARCHAR(40),
            linha_1_pecunia_bol_g VARCHAR(60),
            linha_2_dias INTEGER NOT NULL DEFAULT 30,
            linha_2_inicio VARCHAR(20),
            linha_2_bol_int VARCHAR(120),
            linha_2_mes_conversao VARCHAR(40),
            linha_2_pecunia_bol_g VARCHAR(60),
            linha_3_dias INTEGER NOT NULL DEFAULT 30,
            linha_3_inicio VARCHAR(20),
            linha_3_bol_int VARCHAR(120),
            linha_3_mes_conversao VARCHAR(40),
            linha_3_pecunia_bol_g VARCHAR(60),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP,
            FOREIGN KEY(registro_id) REFERENCES {registro_ref} (id)
        )
        """
        bloco_indexes = [
            f"CREATE INDEX IF NOT EXISTS ix_lsv_blocos_id ON {bloco_ref} (id)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_blocos_registro_id ON {bloco_ref} (registro_id)",
            f"CREATE INDEX IF NOT EXISTS ix_lsv_blocos_numero_bloco ON {bloco_ref} (numero_bloco)",
        ]
        with engine.begin() as connection:
            connection.execute(text(create_bloco_sql))
            for statement in bloco_indexes:
                connection.execute(text(statement))
    else:
        columns = {column["name"] for column in inspector.get_columns("lsv_blocos", schema=schema)}
        statements = []
        if "tipo_bloco" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN tipo_bloco VARCHAR(20) DEFAULT 'fruicao'")
        if "dias" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN dias INTEGER DEFAULT 30")
        if "inicio_gozo" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN inicio_gozo VARCHAR(20)")
        if "boletim_interno" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN boletim_interno VARCHAR(120)")
        if "mes_conversao" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN mes_conversao VARCHAR(40)")
        if "pecunia_bol_g" not in columns:
            statements.append(f"ALTER TABLE {bloco_ref} ADD COLUMN pecunia_bol_g VARCHAR(60)")
        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))
