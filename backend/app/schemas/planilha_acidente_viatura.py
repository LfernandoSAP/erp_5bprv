from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


class PlanilhaAcidenteViaturaCreate(BaseModel):
    re_dc: str
    portaria_sindicancia: str
    re_enc: str | None = None
    data_hora_fato: str | None = None
    rodovia_sp: str | None = None
    km: str | None = None
    quantidade_policial_militar: int = Field(default=0, ge=0)
    quantidade_civil: int = Field(default=0, ge=0)
    observacao: str | None = None

    @field_validator("re_dc", "portaria_sindicancia", "re_enc", "data_hora_fato", "rodovia_sp", "km", "observacao", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_text(value)


class PlanilhaAcidenteViaturaUpdate(BaseModel):
    portaria_sindicancia: str | None = None
    re_enc: str | None = None
    data_hora_fato: str | None = None
    rodovia_sp: str | None = None
    km: str | None = None
    quantidade_policial_militar: int | None = Field(default=None, ge=0)
    quantidade_civil: int | None = Field(default=None, ge=0)
    observacao: str | None = None

    @field_validator("portaria_sindicancia", "re_enc", "data_hora_fato", "rodovia_sp", "km", "observacao", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_text(value)


class PlanilhaAcidenteViaturaOut(BaseModel):
    id: int
    police_officer_id: int
    re_dc: str
    policial_nome: str | None = None
    posto_graduacao: str | None = None
    portaria_sindicancia: str
    re_enc: str | None = None
    data_hora_fato: str | None = None
    rodovia_sp: str | None = None
    km: str | None = None
    quantidade_policial_militar: int
    quantidade_civil: int
    observacao: str | None = None
    created_at: datetime | None = None
