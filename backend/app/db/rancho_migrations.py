from sqlalchemy import inspect, text


def ensure_rancho_schema_compatibility(engine) -> None:
    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_names = inspector.get_table_names(schema=schema)

    config_ref = "rancho_configuracoes" if is_sqlite else "logistica.rancho_configuracoes"
    participantes_ref = "rancho_participantes" if is_sqlite else "logistica.rancho_participantes"
    lancamentos_ref = "rancho_lancamentos" if is_sqlite else "logistica.rancho_lancamentos"

    with engine.begin() as connection:
        if "rancho_configuracoes" not in table_names:
            create_sql = """
            CREATE TABLE logistica.rancho_configuracoes (
                id INTEGER PRIMARY KEY,
                mes INTEGER NOT NULL,
                ano INTEGER NOT NULL,
                unit_id INTEGER NOT NULL,
                criado_por_id INTEGER NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                fechado BOOLEAN NOT NULL DEFAULT FALSE,
                CONSTRAINT uq_rancho_configuracao_unidade_mes_ano UNIQUE (mes, ano, unit_id),
                FOREIGN KEY(unit_id) REFERENCES rh.units (id),
                FOREIGN KEY(criado_por_id) REFERENCES users (id)
            )
            """
            if is_sqlite:
                create_sql = create_sql.replace("logistica.", "").replace("rh.", "")
            connection.execute(text(create_sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_rancho_configuracoes_id ON {config_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_configuracoes_mes ON {config_ref} (mes)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_configuracoes_ano ON {config_ref} (ano)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_configuracoes_unit_id ON {config_ref} (unit_id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_configuracoes_fechado ON {config_ref} (fechado)",
            ]:
                connection.execute(text(statement))

        if "rancho_participantes" not in table_names:
            create_sql = """
            CREATE TABLE logistica.rancho_participantes (
                id INTEGER PRIMARY KEY,
                configuracao_id INTEGER NOT NULL,
                tipo_pessoa VARCHAR(20) NOT NULL,
                re VARCHAR(30),
                rg VARCHAR(30),
                nome VARCHAR(200) NOT NULL,
                graduacao VARCHAR(80),
                ordem INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(configuracao_id) REFERENCES logistica.rancho_configuracoes (id) ON DELETE CASCADE
            )
            """
            if is_sqlite:
                create_sql = create_sql.replace("logistica.", "")
            connection.execute(text(create_sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_id ON {participantes_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_configuracao_id ON {participantes_ref} (configuracao_id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_tipo_pessoa ON {participantes_ref} (tipo_pessoa)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_re ON {participantes_ref} (re)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_rg ON {participantes_ref} (rg)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_participantes_ordem ON {participantes_ref} (ordem)",
            ]:
                connection.execute(text(statement))

        if "rancho_lancamentos" not in table_names:
            create_sql = """
            CREATE TABLE logistica.rancho_lancamentos (
                id INTEGER PRIMARY KEY,
                participante_id INTEGER NOT NULL,
                data DATE NOT NULL,
                cafe BOOLEAN NOT NULL DEFAULT FALSE,
                almoco BOOLEAN NOT NULL DEFAULT FALSE,
                CONSTRAINT uq_rancho_lancamento_participante_data UNIQUE (participante_id, data),
                FOREIGN KEY(participante_id) REFERENCES logistica.rancho_participantes (id) ON DELETE CASCADE
            )
            """
            if is_sqlite:
                create_sql = create_sql.replace("logistica.", "")
            connection.execute(text(create_sql))
            for statement in [
                f"CREATE INDEX IF NOT EXISTS ix_rancho_lancamentos_id ON {lancamentos_ref} (id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_lancamentos_participante_id ON {lancamentos_ref} (participante_id)",
                f"CREATE INDEX IF NOT EXISTS ix_rancho_lancamentos_data ON {lancamentos_ref} (data)",
            ]:
                connection.execute(text(statement))
