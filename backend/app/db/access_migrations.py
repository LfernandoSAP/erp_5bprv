from sqlalchemy import text


def ensure_access_schema_compatibility(engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        user_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()
        }

        if "sector_id" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN sector_id INTEGER"))
        if "role_code" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN role_code VARCHAR(40)"))

        tables = {
            row[0]
            for row in conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).fetchall()
        }

        if "sectors" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE sectors (
                        id INTEGER NOT NULL PRIMARY KEY,
                        unit_id INTEGER NOT NULL,
                        name VARCHAR(120) NOT NULL,
                        code VARCHAR(50),
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at DATETIME
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX ix_sectors_id ON sectors (id)"))
            conn.execute(text("CREATE INDEX ix_sectors_unit_id ON sectors (unit_id)"))
            conn.execute(text("CREATE INDEX ix_sectors_name ON sectors (name)"))
            conn.execute(text("CREATE INDEX ix_sectors_code ON sectors (code)"))

        if "user_module_access" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE user_module_access (
                        id INTEGER NOT NULL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        module_code VARCHAR(50) NOT NULL,
                        access_level VARCHAR(20) NOT NULL DEFAULT 'EDIT',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES users (id),
                        CONSTRAINT uq_user_module_access_user_module UNIQUE (user_id, module_code)
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX ix_user_module_access_id ON user_module_access (id)"))
            conn.execute(text("CREATE INDEX ix_user_module_access_user_id ON user_module_access (user_id)"))
            conn.execute(text("CREATE INDEX ix_user_module_access_module_code ON user_module_access (module_code)"))

        conn.execute(
            text(
                """
                UPDATE users
                SET role_code = CASE
                    WHEN is_admin = 1 AND unit_id = 1 THEN 'ADMIN_GLOBAL'
                    WHEN is_admin = 1 THEN 'ADMIN_UNIDADE'
                    ELSE 'OPERADOR'
                END
                WHERE role_code IS NULL OR TRIM(role_code) = ''
                """
            )
        )

        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO user_module_access (user_id, module_code, access_level)
                SELECT users.id, sectors.code, 'EDIT'
                FROM users
                JOIN sectors ON sectors.id = users.sector_id
                WHERE users.sector_id IS NOT NULL
                  AND sectors.code IS NOT NULL
                  AND TRIM(sectors.code) <> ''
                """
            )
        )
