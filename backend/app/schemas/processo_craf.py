from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


STATUS_OPTIONS = {"PENDENTE", "SOLICITADO", "RECEBIDO", "NAO_SE_APLICA", "EMITIDO", "ARQUIVADO", "ENTREGUE", "DIGITALIZADO"}
TIPO_OPTIONS = {"NOVO", "EXTRAVIO"}


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class ProcessoCrafBase(BaseModel):
    unit_id: int
    police_officer_id: int | None = None
    tipo_craf: str
    re_dc: str
    posto_graduacao: str | None = None
    nome: str
    data_entrada: str | None = None
    parte: str | None = None
    pm_l80: str | None = None
    nbi: str | None = None
    bol_int_res: str | None = None
    xerox_doc: str | None = None
    sigma: str | None = None
    bo: str | None = None
    msg_cmb: str | None = None
    data_processo: str | None = None
    observacao: str | None = None
    is_active: bool = True

    @field_validator(
        "tipo_craf",
        "re_dc",
        "posto_graduacao",
        "nome",
        "data_entrada",
        "parte",
        "pm_l80",
        "nbi",
        "bol_int_res",
        "xerox_doc",
        "sigma",
        "bo",
        "msg_cmb",
        "data_processo",
        "observacao",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return _normalize_text(value)

    @field_validator("tipo_craf")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in TIPO_OPTIONS:
            raise ValueError("Tipo de CRAF inválido.")
        return normalized

    @field_validator("pm_l80", "nbi", "bol_int_res", "xerox_doc")
    @classmethod
    def validate_status_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized not in STATUS_OPTIONS:
            raise ValueError("Valor de status inválido.")
        return normalized

    @model_validator(mode="after")
    def validate_extravio_requirements(self):
        if self.tipo_craf == "EXTRAVIO":
            if not self.bo:
                raise ValueError("B.O. obrigatório para processos de Extravio.")
            if not self.sigma:
                raise ValueError("SIGMA obrigatório para processos de Extravio.")
        return self


class ProcessoCrafCreate(ProcessoCrafBase):
    pass


class ProcessoCrafUpdate(BaseModel):
    police_officer_id: int | None = None
    tipo_craf: str | None = None
    re_dc: str | None = None
    posto_graduacao: str | None = None
    nome: str | None = None
    data_entrada: str | None = None
    parte: str | None = None
    pm_l80: str | None = None
    nbi: str | None = None
    bol_int_res: str | None = None
    xerox_doc: str | None = None
    sigma: str | None = None
    bo: str | None = None
    msg_cmb: str | None = None
    data_processo: str | None = None
    observacao: str | None = None
    is_active: bool | None = None


class ProcessoCrafOut(ProcessoCrafBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
