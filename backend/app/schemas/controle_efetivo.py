from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


QUADRO_OPTIONS = {"QOPM", "QAOPM", "QPP"}
YES_NO_OPTIONS = {"SIM", "NAO"}
SITUACAO_OPTIONS = {
    "ADIDO",
    "AGREGADO",
    "EFETIVO",
    "EFETIVO_ADIDO",
    "EFETIVO_DISP_AG_INT",
    "EFETIVO_DISP_AG_INT_PF",
    "OUTROS",
}
ESCOLARIDADE_OPTIONS = {
    "FUNDAMENTAL_INCOMPLETO",
    "FUNDAMENTAL_COMPLETO",
    "MEDIO_INCOMPLETO",
    "MEDIO_COMPLETO",
    "SUPERIOR_INCOMPLETO",
    "SUPERIOR_COMPLETO",
    "POS_GRADUACAO_ESPECIALIZACAO",
    "MESTRADO",
    "DOUTORADO",
}


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class ControleEfetivoBase(BaseModel):
    unit_id: int | None = None
    police_officer_id: int | None = None
    re_dc: str
    quadro: str
    nome: str | None = None
    sexo: str | None = None
    unidade: str | None = None
    opm_atual: str | None = None
    sinesp: str | None = None
    processo_regular: str | None = None
    numero_processo: str | None = None
    situacao: str
    situacao_outros: str | None = None
    obs_situacao: str | None = None
    cep_tran_rv: str | None = None
    data_admissao: str | None = None
    data_25_anos: str | None = None
    averbacao_inss: str | None = None
    averbacao_militar: str | None = None
    inatividade: str | None = None
    cprv: str | None = None
    data_apresentacao: str | None = None
    data_nascimento: str | None = None
    nivel_escolaridade: str | None = None
    curso: str | None = None
    rg: str | None = None
    cpf: str | None = None
    telefone_celular: str | None = None
    telefone_2: str | None = None
    email_funcional: str | None = None
    is_active: bool = True

    @field_validator(
        "re_dc",
        "nome",
        "sexo",
        "unidade",
        "opm_atual",
        "numero_processo",
        "situacao_outros",
        "obs_situacao",
        "data_admissao",
        "data_25_anos",
        "averbacao_inss",
        "averbacao_militar",
        "inatividade",
        "data_apresentacao",
        "data_nascimento",
        "curso",
        "rg",
        "cpf",
        "telefone_celular",
        "telefone_2",
        "email_funcional",
    )
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return _clean_text(value)

    @field_validator("quadro")
    @classmethod
    def validate_quadro(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in QUADRO_OPTIONS:
            raise ValueError("Quadro inválido.")
        return normalized

    @field_validator("sinesp", "processo_regular", "cep_tran_rv", "cprv")
    @classmethod
    def validate_yes_no(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized not in YES_NO_OPTIONS:
            raise ValueError("Valor inválido.")
        return normalized

    @field_validator("situacao")
    @classmethod
    def validate_situacao(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in SITUACAO_OPTIONS:
            raise ValueError("Situação inválida.")
        return normalized

    @field_validator("nivel_escolaridade")
    @classmethod
    def validate_nivel_escolaridade(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized not in ESCOLARIDADE_OPTIONS:
            raise ValueError("Nível de escolaridade inválido.")
        return normalized

    @model_validator(mode="after")
    def validate_conditionals(self):
        if self.situacao == "OUTROS" and not self.situacao_outros:
            raise ValueError("Especificar Situação é obrigatório quando Situação = Outros.")
        if self.processo_regular == "SIM" and not self.numero_processo:
            raise ValueError("Nº do Processo é obrigatório quando Processo Regular = Sim.")
        return self


class ControleEfetivoCreate(ControleEfetivoBase):
    pass


class ControleEfetivoUpdate(BaseModel):
    unit_id: int | None = None
    police_officer_id: int | None = None
    re_dc: str | None = None
    quadro: str | None = None
    nome: str | None = None
    sexo: str | None = None
    unidade: str | None = None
    opm_atual: str | None = None
    sinesp: str | None = None
    processo_regular: str | None = None
    numero_processo: str | None = None
    situacao: str | None = None
    situacao_outros: str | None = None
    obs_situacao: str | None = None
    cep_tran_rv: str | None = None
    data_admissao: str | None = None
    data_25_anos: str | None = None
    averbacao_inss: str | None = None
    averbacao_militar: str | None = None
    inatividade: str | None = None
    cprv: str | None = None
    data_apresentacao: str | None = None
    data_nascimento: str | None = None
    nivel_escolaridade: str | None = None
    curso: str | None = None
    rg: str | None = None
    cpf: str | None = None
    telefone_celular: str | None = None
    telefone_2: str | None = None
    email_funcional: str | None = None
    is_active: bool | None = None


class ControleEfetivoOut(ControleEfetivoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
