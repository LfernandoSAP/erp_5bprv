from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


VALID_POLICE_STATUS = {"ATIVO", "INATIVO"}
VALID_CALIBERS = {"RESTRITO", "PERMITIDO", "FUZIL"}
VALID_PROCESS_STATUS = {"EM_ANDAMENTO", "ENVIADO_AO_CMB", "FINALIZADO"}
VALID_PROCESS_RESULTS = {"CRAF_EMITIDO", "CRAF_ENTREGUE_AO_INTERESSADO"}


class ArmamentoProcessoBase(BaseModel):
    unit_id: int
    police_officer_id: int | None = None
    police_status: str
    re_dc: str | None = None
    rank: str | None = None
    full_name: str | None = None
    unit_name_snapshot: str | None = None
    entry_date: str
    caliber: str
    process_text: str | None = None
    internal_bulletin: str | None = None
    observations: str | None = None
    status: str
    cmb_sent_date: str | None = None
    result: str | None = None
    result_date: str | None = None
    is_active: bool = True

    @field_validator("police_status")
    @classmethod
    def validate_police_status(cls, value: str) -> str:
        normalized = (value or "").strip().upper()
        if normalized not in VALID_POLICE_STATUS:
            raise ValueError("Situação do policial inválida.")
        return normalized

    @field_validator("caliber")
    @classmethod
    def validate_caliber(cls, value: str) -> str:
        normalized = (value or "").strip().upper()
        if normalized not in VALID_CALIBERS:
            raise ValueError("Calibre inválido.")
        return normalized

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = (value or "").strip().upper()
        if normalized not in VALID_PROCESS_STATUS:
            raise ValueError("Status inválido.")
        return normalized

    @field_validator("result")
    @classmethod
    def validate_result(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if not normalized:
            return None
        if normalized not in VALID_PROCESS_RESULTS:
            raise ValueError("Resultado inválido.")
        return normalized

    @field_validator(
        "re_dc",
        "rank",
        "full_name",
        "unit_name_snapshot",
        "entry_date",
        "process_text",
        "internal_bulletin",
        "observations",
        "cmb_sent_date",
        "result_date",
    )
    @classmethod
    def strip_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_rules(self):
        if self.police_status == "ATIVO" and not self.police_officer_id:
            raise ValueError("Selecione um policial ativo para vincular o processo.")

        if self.police_status == "INATIVO":
            if not self.re_dc or not self.rank or not self.full_name or not self.unit_name_snapshot:
                raise ValueError("Preencha RE, posto/graduação, nome completo e unidade para policial inativo.")

        if self.status == "ENVIADO_AO_CMB" and not self.cmb_sent_date:
            raise ValueError("Informe a data de envio ao CMB.")

        if self.result and not self.result_date:
            raise ValueError("Informe a data do resultado.")

        return self


class ArmamentoProcessoCreate(ArmamentoProcessoBase):
    pass


class ArmamentoProcessoUpdate(BaseModel):
    police_officer_id: int | None = None
    police_status: str | None = None
    re_dc: str | None = None
    rank: str | None = None
    full_name: str | None = None
    unit_name_snapshot: str | None = None
    entry_date: str | None = None
    caliber: str | None = None
    process_text: str | None = None
    internal_bulletin: str | None = None
    observations: str | None = None
    status: str | None = None
    cmb_sent_date: str | None = None
    result: str | None = None
    result_date: str | None = None
    is_active: bool | None = None


class ArmamentoProcessoOut(ArmamentoProcessoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
    unit_label: str | None = None
    police_officer_name: str | None = None
    police_officer_re: str | None = None
