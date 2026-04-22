import json

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class PoliceOfficer(Base):
    __tablename__ = "police_officers"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(200), nullable=False, index=True)
    war_name = Column(String(120), nullable=False, index=True)
    rank = Column(String(50), nullable=True)
    re_with_digit = Column(String(30), nullable=False, unique=True, index=True)
    presentation_date = Column(Date, nullable=True)
    admission_date = Column(Date, nullable=True)
    previous_opm = Column(String(180), nullable=True)
    naturality_state = Column(String(10), nullable=True)
    is_driver = Column(Boolean, default=False, nullable=False)
    driver_category = Column(String(30), nullable=True)
    driver_registration_number = Column(String(40), nullable=True)
    driver_issue_date = Column(Date, nullable=True)
    driver_expiration_date = Column(Date, nullable=True)
    has_sat_pm = Column(Boolean, default=False, nullable=False)
    sat_pm_category = Column(String(80), nullable=True)
    pmesp_courses = Column(Text, nullable=True)
    education_level = Column(String(120), nullable=True)
    higher_education_course = Column(String(180), nullable=True)
    blood_type = Column(String(10), nullable=True)

    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    unit = relationship("Unit")

    cpf = Column(String(20), nullable=False, unique=True, index=True)
    rg = Column(String(30), nullable=True)
    rg_state = Column(String(10), nullable=True)
    birth_date = Column(Date, nullable=True)
    naturality = Column(String(120), nullable=True)
    nationality = Column(String(120), nullable=True)
    marital_status = Column(String(60), nullable=True)
    sexual_orientation = Column(String(60), nullable=True)
    civil_profession = Column(String(120), nullable=True)
    spoken_languages = Column(Text, nullable=True)
    mother_name = Column(String(200), nullable=True)
    father_name = Column(String(200), nullable=True)
    marriage_date = Column(Date, nullable=True)
    spouse_name = Column(String(200), nullable=True)
    spouse_birth_date = Column(Date, nullable=True)
    spouse_rg = Column(String(30), nullable=True)
    spouse_rg_state = Column(String(10), nullable=True)
    spouse_cpf = Column(String(20), nullable=True)
    child_1_name = Column(String(200), nullable=True)
    child_1_birth_date = Column(Date, nullable=True)
    child_2_name = Column(String(200), nullable=True)
    child_2_birth_date = Column(Date, nullable=True)
    child_3_name = Column(String(200), nullable=True)
    child_3_birth_date = Column(Date, nullable=True)
    children_json = Column(Text, nullable=True)
    external_unit_name = Column(String(180), nullable=True)
    cep = Column(String(10), nullable=True)
    street = Column(String(180), nullable=True)
    street_number = Column(String(20), nullable=True)
    address_details = Column(String(120), nullable=True)
    neighborhood = Column(String(120), nullable=True)
    state = Column(String(80), nullable=True)
    city = Column(String(120), nullable=True)
    reference_point = Column(String(180), nullable=True)
    nearest_unit_cpa = Column(String(120), nullable=True)
    nearest_unit_btl = Column(String(120), nullable=True)
    nearest_unit_cia = Column(String(120), nullable=True)
    nearest_unit_phone = Column(String(20), nullable=True)
    cell_phone = Column(String(20), nullable=True)
    residential_phone = Column(String(20), nullable=True)
    spouse_phone = Column(String(20), nullable=True)
    message_phone = Column(String(20), nullable=True)
    functional_email = Column(String(180), nullable=True)
    personal_email = Column(String(180), nullable=True)
    associate_cb_sd = Column(Boolean, default=False, nullable=False)
    associate_afam = Column(Boolean, default=False, nullable=False)
    associate_coopmil = Column(Boolean, default=False, nullable=False)
    associate_adepom = Column(Boolean, default=False, nullable=False)
    associate_apmdfesp = Column(Boolean, default=False, nullable=False)
    associate_other = Column(String(180), nullable=True)
    has_private_insurance = Column(Boolean, default=False, nullable=False)
    private_insurance_details = Column(String(180), nullable=True)
    private_insurance_phone = Column(String(20), nullable=True)
    observation = Column(Text, nullable=True)
    acknowledgement_date = Column(Date, nullable=True)
    acknowledgement_signature = Column(String(180), nullable=True)
    address = Column(String(300), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    @property
    def unit_label(self) -> str | None:
        if self.external_unit_name:
            return self.external_unit_name
        return self.unit.display_name if self.unit else None

    @property
    def children(self) -> list[dict]:
        if not self.children_json:
            return []
        try:
            data = json.loads(self.children_json)
        except (TypeError, ValueError):
            return []
        if isinstance(data, list):
            return data
        return []

    @children.setter
    def children(self, value) -> None:
        if not value:
            self.children_json = None
            return
        self.children_json = json.dumps(value, ensure_ascii=False)
