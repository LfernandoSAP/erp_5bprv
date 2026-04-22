from sqlalchemy import inspect, text


def ensure_quinquenio_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "rh"
    table_names = inspector.get_table_names(schema=schema)

    interrupcoes_ref = "quinquenio_bloco_interrupcoes" if is_sqlite else "rh.quinquenio_bloco_interrupcoes"
    blocos_ref = "quinquenio_blocos" if is_sqlite else "rh.quinquenio_blocos"
    periodos_ref = "quinquenio_periodos" if is_sqlite else "rh.quinquenio_periodos"

    with engine.begin() as connection:
        if "quinquenio_bloco_interrupcoes" not in table_names:
            sql = """
            CREATE TABLE rh.quinquenio_bloco_interrupcoes (
                id INTEGER PRIMARY KEY,
                policial_id INTEGER NOT NULL,
                data_inicio DATE NOT NULL,
                data_fim DATE NOT NULL,
                motivo VARCHAR(255),
                dias_interrompidos INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(policial_id) REFERENCES rh.police_officers (id)
            )
            """
            if is_sqlite:
                sql = sql.replace("rh.", "")
            connection.execute(text(sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_interrupcoes_id ON {interrupcoes_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_interrupcoes_policial_id ON {interrupcoes_ref} (policial_id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_interrupcoes_data_inicio ON {interrupcoes_ref} (data_inicio)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_interrupcoes_data_fim ON {interrupcoes_ref} (data_fim)",
            ]:
                connection.execute(text(statement))

        if "quinquenio_blocos" not in table_names:
            sql = """
            CREATE TABLE rh.quinquenio_blocos (
                id INTEGER PRIMARY KEY,
                policial_id INTEGER NOT NULL,
                numero_bloco INTEGER NOT NULL,
                data_inicio_contagem DATE NOT NULL,
                data_prevista DATE NOT NULL,
                data_concessao_real DATE,
                bol_geral_concessao VARCHAR(120),
                dias_totais_direito INTEGER NOT NULL DEFAULT 90,
                status VARCHAR(20) NOT NULL DEFAULT 'PREVISTO',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                CONSTRAINT uq_quinquenio_bloco_policial_numero UNIQUE (policial_id, numero_bloco),
                FOREIGN KEY(policial_id) REFERENCES rh.police_officers (id)
            )
            """
            if is_sqlite:
                sql = sql.replace("rh.", "")
            connection.execute(text(sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_blocos_id ON {blocos_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_blocos_policial_id ON {blocos_ref} (policial_id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_blocos_numero_bloco ON {blocos_ref} (numero_bloco)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_blocos_data_prevista ON {blocos_ref} (data_prevista)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_blocos_status ON {blocos_ref} (status)",
            ]:
                connection.execute(text(statement))

        if "quinquenio_periodos" not in table_names:
            sql = """
            CREATE TABLE rh.quinquenio_periodos (
                id INTEGER PRIMARY KEY,
                bloco_id INTEGER NOT NULL,
                numero_periodo INTEGER NOT NULL,
                tipo_uso VARCHAR(20),
                fracionamento VARCHAR(2),
                data_inicio DATE,
                data_fim DATE,
                boletim VARCHAR(120),
                status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
                observacao VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                CONSTRAINT uq_quinquenio_periodo_bloco_numero UNIQUE (bloco_id, numero_periodo),
                FOREIGN KEY(bloco_id) REFERENCES rh.quinquenio_blocos (id) ON DELETE CASCADE
            )
            """
            if is_sqlite:
                sql = sql.replace("rh.", "")
            connection.execute(text(sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_periodos_id ON {periodos_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_periodos_bloco_id ON {periodos_ref} (bloco_id)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_periodos_numero_periodo ON {periodos_ref} (numero_periodo)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_periodos_tipo_uso ON {periodos_ref} (tipo_uso)",
                f"CREATE INDEX IF NOT EXISTS ix_quinquenio_periodos_status ON {periodos_ref} (status)",
            ]:
                connection.execute(text(statement))
