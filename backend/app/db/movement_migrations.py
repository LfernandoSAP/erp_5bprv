from sqlalchemy import text


def ensure_movement_schema_compatibility(engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(item_movements)")).fetchall()
        }

        additions = {
            "from_unit_id": "INTEGER",
            "from_sector_id": "INTEGER",
            "to_unit_id": "INTEGER",
            "to_sector_id": "INTEGER",
        }

        for column_name, column_type in additions.items():
            if column_name not in columns:
                conn.execute(
                    text(f"ALTER TABLE item_movements ADD COLUMN {column_name} {column_type}")
                )
                conn.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_item_movements_{column_name} "
                        f"ON item_movements ({column_name})"
                    )
                )
