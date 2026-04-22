from sqlalchemy import text


def ensure_security_schema_compatibility(engine) -> None:
    dialect = engine.dialect.name

    with engine.begin() as conn:
        if dialect == "sqlite":
            user_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()
            }
            if "require_password_change" not in user_columns:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN require_password_change BOOLEAN NOT NULL DEFAULT 0"
                    )
                )
            if "last_login_at" not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
            if "last_login_ip" not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(64)"))
            return

        if dialect == "postgresql":
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN NOT NULL DEFAULT FALSE
                    """
                )
            )
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ
                    """
                )
            )
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(64)
                    """
                )
            )
