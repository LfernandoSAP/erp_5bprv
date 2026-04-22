import os

from dotenv import load_dotenv

load_dotenv()


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on", "sim"}


class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./erp5bprv.db")
    secret_key: str = os.getenv(
        "JWT_SECRET_KEY",
        os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET"),
    )
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv(
            "JWT_ACCESS_EXPIRE_MINUTES",
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24),
        )
    )
    refresh_token_expire_days: int = int(
        os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7")
    )
    environment: str = os.getenv("ENVIRONMENT", "development")
    cors_allowed_origins: str = os.getenv(
        "ALLOWED_ORIGINS",
        os.getenv("CORS_ALLOWED_ORIGINS", "*"),
    )
    auth_cookie_secure: bool = _parse_bool(
        os.getenv("AUTH_COOKIE_SECURE"),
        default=os.getenv("ENVIRONMENT", "development").lower() == "production",
    )
    auth_cookie_samesite: str = os.getenv("AUTH_COOKIE_SAMESITE", "lax")
    auth_cookie_domain: str | None = os.getenv("AUTH_COOKIE_DOMAIN") or None
    login_rate_limit_attempts: int = int(os.getenv("LOGIN_RATE_LIMIT_ATTEMPTS", "5"))
    login_rate_limit_window_minutes: int = int(
        os.getenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "10")
    )
    default_admin_cpf: str = os.getenv("DEFAULT_ADMIN_CPF", "00000000000")
    default_admin_password: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@5BPRv2026")


settings = Settings()
