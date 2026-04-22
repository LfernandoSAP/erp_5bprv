from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class RomaneioMedidaBase(BaseModel):
    calca: str
    cinto_lona_tipo: str
    cinto_lona_medida: str
    fiel_retratil: str
    cinturao_preto_lado: str
    cinturao_preto_medida: str
    calcado: str
    colete_balistico: str
    calca_combat: str
    quepe: str
    boina: str
    camisa: str
    camisa_combat_manga_longa: str
    camiseta_gola_careca: str
    agasalho_blusa: str
    agasalho_calca: str
    meia: str

    @field_validator(
        "calca",
        "cinto_lona_tipo",
        "cinto_lona_medida",
        "fiel_retratil",
        "cinturao_preto_lado",
        "cinturao_preto_medida",
        "calcado",
        "colete_balistico",
        "calca_combat",
        "quepe",
        "boina",
        "camisa",
        "camisa_combat_manga_longa",
        "camiseta_gola_careca",
        "agasalho_blusa",
        "agasalho_calca",
        "meia",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Preencha todos os campos obrigatórios.")
        return normalized


class RomaneioMedidaCreate(RomaneioMedidaBase):
    re: str


class RomaneioMedidaUpdate(RomaneioMedidaBase):
    pass


class RomaneioMedidaOut(RomaneioMedidaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policial_id: int
    re: str
    created_at: datetime
    updated_at: datetime | None = None


class RomaneioPolicialResumo(BaseModel):
    nome_completo: str | None = None
    nome_guerra: str | None = None
    re_dc: str
    posto_graduacao: str | None = None
    unidade: str | None = None
    status: str | None = None


class RomaneioMedidaLookupOut(BaseModel):
    policial: RomaneioPolicialResumo
    medidas: RomaneioMedidaOut | None = None
