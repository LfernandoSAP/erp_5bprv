from sqlalchemy import text


def ensure_unit_schema_compatibility(engine) -> None:
    dialect = engine.dialect.name

    with engine.begin() as conn:
        if dialect == "sqlite":
            columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(units)")).fetchall()
            }

            if "parent_unit_id" not in columns:
                conn.execute(text("ALTER TABLE units ADD COLUMN parent_unit_id INTEGER"))
            if "code" not in columns:
                conn.execute(text("ALTER TABLE units ADD COLUMN code VARCHAR(50)"))
            if "codigo_opm" not in columns:
                conn.execute(text("ALTER TABLE units ADD COLUMN codigo_opm VARCHAR(50)"))
            if "type" not in columns:
                conn.execute(text("ALTER TABLE units ADD COLUMN type VARCHAR(30)"))
            if "can_view_all" not in columns:
                conn.execute(
                    text("ALTER TABLE units ADD COLUMN can_view_all BOOLEAN NOT NULL DEFAULT 0")
                )
            if "is_active" not in columns:
                conn.execute(
                    text("ALTER TABLE units ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
                )

            conn.execute(
                text(
                    """
                    UPDATE units
                    SET parent_unit_id = parent_id
                    WHERE parent_unit_id IS NULL
                      AND parent_id IS NOT NULL
                    """
                )
            )

            conn.execute(
                text(
                    """
                    UPDATE units
                    SET code = CASE
                        WHEN TRIM(name) = '5BPRv - EM' THEN '5BPRV_EM'
                        WHEN TRIM(name) = '1Cia' THEN '1CIA'
                        WHEN TRIM(name) = '2Cia' THEN '2CIA'
                        WHEN TRIM(name) = '3Cia' THEN '3CIA'
                        WHEN TRIM(name) = '4Cia' THEN '4CIA'
                        ELSE UPPER(REPLACE(REPLACE(REPLACE(TRIM(name), ' - ', '_'), ' ', '_'), '/', '_'))
                    END
                    WHERE code IS NULL OR TRIM(code) = ''
                    """
                )
            )

            conn.execute(
                text(
                    """
                    UPDATE units
                    SET type = CASE
                        WHEN TRIM(name) = '5BPRv - EM' THEN 'BATALHAO'
                        WHEN TRIM(name) IN ('1Cia', '2Cia', '3Cia', '4Cia') THEN 'CIA'
                        ELSE 'UNIT'
                    END
                    WHERE type IS NULL OR TRIM(type) = ''
                    """
                )
            )

            conn.execute(
                text(
                    """
                    UPDATE units
                    SET can_view_all = CASE
                        WHEN TRIM(name) = '5BPRv - EM' THEN 1
                        ELSE can_view_all
                    END
                    """
                )
            )

            conn.execute(
                text(
                    """
                    UPDATE units
                    SET is_active = 1
                    WHERE is_active IS NULL
                    """
                )
            )
            return

        if dialect == "postgresql":
            conn.execute(
                text(
                    """
                    ALTER TABLE rh.units
                    ADD COLUMN IF NOT EXISTS codigo_opm VARCHAR(50)
                    """
                )
            )
