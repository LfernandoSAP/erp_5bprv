from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class ControleEfetivo(Base):
    __tablename__ = "controle_efetivo"
    __table_args__ = {"schema": "rh"}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rh.units.id"), nullable=False, index=True)
    police_officer_id = Column(Integer, ForeignKey("rh.police_officers.id"), nullable=True, index=True)

    re_dc = Column(String(30), nullable=False, index=True)
    quadro = Column(String(20), nullable=False, index=True)
    nome = Column(String(200), nullable=False, index=True)
    sexo = Column(String(30), nullable=True)
    unidade = Column(String(180), nullable=True, index=True)
    opm_atual = Column(String(20), nullable=True, index=True)
    sinesp = Column(String(10), nullable=True, index=True)
    processo_regular = Column(String(10), nullable=True, index=True)
    numero_processo = Column(String(120), nullable=True, index=True)
    situacao = Column(String(80), nullable=False, index=True)
    situacao_outros = Column(String(180), nullable=True)
    obs_situacao = Column(Text, nullable=True)
    cep_tran_rv = Column(String(10), nullable=True, index=True)
    data_admissao = Column(String(20), nullable=True, index=True)
    data_25_anos = Column(String(20), nullable=True, index=True)
    averbacao_inss = Column(String(120), nullable=True)
    averbacao_militar = Column(String(120), nullable=True)
    inatividade = Column(String(120), nullable=True)
    cprv = Column(String(10), nullable=True, index=True)
    data_apresentacao = Column(String(20), nullable=True, index=True)
    data_nascimento = Column(String(20), nullable=True)
    nivel_escolaridade = Column(String(80), nullable=True, index=True)
    curso = Column(String(180), nullable=True)
    rg = Column(String(30), nullable=True)
    cpf = Column(String(20), nullable=True)
    telefone_celular = Column(String(20), nullable=True)
    telefone_2 = Column(String(20), nullable=True)
    email_funcional = Column(String(180), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    unit = relationship("Unit")
    police_officer = relationship("PoliceOfficer")
