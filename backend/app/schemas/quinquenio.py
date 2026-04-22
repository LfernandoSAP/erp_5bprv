from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


TIPO_USO_OPTIONS = {"FRUICAO", "PECUNIA"}
FRACIONAMENTO_OPTIONS = {"15", "30"}


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _clean_optional_date(value):
    if value in (None, ""):
        return None
    return value


class QuinquenioInterrupcaoCreate(BaseModel):
    policial_id: int
    data_inicio: date
    data_fim: date
    motivo: str | None = None

    @field_validator("motivo", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_optional_text(value)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.data_fim < self.data_inicio:
            raise ValueError("A data final da interrupção deve ser maior ou igual à data inicial.")
        return self


class QuinquenioInterrupcaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policial_id: int
    data_inicio: date
    data_fim: date
    motivo: str | None = None
    dias_interrompidos: int
    created_at: datetime


class QuinquenioBlocoCreate(BaseModel):
    policial_id: int
    numero_bloco: int | None = None
    bol_geral_concessao: str | None = None
    data_concessao_real: date | None = None

    @field_validator("bol_geral_concessao", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_optional_text(value)

    @field_validator("data_concessao_real", mode="before")
    @classmethod
    def normalize_date(cls, value):
        return _clean_optional_date(value)


class QuinquenioBlocoUpdate(BaseModel):
    bol_geral_concessao: str | None = None
    data_concessao_real: date | None = None

    @field_validator("bol_geral_concessao", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_optional_text(value)

    @field_validator("data_concessao_real", mode="before")
    @classmethod
    def normalize_date(cls, value):
        return _clean_optional_date(value)


class QuinquenioPeriodoUpsert(BaseModel):
    numero_periodo: int = Field(ge=1, le=3)
    tipo_uso: Literal["FRUICAO", "PECUNIA"] | None = None
    fracionamento: Literal["15", "30"] | None = None
    data_inicio: date | None = None
    boletim: str | None = None
    observacao: str | None = None

    @field_validator("boletim", "observacao", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return _clean_optional_text(value)

    @model_validator(mode="after")
    def validate_payload(self):
        if self.tipo_uso == "FRUICAO":
            if self.fracionamento not in FRACIONAMENTO_OPTIONS:
                raise ValueError("Informe o fracionamento de 15 ou 30 dias para Fruição.")
            if self.data_inicio is None:
                raise ValueError("Informe a data de início para Fruição.")
            if not self.boletim:
                raise ValueError("Informe o boletim do período de Fruição.")

        if self.tipo_uso == "PECUNIA":
            if not self.boletim:
                raise ValueError("Informe o boletim do período em Pecúnia.")

        return self


class QuinquenioPeriodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    bloco_id: int | None = None
    numero_periodo: int
    tipo_uso: str | None = None
    fracionamento: str | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    boletim: str | None = None
    status: str
    observacao: str | None = None
    dias_utilizados: int


class QuinquenioPolicialResumo(BaseModel):
    policial_id: int
    re: str
    nome: str
    nome_guerra: str | None = None
    graduacao: str | None = None
    unidade: str | None = None
    data_admissao: date | None = None


class QuinquenioBlocoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    policial_id: int
    numero_bloco: int
    data_inicio_contagem: date
    data_prevista: date
    data_concessao_real: date | None = None
    bol_geral_concessao: str | None = None
    dias_totais_direito: int
    dias_utilizados: int
    dias_saldo: int
    percentual_uso: float
    status: str
    registrado: bool = True
    periodos: list[QuinquenioPeriodoResponse] = []
    interrupcoes_aplicadas: int = 0
    intervalo_fim_contagem: date | None = None


class QuinquenioTimelineItem(BaseModel):
    tipo: str
    data: date
    titulo: str
    status: str
    numero_bloco: int | None = None


class QuinquenioResumoPolicial(BaseModel):
    policial: QuinquenioPolicialResumo
    blocos_direito: int
    blocos_registrados: int
    blocos_pendentes: int
    proximo_bloco_previsto: date | None = None
    dias_interrupcao_total: int
    interrupcoes: list[QuinquenioInterrupcaoResponse]
    blocos: list[QuinquenioBlocoResponse]
