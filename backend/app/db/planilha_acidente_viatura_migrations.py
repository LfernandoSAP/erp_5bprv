from sqlalchemy import inspect, text


def ensure_planilha_acidente_viatura_schema_compatibility(engine) -> None:
    if engine.dialect.name == "sqlite":
        schema_prefix = "estatistica__"
        full_name = f"{schema_prefix}planilha_acidente_viatura"
    else:
        schema_prefix = "estatistica."
        full_name = f"{schema_prefix}planilha_acidente_viatura"

    with engine.begin() as conn:
        conn.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS {full_name} (
                    id INTEGER PRIMARY KEY,
                    police_officer_id INTEGER NOT NULL,
                    portaria_sindicancia VARCHAR(80) NOT NULL,
                    re_dc VARCHAR(30) NOT NULL,
                    policial_nome VARCHAR(160),
                    posto_graduacao VARCHAR(80),
                    re_enc VARCHAR(30),
                    data_hora_fato VARCHAR(30),
                    rodovia_sp VARCHAR(60),
                    km VARCHAR(30),
                    quantidade_policial_militar INTEGER NOT NULL DEFAULT 0,
                    quantidade_civil INTEGER NOT NULL DEFAULT 0,
                    observacao VARCHAR(255),
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """
            )
        )

        inspector = inspect(conn)
        columns = {column["name"] for column in inspector.get_columns("planilha_acidente_viatura", schema=None if engine.dialect.name == "sqlite" else "estatistica")}
        expected = {
            "police_officer_id": "INTEGER NOT NULL DEFAULT 0",
            "portaria_sindicancia": "VARCHAR(80)",
            "re_dc": "VARCHAR(30)",
            "policial_nome": "VARCHAR(160)",
            "posto_graduacao": "VARCHAR(80)",
            "re_enc": "VARCHAR(30)",
            "data_hora_fato": "VARCHAR(30)",
            "rodovia_sp": "VARCHAR(60)",
            "km": "VARCHAR(30)",
            "quantidade_policial_militar": "INTEGER NOT NULL DEFAULT 0",
            "quantidade_civil": "INTEGER NOT NULL DEFAULT 0",
            "observacao": "VARCHAR(255)",
            "created_by": "INTEGER",
            "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        }
        for name, ddl in expected.items():
            if name not in columns:
                conn.execute(text(f"ALTER TABLE {full_name} ADD COLUMN {name} {ddl}"))
