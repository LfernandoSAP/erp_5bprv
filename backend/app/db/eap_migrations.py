from sqlalchemy import inspect, text


def _table_name(engine, schema: str, name: str) -> str:
    if engine.dialect.name == "sqlite":
      return f"{schema}__{name}"
    return f"{schema}.{name}"


def ensure_eap_schema_compatibility(engine) -> None:
    modulos_name = _table_name(engine, "estatistica", "eap_modulos")
    participantes_name = _table_name(engine, "estatistica", "eap_modulo_participantes")

    with engine.begin() as conn:
        conn.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS {modulos_name} (
                    id INTEGER PRIMARY KEY,
                    modulo VARCHAR(20) NOT NULL,
                    tipo VARCHAR(40) NOT NULL DEFAULT 'Cb/Sd',
                    local VARCHAR(120) NOT NULL,
                    periodo_ead_inicio DATE,
                    periodo_ead_fim DATE,
                    periodo_presencial_inicio DATE,
                    periodo_presencial_fim DATE,
                    outros TEXT,
                    unit_id INTEGER NOT NULL DEFAULT 1,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS {participantes_name} (
                    id INTEGER PRIMARY KEY,
                    modulo_id INTEGER NOT NULL,
                    police_officer_id INTEGER NOT NULL,
                    re_dc VARCHAR(30) NOT NULL,
                    policial_nome VARCHAR(160),
                    posto_graduacao VARCHAR(80),
                    unidade_policial VARCHAR(160),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """
            )
        )

        inspector = inspect(conn)
        modulo_columns = {
            column["name"]
            for column in inspector.get_columns(
                "eap_modulos",
                schema=None if engine.dialect.name == "sqlite" else "estatistica",
            )
        }
        participante_columns = {
            column["name"]
            for column in inspector.get_columns(
                "eap_modulo_participantes",
                schema=None if engine.dialect.name == "sqlite" else "estatistica",
            )
        }

        modulo_expected = {
            "modulo": "VARCHAR(20)",
            "tipo": "VARCHAR(40) NOT NULL DEFAULT 'Cb/Sd'",
            "local": "VARCHAR(120)",
            "periodo_ead_inicio": "DATE",
            "periodo_ead_fim": "DATE",
            "periodo_presencial_inicio": "DATE",
            "periodo_presencial_fim": "DATE",
            "outros": "TEXT",
            "unit_id": "INTEGER NOT NULL DEFAULT 1",
            "created_by": "INTEGER",
            "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        }
        participante_expected = {
            "modulo_id": "INTEGER NOT NULL DEFAULT 0",
            "police_officer_id": "INTEGER NOT NULL DEFAULT 0",
            "re_dc": "VARCHAR(30)",
            "policial_nome": "VARCHAR(160)",
            "posto_graduacao": "VARCHAR(80)",
            "unidade_policial": "VARCHAR(160)",
            "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        }

        for name, ddl in modulo_expected.items():
            if name not in modulo_columns:
                conn.execute(text(f"ALTER TABLE {modulos_name} ADD COLUMN {name} {ddl}"))

        for name, ddl in participante_expected.items():
            if name not in participante_columns:
                conn.execute(text(f"ALTER TABLE {participantes_name} ADD COLUMN {name} {ddl}"))

    _migrate_legacy_eap_records(engine)


def _migrate_legacy_eap_records(engine) -> None:
    from app.db.database import SessionLocal
    from app.models.eap_modulo import EapModulo
    from app.models.eap_modulo_participante import EapModuloParticipante
    from app.models.eap_registro import EapRegistro
    from app.models.police_officer import PoliceOfficer
    from app.models.user import User

    with SessionLocal() as db:
        if db.query(EapModulo).first():
            return

        try:
            legacy_rows = db.query(EapRegistro).order_by(EapRegistro.id.asc()).all()
        except Exception:
            return

        if not legacy_rows:
            return

        module_map = {}
        for row in legacy_rows:
            creator = db.query(User).filter(User.id == row.created_by).first() if row.created_by else None
            officer = row.police_officer or db.query(PoliceOfficer).filter(PoliceOfficer.id == row.police_officer_id).first()
            unit_id = (
                getattr(creator, "unit_id", None)
                or getattr(officer, "unit_id", None)
                or 1
            )
            key = (
                row.modulo or "",
                "Cb/Sd",
                row.local or "",
                row.periodo_ead_inicio,
                row.periodo_ead_fim,
                row.periodo_presencial_inicio,
                row.periodo_presencial_fim,
                row.outros or "",
                unit_id,
            )
            if key not in module_map:
                modulo = EapModulo(
                    modulo=row.modulo,
                    tipo="Cb/Sd",
                    local=row.local,
                    periodo_ead_inicio=row.periodo_ead_inicio,
                    periodo_ead_fim=row.periodo_ead_fim,
                    periodo_presencial_inicio=row.periodo_presencial_inicio,
                    periodo_presencial_fim=row.periodo_presencial_fim,
                    outros=row.outros,
                    unit_id=unit_id,
                    created_by=row.created_by,
                )
                db.add(modulo)
                db.flush()
                module_map[key] = modulo

            modulo = module_map[key]
            already_exists = (
                db.query(EapModuloParticipante)
                .filter(
                    EapModuloParticipante.modulo_id == modulo.id,
                    EapModuloParticipante.police_officer_id == row.police_officer_id,
                )
                .first()
            )
            if already_exists:
                continue
            participante = EapModuloParticipante(
                modulo_id=modulo.id,
                police_officer_id=row.police_officer_id,
                re_dc=row.re_dc,
                policial_nome=row.policial_nome,
                posto_graduacao=row.posto_graduacao,
                unidade_policial=row.unidade_policial_manual or row.unidade_policial,
            )
            db.add(participante)

        db.commit()
