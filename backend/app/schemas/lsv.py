from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class LsvBlocoBase(BaseModel):
    numero_bloco: int
    doe_concessao: str
    data_inicio_fruicao: str | None = None
    doe_fruicao: str | None = None

    @field_validator("doe_concessao", "data_inicio_fruicao", "doe_fruicao")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return _clean_text(value)


class LsvBlocoCreate(LsvBlocoBase):
    pass


class LsvBlocoOut(LsvBlocoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class LsvRegistroBase(BaseModel):
    police_officer_id: int
    re_dc: str
    nome: str
    posto_graduacao: str | None = None
    unidade: str | None = None
    quadro: str | None = None
    blocos: list[LsvBlocoCreate]

    @field_validator("re_dc", "nome", "posto_graduacao", "unidade", "quadro")
    @classmethod
    def strip_header_text(cls, value: str | None) -> str | None:
        return _clean_text(value)


class LsvRegistroCreate(LsvRegistroBase):
    pass


class LsvRegistroUpdate(BaseModel):
    blocos: list[LsvBlocoCreate]


class LsvRegistroListItem(BaseModel):
    id: int
    re_dc: str
    nome: str
    quadro: str | None = None
    total_blocos: int
    ultimo_bol_g: str | None = None
    ultimo_inicio: str | None = None
    status: str


class LsvRegistroOut(BaseModel):
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
    blocos: list[LsvBlocoOut]
    created_at: datetime
    updated_at: datetime | None = None
