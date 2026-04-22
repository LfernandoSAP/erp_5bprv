from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


STATUS_OPTIONS = {"PENDENTE", "SOLICITADO", "RECEBIDO", "NAO_SE_APLICA", "SOLICITADA", "RECEBIDA", "ENTREGUE", "DIGITALIZADO"}


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class ProcessoApafBase(BaseModel):
    unit_id: int
    police_officer_id: int | None = None
    re_dc: str
    posto_graduacao: str | None = None
    nome: str
    cia_entregou: str | None = None
    data_entrada: str | None = None
    parte: str | None = None
    sigma: str | None = None
    data_cadastro: str | None = None
    solic_consulta_pi: str | None = None
    sei: str | None = None
    envio_cprv_link: str | None = None
    cert_1: str | None = None
    cert_2: str | None = None
    cert_3: str | None = None
    rg: str | None = None
    cpf: str | None = None
    comp_residencia: str | None = None
    boletim_geral: str | None = None
    apafi: str | None = None
    data_entrega: str | None = None
    observacao: str | None = None
    is_active: bool = True

    @field_validator(
        "re_dc",
        "posto_graduacao",
        "nome",
        "cia_entregou",
        "data_entrada",
        "parte",
        "sigma",
        "data_cadastro",
        "solic_consulta_pi",
        "sei",
        "envio_cprv_link",
        "cert_1",
        "cert_2",
        "cert_3",
        "rg",
        "cpf",
        "comp_residencia",
        "boletim_geral",
        "apafi",
        "data_entrega",
        "observacao",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return _normalize_text(value)

    @field_validator("solic_consulta_pi", "cert_1", "cert_2", "cert_3", "comp_residencia")
    @classmethod
    def validate_status_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized not in STATUS_OPTIONS:
            raise ValueError("Valor de status inválido.")
        return normalized


class ProcessoApafCreate(ProcessoApafBase):
    pass


class ProcessoApafUpdate(BaseModel):
    police_officer_id: int | None = None
    re_dc: str | None = None
    posto_graduacao: str | None = None
    nome: str | None = None
    cia_entregou: str | None = None
    data_entrada: str | None = None
    parte: str | None = None
    sigma: str | None = None
    data_cadastro: str | None = None
    solic_consulta_pi: str | None = None
    sei: str | None = None
    envio_cprv_link: str | None = None
    cert_1: str | None = None
    cert_2: str | None = None
    cert_3: str | None = None
    rg: str | None = None
    cpf: str | None = None
    comp_residencia: str | None = None
    boletim_geral: str | None = None
    apafi: str | None = None
    data_entrega: str | None = None
    observacao: str | None = None
    is_active: bool | None = None


class ProcessoApafOut(ProcessoApafBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
