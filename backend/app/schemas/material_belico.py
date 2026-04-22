from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class MaterialBelicoBase(BaseModel):
    unit_id: int
    custody_type: str = "RESERVA_UNIDADE"
    custody_sector_id: Optional[int] = None
    police_officer_id: Optional[int] = None
    category: str
    ordem: int
    posto_grad: str
    re: str
    nome: str
    cia_em: str
    opm_atual: str
    armamento_num_serie: Optional[str] = None
    armamento_patrimonio: Optional[str] = None
    municao_lote: Optional[str] = None
    algema_num_serie: Optional[str] = None
    algema_patrimonio: Optional[str] = None
    colete_num_serie: Optional[str] = None
    colete_patrimonio: Optional[str] = None
    item_name: Optional[str] = None
    lot_number: Optional[str] = None
    expiration_date: Optional[date] = None
    quantity: Optional[int] = None
    item_brand: Optional[str] = None
    item_model: Optional[str] = None
    item_model_other: Optional[str] = None
    item_type: Optional[str] = None
    item_gender: Optional[str] = None
    item_size: Optional[str] = None
    item_holder: Optional[str] = None
    item_holder_other: Optional[str] = None
    cdc_material_type: Optional[str] = None
    cdc_exoskeleton_size: Optional[str] = None
    is_active: bool = True


class MaterialBelicoCreate(MaterialBelicoBase):
    pass


class MaterialBelicoUpdate(BaseModel):
    unit_id: Optional[int] = None
    custody_type: Optional[str] = None
    custody_sector_id: Optional[int] = None
    police_officer_id: Optional[int] = None
    ordem: Optional[int] = None
    posto_grad: Optional[str] = None
    re: Optional[str] = None
    nome: Optional[str] = None
    cia_em: Optional[str] = None
    opm_atual: Optional[str] = None
    armamento_num_serie: Optional[str] = None
    armamento_patrimonio: Optional[str] = None
    municao_lote: Optional[str] = None
    algema_num_serie: Optional[str] = None
    algema_patrimonio: Optional[str] = None
    colete_num_serie: Optional[str] = None
    colete_patrimonio: Optional[str] = None
    item_name: Optional[str] = None
    lot_number: Optional[str] = None
    expiration_date: Optional[date] = None
    quantity: Optional[int] = None
    item_brand: Optional[str] = None
    item_model: Optional[str] = None
    item_model_other: Optional[str] = None
    item_type: Optional[str] = None
    item_gender: Optional[str] = None
    item_size: Optional[str] = None
    item_holder: Optional[str] = None
    item_holder_other: Optional[str] = None
    cdc_material_type: Optional[str] = None
    cdc_exoskeleton_size: Optional[str] = None
    is_active: Optional[bool] = None


class MaterialBelicoOut(MaterialBelicoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_label: Optional[str] = None
    custody_sector_name: Optional[str] = None
    assigned_officer_re: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class MaterialBelicoMovementBase(BaseModel):
    movement_type: str
    to_unit_id: Optional[int] = None
    to_custody_type: Optional[str] = None
    to_custody_sector_id: Optional[int] = None
    to_police_officer_id: Optional[int] = None
    details: Optional[str] = None


class MaterialBelicoMovementCreate(MaterialBelicoMovementBase):
    pass


class MaterialBelicoTransferCreate(BaseModel):
    quantity: int = Field(validation_alias=AliasChoices("quantity", "quantidade"))
    to_unit_id: int = Field(
        validation_alias=AliasChoices("to_unit_id", "unidade_destino_id")
    )
    to_custody_sector_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("to_custody_sector_id", "setor_destino_id"),
    )
    to_custody_type: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "to_custody_type",
            "responsabilidade_destino",
        ),
    )
    details: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("details", "observacao"),
    )


class MaterialBelicoTransferResponse(BaseModel):
    success: bool
    message: str
    saldo_restante: int
    quantidade_transferida: int


class MaterialBelicoMovementOut(MaterialBelicoMovementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material_belico_id: int
    user_id: int
    from_unit_id: Optional[int] = None
    from_police_officer_id: Optional[int] = None
    created_at: datetime
    quantity_transferred: Optional[int] = None
    item_name: Optional[str] = None
    user_name: Optional[str] = None
    from_unit_label: Optional[str] = None
    to_unit_label: Optional[str] = None
    from_custody_type: Optional[str] = None
    to_custody_type: Optional[str] = None
    from_custody_sector_name: Optional[str] = None
    to_custody_sector_name: Optional[str] = None
    from_officer_re: Optional[str] = None
    to_officer_re: Optional[str] = None
    from_officer_name: Optional[str] = None
    to_officer_name: Optional[str] = None
