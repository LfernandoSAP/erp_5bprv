from pydantic import BaseModel


class LoginRequest(BaseModel):
    cpf: str
    password: str


class SessionUserResponse(BaseModel):
    id: int
    cpf: str
    name: str
    role_code: str | None = None
    module_access_codes: list[str] = []
    unit_id: int | None = None
    unit_label: str | None = None
    unit_type: str | None = None
    sector_id: int | None = None
    sector_code: str | None = None
    display_name: str | None = None
    is_admin: bool = False
    can_view_all: bool = False
    require_password_change: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    session: SessionUserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
