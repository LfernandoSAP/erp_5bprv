from datetime import date, datetime

from pydantic import BaseModel, field_validator


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


class EapModuloBase(BaseModel):
    modulo: str
    tipo: str
    local: str
    periodo_ead_inicio: date | None = None
    periodo_ead_fim: date | None = None
    periodo_presencial_inicio: date | None = None
    periodo_presencial_fim: date | None = None
    outros: str | None = None

    @field_validator("modulo", "tipo", "local", "outros", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_text(value)


class EapModuloCreate(EapModuloBase):
    pass


class EapModuloUpdate(EapModuloBase):
    modulo: str | None = None
    tipo: str | None = None
    local: str | None = None


class EapParticipanteCreate(BaseModel):
    re_dc: str

    @field_validator("re_dc", mode="before")
    @classmethod
    def normalize_re(cls, value):
        return _clean_text(value)


class EapParticipanteOut(BaseModel):
    id: int
    police_officer_id: int
    re_dc: str
    policial_nome: str | None = None
    posto_graduacao: str | None = None
    unidade_policial: str | None = None
    created_at: datetime | None = None


class EapModuloOut(BaseModel):
    id: int
    modulo: str
    tipo: str
    local: str
    periodo_ead_inicio: date | None = None
    periodo_ead_fim: date | None = None
    periodo_presencial_inicio: date | None = None
    periodo_presencial_fim: date | None = None
    outros: str | None = None
    unit_id: int
    unit_label: str | None = None
    total_policiais: int
    created_at: datetime | None = None


class EapModuloDetalheOut(EapModuloOut):
    participantes: list[EapParticipanteOut]
