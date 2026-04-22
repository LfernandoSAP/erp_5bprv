from sqlalchemy import text


def ensure_material_belico_schema_compatibility(engine) -> None:
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    ALTER TABLE logistica.material_belico
                    ADD COLUMN IF NOT EXISTS item_model_other VARCHAR(150);
                    """
                )
            )
            conn.execute(
                text(
                    """
                    ALTER TABLE logistica.material_belico
                    ADD COLUMN IF NOT EXISTS item_holder VARCHAR(60);
                    """
                )
            )
            conn.execute(
                text(
                    """
                    ALTER TABLE logistica.material_belico
                    ADD COLUMN IF NOT EXISTS item_holder_other VARCHAR(150);
                    """
                )
            )
            conn.execute(
                text(
                    """
                    ALTER TABLE logistica.material_belico_movements
                    ADD COLUMN IF NOT EXISTS quantity_transferred INTEGER;
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE logistica.material_belico
                    SET item_model = '556'
                    WHERE item_model = '552';
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE logistica.material_belico
                    SET item_model = 'Cartucho Taser'
                    WHERE item_model = 'Taser-Operacional';
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE logistica.material_belico
                    SET is_active = FALSE
                    WHERE item_model = 'Taser-Treina';
                    """
                )
            )
        return

    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(material_belico)")).fetchall()
        }

        additions = {
            "police_officer_id": "INTEGER",
            "custody_sector_id": "INTEGER",
            "custody_type": "VARCHAR(30) DEFAULT 'RESERVA_UNIDADE'",
            "item_name": "VARCHAR(200)",
            "lot_number": "VARCHAR(100)",
            "expiration_date": "DATE",
            "quantity": "INTEGER",
            "item_brand": "VARCHAR(100)",
            "item_model": "VARCHAR(100)",
            "item_model_other": "VARCHAR(150)",
            "item_type": "VARCHAR(60)",
            "item_gender": "VARCHAR(30)",
            "item_size": "VARCHAR(40)",
            "item_holder": "VARCHAR(60)",
            "item_holder_other": "VARCHAR(150)",
            "cdc_material_type": "VARCHAR(60)",
            "cdc_exoskeleton_size": "VARCHAR(10)",
        }

        for column_name, column_type in additions.items():
            if column_name not in columns:
                conn.execute(
                    text(
                        f"ALTER TABLE material_belico ADD COLUMN {column_name} {column_type}"
                    )
                )
                conn.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_material_belico_{column_name} "
                        f"ON material_belico ({column_name})"
                    )
                )

        conn.execute(
            text(
                """
                UPDATE material_belico
                SET custody_type = CASE
                    WHEN police_officer_id IS NOT NULL THEN 'POLICIAL'
                    ELSE 'RESERVA_UNIDADE'
                END
                WHERE custody_type IS NULL OR TRIM(custody_type) = ''
                """
            )
        )

        movement_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(material_belico_movements)")).fetchall()
        }

        if "from_custody_type" not in movement_columns:
            conn.execute(
                text("ALTER TABLE material_belico_movements ADD COLUMN from_custody_type VARCHAR(30)")
            )

        if "to_custody_type" not in movement_columns:
            conn.execute(
                text("ALTER TABLE material_belico_movements ADD COLUMN to_custody_type VARCHAR(30)")
            )

        if "from_custody_sector_id" not in movement_columns:
            conn.execute(
                text("ALTER TABLE material_belico_movements ADD COLUMN from_custody_sector_id INTEGER")
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_material_belico_movements_from_custody_sector_id "
                    "ON material_belico_movements (from_custody_sector_id)"
                )
            )

        if "to_custody_sector_id" not in movement_columns:
            conn.execute(
                text("ALTER TABLE material_belico_movements ADD COLUMN to_custody_sector_id INTEGER")
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_material_belico_movements_to_custody_sector_id "
                    "ON material_belico_movements (to_custody_sector_id)"
                )
            )

        if "quantity_transferred" not in movement_columns:
            conn.execute(
                text("ALTER TABLE material_belico_movements ADD COLUMN quantity_transferred INTEGER")
            )

        conn.execute(
            text(
                """
                UPDATE material_belico_movements
                SET from_custody_type = CASE
                    WHEN from_police_officer_id IS NOT NULL THEN 'POLICIAL'
                    ELSE 'RESERVA_UNIDADE'
                END
                WHERE from_custody_type IS NULL OR TRIM(from_custody_type) = ''
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE material_belico_movements
                SET to_custody_type = CASE
                    WHEN to_police_officer_id IS NOT NULL THEN 'POLICIAL'
                    ELSE 'RESERVA_UNIDADE'
                END
                WHERE to_custody_type IS NULL OR TRIM(to_custody_type) = ''
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE material_belico
                SET item_model = '556'
                WHERE item_model = '552'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE material_belico
                SET item_model = 'Cartucho Taser'
                WHERE item_model = 'Taser-Operacional'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE material_belico
                SET is_active = 0
                WHERE item_model = 'Taser-Treina'
                """
            )
        )
