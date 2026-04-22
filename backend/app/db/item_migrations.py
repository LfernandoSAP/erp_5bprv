from sqlalchemy import inspect, text


def ensure_item_schema_compatibility(engine) -> None:
    is_sqlite = engine.dialect.name == "sqlite"
    schema = None if is_sqlite else "logistica"
    table_ref = "items" if is_sqlite else "logistica.items"
    movement_table_ref = "item_movements" if is_sqlite else "logistica.item_movements"
    inspector = inspect(engine)

    if "items" not in inspector.get_table_names(schema=schema):
        return

    with engine.begin() as conn:
        if is_sqlite:
            item_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(items)")).fetchall()
            }
        else:
            item_columns = {
                column["name"]
                for column in inspector.get_columns("items", schema=schema)
            }

        if "sector_id" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN sector_id INTEGER"))
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_items_sector_id ON {table_ref} (sector_id)"))

        if "police_officer_id" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN police_officer_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_items_police_officer_id ON {table_ref} (police_officer_id)"
                )
            )

        if "fleet_vehicle_id" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN fleet_vehicle_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_items_fleet_vehicle_id ON {table_ref} (fleet_vehicle_id)"
                )
            )

        if "custody_type" not in item_columns:
            conn.execute(
                text(
                    f"ALTER TABLE {table_ref} ADD COLUMN custody_type VARCHAR(30) DEFAULT 'RESERVA_UNIDADE'"
                )
            )

        if "custody_sector_id" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN custody_sector_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_items_custody_sector_id ON {table_ref} (custody_sector_id)"
                )
            )

        if "detentor" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN detentor VARCHAR(160)"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_items_detentor ON {table_ref} (detentor)"
                )
            )

        if "detentor_outros" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN detentor_outros VARCHAR(160)"))

        if "modelo" not in item_columns:
            conn.execute(text(f"ALTER TABLE {table_ref} ADD COLUMN modelo VARCHAR(200)"))

        conn.execute(
            text(
                f"""
                UPDATE {table_ref}
                SET
                    custody_type = CASE
                        WHEN police_officer_id IS NOT NULL THEN 'POLICIAL'
                        WHEN fleet_vehicle_id IS NOT NULL THEN 'VIATURA'
                        WHEN sector_id IS NOT NULL THEN 'SETOR'
                        ELSE 'RESERVA_UNIDADE'
                    END
                WHERE custody_type IS NULL OR TRIM(custody_type) = ''
                """
            )
        )
        conn.execute(
            text(
                f"""
                UPDATE {table_ref}
                SET custody_type = 'POLICIAL'
                WHERE police_officer_id IS NOT NULL
                  AND COALESCE(TRIM(custody_type), '') != 'POLICIAL'
                """
            )
        )
        conn.execute(
            text(
                f"""
                UPDATE {table_ref}
                SET custody_type = 'VIATURA'
                WHERE fleet_vehicle_id IS NOT NULL
                  AND police_officer_id IS NULL
                  AND COALESCE(TRIM(custody_type), '') != 'VIATURA'
                """
            )
        )
        conn.execute(
            text(
                f"""
                UPDATE {table_ref}
                SET custody_type = 'SETOR'
                WHERE custody_sector_id IS NOT NULL
                  AND police_officer_id IS NULL
                  AND fleet_vehicle_id IS NULL
                  AND COALESCE(TRIM(custody_type), '') != 'SETOR'
                """
            )
        )
        conn.execute(
            text(
                f"""
                UPDATE {table_ref}
                SET custody_sector_id = sector_id
                WHERE custody_sector_id IS NULL AND sector_id IS NOT NULL
                """
            )
        )

        if is_sqlite:
            movement_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(item_movements)")).fetchall()
            }
        else:
            movement_columns = {
                column["name"]
                for column in inspector.get_columns("item_movements", schema=schema)
            }

        if "from_police_officer_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN from_police_officer_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_from_police_officer_id ON {movement_table_ref} (from_police_officer_id)"
                )
            )

        if "to_police_officer_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN to_police_officer_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_to_police_officer_id ON {movement_table_ref} (to_police_officer_id)"
                )
            )

        if "from_fleet_vehicle_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN from_fleet_vehicle_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_from_fleet_vehicle_id ON {movement_table_ref} (from_fleet_vehicle_id)"
                )
            )

        if "to_fleet_vehicle_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN to_fleet_vehicle_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_to_fleet_vehicle_id ON {movement_table_ref} (to_fleet_vehicle_id)"
                )
            )

        if "from_custody_type" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN from_custody_type VARCHAR(30)"))

        if "to_custody_type" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN to_custody_type VARCHAR(30)"))

        if "from_custody_sector_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN from_custody_sector_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_from_custody_sector_id ON {movement_table_ref} (from_custody_sector_id)"
                )
            )

        if "to_custody_sector_id" not in movement_columns:
            conn.execute(text(f"ALTER TABLE {movement_table_ref} ADD COLUMN to_custody_sector_id INTEGER"))
            conn.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_item_movements_to_custody_sector_id ON {movement_table_ref} (to_custody_sector_id)"
                )
            )

        conn.execute(
            text(
                """
                UPDATE item_movements
                SET
                    from_custody_type = CASE
                        WHEN from_police_officer_id IS NOT NULL THEN 'POLICIAL'
                        WHEN from_fleet_vehicle_id IS NOT NULL THEN 'VIATURA'
                        WHEN from_sector_id IS NOT NULL THEN 'SETOR'
                        ELSE 'RESERVA_UNIDADE'
                    END
                WHERE from_custody_type IS NULL OR TRIM(from_custody_type) = ''
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET from_custody_type = 'POLICIAL'
                WHERE from_police_officer_id IS NOT NULL
                  AND COALESCE(TRIM(from_custody_type), '') != 'POLICIAL'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET from_custody_type = 'VIATURA'
                WHERE from_fleet_vehicle_id IS NOT NULL
                  AND from_police_officer_id IS NULL
                  AND COALESCE(TRIM(from_custody_type), '') != 'VIATURA'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET from_custody_type = 'SETOR'
                WHERE from_custody_sector_id IS NOT NULL
                  AND from_police_officer_id IS NULL
                  AND from_fleet_vehicle_id IS NULL
                  AND COALESCE(TRIM(from_custody_type), '') != 'SETOR'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET
                    to_custody_type = CASE
                        WHEN to_police_officer_id IS NOT NULL THEN 'POLICIAL'
                        WHEN to_fleet_vehicle_id IS NOT NULL THEN 'VIATURA'
                        WHEN to_sector_id IS NOT NULL THEN 'SETOR'
                        ELSE 'RESERVA_UNIDADE'
                    END
                WHERE to_custody_type IS NULL OR TRIM(to_custody_type) = ''
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET to_custody_type = 'POLICIAL'
                WHERE to_police_officer_id IS NOT NULL
                  AND COALESCE(TRIM(to_custody_type), '') != 'POLICIAL'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET to_custody_type = 'VIATURA'
                WHERE to_fleet_vehicle_id IS NOT NULL
                  AND to_police_officer_id IS NULL
                  AND COALESCE(TRIM(to_custody_type), '') != 'VIATURA'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET to_custody_type = 'SETOR'
                WHERE to_custody_sector_id IS NOT NULL
                  AND to_police_officer_id IS NULL
                  AND to_fleet_vehicle_id IS NULL
                  AND COALESCE(TRIM(to_custody_type), '') != 'SETOR'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET from_custody_sector_id = from_sector_id
                WHERE from_custody_sector_id IS NULL AND from_sector_id IS NOT NULL
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE item_movements
                SET to_custody_sector_id = to_sector_id
                WHERE to_custody_sector_id IS NULL AND to_sector_id IS NOT NULL
                """
            )
        )
