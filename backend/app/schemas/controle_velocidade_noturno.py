from datetime import date, datetime

from pydantic import BaseModel, Field


class ControleVelocidadeNoturnoCreate(BaseModel):
    data_registro: date
    unit_id: int = Field(gt=0)
    quantidade_autuados: int = Field(default=0, ge=0)


class ControleVelocidadeNoturnoOut(BaseModel):
    id: int
    data_registro: date
    month_key: str
    month_label: str
    unit_id: int
    unit_label: str
    quantidade_autuados: int
    created_at: datetime | None = None


class ControleVelocidadeNoturnoMonthlyPoint(BaseModel):
    month_key: str
    month_label: str
    total: int


class ControleVelocidadeNoturnoResumoOut(BaseModel):
    total_registros: int
    total_autuados: int
    total_mes_atual: int
    total_unidades: int
    monthly: list[ControleVelocidadeNoturnoMonthlyPoint]
