from sqlalchemy import text


def ensure_police_movement_schema_compatibility(engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).fetchall()
        }

        if "police_officer_movements" in tables:
            return

        conn.execute(
            text(
                """
                CREATE TABLE police_officer_movements (
                    id INTEGER NOT NULL PRIMARY KEY,
                    police_officer_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    from_unit_id INTEGER,
                    to_unit_id INTEGER,
                    from_external_unit_name VARCHAR(180),
                    to_external_unit_name VARCHAR(180),
                    details VARCHAR(500),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                "CREATE INDEX ix_police_officer_movements_police_officer_id ON police_officer_movements (police_officer_id)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX ix_police_officer_movements_user_id ON police_officer_movements (user_id)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX ix_police_officer_movements_from_unit_id ON police_officer_movements (from_unit_id)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX ix_police_officer_movements_to_unit_id ON police_officer_movements (to_unit_id)"
            )
        )
