from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RanchoConfiguracaoCreate(BaseModel):
    mes: int = Field(ge=1, le=12)
    ano: int = Field(ge=2020, le=2100)
    unidade_id: int | None = None


class RanchoConfiguracaoListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mes: int
    ano: int
    unit_id: int
    unit_label: str | None = None
    criado_por_id: int
    criado_por_nome: str | None = None
    criado_em: datetime
    fechado: bool
    total_participantes: int


class RanchoLancamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    participante_id: int
    data: date
    cafe: bool
    almoco: bool


class RanchoParticipanteCreate(BaseModel):
    tipo_pessoa: Literal["PM", "CIVIL", "VISITANTE"]
    re: str | None = None
    rg: str | None = None
    nome: str | None = None
    graduacao: str | None = None
    ordem: int | None = None

    @field_validator("re", "rg", "nome", "graduacao", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_payload(self):
        if self.tipo_pessoa == "PM":
            if not self.re:
                raise ValueError("Informe o RE para participante do tipo PM.")
        elif self.tipo_pessoa == "CIVIL":
            if not self.rg:
                raise ValueError("Informe o RG para participante do tipo Civil.")
            if not self.nome:
                raise ValueError("Informe o nome para participante do tipo Civil.")
        elif self.tipo_pessoa == "VISITANTE":
            if not self.nome:
                raise ValueError("Informe o nome para participante do tipo Visitante.")
        return self


class RanchoParticipanteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    configuracao_id: int
    tipo_pessoa: str
    re: str | None = None
    rg: str | None = None
    nome: str
    graduacao: str | None = None
    ordem: int
    display_name: str
    lancamentos: list[RanchoLancamentoResponse] = []


class RanchoLancamentoUpsert(BaseModel):
    participante_id: int
    data: date
    cafe: bool = False
    almoco: bool = False


class RanchoResumoDia(BaseModel):
    data: date
    total_cafe: int
    total_almoco: int
    total_geral: int


class RanchoBuscarPmOut(BaseModel):
    policial_id: int
    re: str
    nome: str
    nome_completo: str | None = None
    graduacao: str | None = None
    unidade: str | None = None


class RanchoConfiguracaoDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mes: int
    ano: int
    unit_id: int
    unit_label: str | None = None
    criado_por_id: int
    criado_por_nome: str | None = None
    criado_em: datetime
    fechado: bool
    participantes: list[RanchoParticipanteResponse]
    totais_pm: list[RanchoResumoDia]
    totais_civil: list[RanchoResumoDia]
    totais_visitante: list[RanchoResumoDia]
    totais_geral: list[RanchoResumoDia]
