from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.shared.utils.cpf import is_valid_cpf_length, normalize_cpf


class PoliceOfficerChild(BaseModel):
    nome: str | None = None
    data_nascimento: date | None = Field(default=None, alias="dataNascimento")

    model_config = ConfigDict(populate_by_name=True)


class PoliceOfficerBase(BaseModel):
    full_name: str
    war_name: str
    rank: str | None = None
    re_with_digit: str
    presentation_date: date | None = None
    admission_date: date | None = None
    previous_opm: str | None = None
    unit_id: int
    cpf: str
    rg: str | None = None
    rg_state: str | None = None
    birth_date: date | None = None
    naturality: str | None = None
    naturality_state: str | None = None
    nationality: str | None = None
    marital_status: str | None = None
    sexual_orientation: str | None = None
    is_driver: bool = False
    driver_category: str | None = None
    driver_registration_number: str | None = None
    driver_issue_date: date | None = None
    driver_expiration_date: date | None = None
    has_sat_pm: bool = False
    sat_pm_category: str | None = None
    pmesp_courses: str | None = None
    education_level: str | None = None
    higher_education_course: str | None = None
    blood_type: str | None = None
    civil_profession: str | None = None
    spoken_languages: str | None = None
    mother_name: str | None = None
    father_name: str | None = None
    marriage_date: date | None = None
    spouse_name: str | None = None
    spouse_birth_date: date | None = None
    spouse_rg: str | None = None
    spouse_rg_state: str | None = None
    spouse_cpf: str | None = None
    child_1_name: str | None = None
    child_1_birth_date: date | None = None
    child_2_name: str | None = None
    child_2_birth_date: date | None = None
    child_3_name: str | None = None
    child_3_birth_date: date | None = None
    children: list[PoliceOfficerChild] = []
    external_unit_name: str | None = None
    cep: str | None = None
    street: str | None = None
    street_number: str | None = None
    address_details: str | None = None
    neighborhood: str | None = None
    state: str | None = None
    city: str | None = None
    reference_point: str | None = None
    nearest_unit_cpa: str | None = None
    nearest_unit_btl: str | None = None
    nearest_unit_cia: str | None = None
    nearest_unit_phone: str | None = None
    cell_phone: str | None = None
    residential_phone: str | None = None
    spouse_phone: str | None = None
    message_phone: str | None = None
    functional_email: str | None = None
    personal_email: str | None = None
    associate_cb_sd: bool = False
    associate_afam: bool = False
    associate_coopmil: bool = False
    associate_adepom: bool = False
    associate_apmdfesp: bool = False
    associate_other: str | None = None
    has_private_insurance: bool = False
    private_insurance_details: str | None = None
    private_insurance_phone: str | None = None
    observation: str | None = None
    acknowledgement_date: date | None = None
    acknowledgement_signature: str | None = None
    address: str | None = None
    is_active: bool = True

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str) -> str:
        normalized = normalize_cpf(value)
        if not is_valid_cpf_length(normalized):
            raise ValueError("CPF deve conter exatamente 11 dígitos.")
        return normalized

    @field_validator("spouse_cpf")
    @classmethod
    def validate_spouse_cpf(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        normalized = normalize_cpf(value)
        if not is_valid_cpf_length(normalized):
            raise ValueError("CPF do cônjuge deve conter exatamente 11 dígitos.")
        return normalized


class PoliceOfficerCreate(PoliceOfficerBase):
    pass


class PoliceOfficerUpdate(BaseModel):
    full_name: str | None = None
    war_name: str | None = None
    rank: str | None = None
    re_with_digit: str | None = None
    presentation_date: date | None = None
    admission_date: date | None = None
    previous_opm: str | None = None
    unit_id: int | None = None
    cpf: str | None = None
    rg: str | None = None
    rg_state: str | None = None
    birth_date: date | None = None
    naturality: str | None = None
    naturality_state: str | None = None
    nationality: str | None = None
    marital_status: str | None = None
    sexual_orientation: str | None = None
    is_driver: bool | None = None
    driver_category: str | None = None
    driver_registration_number: str | None = None
    driver_issue_date: date | None = None
    driver_expiration_date: date | None = None
    has_sat_pm: bool | None = None
    sat_pm_category: str | None = None
    pmesp_courses: str | None = None
    education_level: str | None = None
    higher_education_course: str | None = None
    blood_type: str | None = None
    civil_profession: str | None = None
    spoken_languages: str | None = None
    mother_name: str | None = None
    father_name: str | None = None
    marriage_date: date | None = None
    spouse_name: str | None = None
    spouse_birth_date: date | None = None
    spouse_rg: str | None = None
    spouse_rg_state: str | None = None
    spouse_cpf: str | None = None
    child_1_name: str | None = None
    child_1_birth_date: date | None = None
    child_2_name: str | None = None
    child_2_birth_date: date | None = None
    child_3_name: str | None = None
    child_3_birth_date: date | None = None
    children: list[PoliceOfficerChild] | None = None
    external_unit_name: str | None = None
    cep: str | None = None
    street: str | None = None
    street_number: str | None = None
    address_details: str | None = None
    neighborhood: str | None = None
    state: str | None = None
    city: str | None = None
    reference_point: str | None = None
    nearest_unit_cpa: str | None = None
    nearest_unit_btl: str | None = None
    nearest_unit_cia: str | None = None
    nearest_unit_phone: str | None = None
    cell_phone: str | None = None
    residential_phone: str | None = None
    spouse_phone: str | None = None
    message_phone: str | None = None
    functional_email: str | None = None
    personal_email: str | None = None
    associate_cb_sd: bool | None = None
    associate_afam: bool | None = None
    associate_coopmil: bool | None = None
    associate_adepom: bool | None = None
    associate_apmdfesp: bool | None = None
    associate_other: str | None = None
    has_private_insurance: bool | None = None
    private_insurance_details: str | None = None
    private_insurance_phone: str | None = None
    observation: str | None = None
    acknowledgement_date: date | None = None
    acknowledgement_signature: str | None = None
    address: str | None = None
    is_active: bool | None = None

    @field_validator("cpf")
    @classmethod
    def validate_optional_cpf(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = normalize_cpf(value)
        if not is_valid_cpf_length(normalized):
            raise ValueError("CPF deve conter exatamente 11 dígitos.")
        return normalized

    @field_validator("spouse_cpf")
    @classmethod
    def validate_optional_spouse_cpf(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        normalized = normalize_cpf(value)
        if not is_valid_cpf_length(normalized):
            raise ValueError("CPF do cônjuge deve conter exatamente 11 dígitos.")
        return normalized


class PoliceOfficerMovementCreate(BaseModel):
    unit_id: int | None = None
    external_unit_name: str | None = None
    details: str | None = None


class PoliceOfficerOut(PoliceOfficerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_label: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class PoliceOfficerMovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    police_officer_id: int
    user_id: int
    from_unit_id: int | None = None
    to_unit_id: int | None = None
    from_external_unit_name: str | None = None
    to_external_unit_name: str | None = None
    details: str | None = None
    created_at: datetime
    officer_name: str | None = None
    user_name: str | None = None
    from_unit_label: str | None = None
    to_unit_label: str | None = None


class PoliceOfficerLinkedAssetOut(BaseModel):
    id: int
    module: str
    name: str
    category: str | None = None
    unit_label: str | None = None
    status: str | None = None
    location: str | None = None
    serial_number: str | None = None
    asset_tag: str | None = None
    details: str | None = None


class PoliceOfficerLinkedAssetsResponse(BaseModel):
    police_officer_id: int
    officer_name: str | None = None
    items: list[PoliceOfficerLinkedAssetOut]
    material_belico: list[PoliceOfficerLinkedAssetOut]
    total_count: int
