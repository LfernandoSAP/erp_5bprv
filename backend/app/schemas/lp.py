from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class LpBlocoBase(BaseModel):
    numero_bloco: int
    bol_g_pm_concessao: str
    tipo_bloco: str = "fruicao"
    dias: int = 30
    inicio_gozo: str | None = None
    boletim_interno: str | None = None
    mes_conversao: str | None = None
    pecunia_bol_g: str | None = None

    @field_validator(
        "bol_g_pm_concessao",
        "inicio_gozo",
        "boletim_interno",
        "mes_conversao",
        "pecunia_bol_g",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return _clean_text(value)

    @field_validator("tipo_bloco")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in {"fruicao", "pecunia"}:
            raise ValueError("tipo_bloco inválido")
        return normalized


class LpBlocoCreate(LpBlocoBase):
    pass


class LpBlocoOut(LpBlocoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class LpRegistroBase(BaseModel):
    police_officer_id: int
    re_dc: str
    nome: str
    posto_graduacao: str | None = None
    unidade: str | None = None
    quadro: str | None = None
    blocos: list[LpBlocoCreate]

    @field_validator("re_dc", "nome", "posto_graduacao", "unidade", "quadro")
    @classmethod
    def strip_header_text(cls, value: str | None) -> str | None:
        return _clean_text(value)


class LpRegistroCreate(LpRegistroBase):
    pass


class LpRegistroUpdate(BaseModel):
    blocos: list[LpBlocoCreate]


class LpRegistroListItem(BaseModel):
    id: int
    re_dc: str
    nome: str
    quadro: str | None = None
    total_blocos: int
    ultimo_bol_g: str | None = None
    ultimo_inicio: str | None = None
    status: str


class LpRegistroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    police_officer_id: int
    re_dc: str
    nome: str
    posto_graduacao: str | None = None
    unidade: str | None = None
    quadro: str | None = None
    status: str
    total_blocos: int
    ultimo_bol_g: str | None = None
    ultimo_inicio: str | None = None
    blocos: list[LpBlocoOut]
    created_at: datetime
    updated_at: datetime | None = None
