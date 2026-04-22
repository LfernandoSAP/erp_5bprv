from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class EstoqueProdutoBase(BaseModel):
    nome: str
    codigo_patrimonio: Optional[str] = None
    categoria: Optional[str] = None
    unidade_medida: Optional[str] = None
    estoque_minimo: int = 0
    estoque_atual: int = 0
    localizacao: Optional[str] = None
    observacoes: Optional[str] = None
    status: str = "Ativo"

    @field_validator("nome")
    @classmethod
    def validate_nome(cls, value: str):
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o nome do produto.")
        return normalized


class EstoqueProdutoCreate(EstoqueProdutoBase):
    pass


class EstoqueProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    codigo_patrimonio: Optional[str] = None
    categoria: Optional[str] = None
    unidade_medida: Optional[str] = None
    estoque_minimo: Optional[int] = None
    localizacao: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class EstoqueProdutoOut(EstoqueProdutoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class EstoqueFornecedorBase(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    produto_servico: Optional[str] = None
    observacoes: Optional[str] = None
    status: str = "Ativo"


class EstoqueFornecedorCreate(EstoqueFornecedorBase):
    pass


class EstoqueFornecedorUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    produto_servico: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class EstoqueFornecedorOut(EstoqueFornecedorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class EstoqueEntradaBase(BaseModel):
    produto_id: Optional[int] = None
    produto_nome: Optional[str] = None
    quantidade_recebida: int
    data_entrada: Optional[datetime] = None
    numero_documento: Optional[str] = None
    fornecedor_id: Optional[int] = None
    fornecedor_nome: Optional[str] = None
    responsavel_recebimento: Optional[str] = None
    unidade_destino_id: Optional[int] = None
    observacoes: Optional[str] = None

    @field_validator("quantidade_recebida")
    @classmethod
    def validate_quantidade_recebida(cls, value: int):
        if value <= 0:
            raise ValueError("A quantidade recebida deve ser maior que zero.")
        return value

    @model_validator(mode="after")
    def validate_produto(self):
        has_id = self.produto_id is not None
        has_name = bool(str(self.produto_nome or "").strip())
        if not has_id and not has_name:
            raise ValueError("Informe a mercadoria da entrada.")
        return self


class EstoqueEntradaCreate(EstoqueEntradaBase):
    pass


class EstoqueEntradaUpdate(BaseModel):
    produto_id: Optional[int] = None
    quantidade_recebida: Optional[int] = None
    data_entrada: Optional[datetime] = None
    numero_documento: Optional[str] = None
    fornecedor_id: Optional[int] = None
    fornecedor_nome: Optional[str] = None
    responsavel_recebimento: Optional[str] = None
    unidade_destino_id: Optional[int] = None
    observacoes: Optional[str] = None


class EstoqueEntradaOut(EstoqueEntradaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    saldo_anterior: int
    saldo_atual: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    produto_nome: Optional[str] = None
    unidade_destino_label: Optional[str] = None
    fornecedor_label: Optional[str] = None


class EstoqueSaidaBase(BaseModel):
    produto_id: int
    quantidade: int
    data_saida: Optional[datetime] = None
    motivo_saida: Optional[str] = None
    destino_solicitante: Optional[str] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator("quantidade")
    @classmethod
    def validate_quantidade(cls, value: int):
        if value <= 0:
            raise ValueError("A quantidade deve ser maior que zero.")
        return value


class EstoqueSaidaCreate(EstoqueSaidaBase):
    pass


class EstoqueSaidaUpdate(BaseModel):
    produto_id: Optional[int] = None
    quantidade: Optional[int] = None
    data_saida: Optional[datetime] = None
    motivo_saida: Optional[str] = None
    destino_solicitante: Optional[str] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None


class EstoqueSaidaOut(EstoqueSaidaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    saldo_anterior: int
    saldo_atual: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    produto_nome: Optional[str] = None


class EstoqueOrdemManutencaoBase(BaseModel):
    tipo: str
    item_equipamento: str
    patrimonio_placa: Optional[str] = None
    descricao_problema: str
    data_abertura: Optional[datetime] = None
    previsao_conclusao: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    responsavel_tecnico: Optional[str] = None
    pecas_utilizadas: Optional[str] = None
    custo_estimado: Optional[Decimal] = None
    custo_real: Optional[Decimal] = None
    status: str = "Aberta"
    observacoes: Optional[str] = None


class EstoqueOrdemManutencaoCreate(EstoqueOrdemManutencaoBase):
    pass


class EstoqueOrdemManutencaoUpdate(BaseModel):
    tipo: Optional[str] = None
    item_equipamento: Optional[str] = None
    patrimonio_placa: Optional[str] = None
    descricao_problema: Optional[str] = None
    data_abertura: Optional[datetime] = None
    previsao_conclusao: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    responsavel_tecnico: Optional[str] = None
    pecas_utilizadas: Optional[str] = None
    custo_estimado: Optional[Decimal] = None
    custo_real: Optional[Decimal] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: Optional[bool] = None


class EstoqueOrdemManutencaoOut(EstoqueOrdemManutencaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero_ordem: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class EstoqueMovimentacaoCreate(BaseModel):
    produto_id: int
    tipo: str
    quantidade: int
    saldo_anterior: int
    saldo_atual: int
    responsavel: Optional[str] = None
    observacao: Optional[str] = None
    unidade_origem_id: Optional[int] = None
    unidade_destino_id: Optional[int] = None
    entrada_id: Optional[int] = None
    saida_id: Optional[int] = None


class EstoqueMovimentacaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    tipo: str
    quantidade: int
    saldo_anterior: int
    saldo_atual: int
    responsavel: Optional[str] = None
    observacao: Optional[str] = None
    unidade_origem_id: Optional[int] = None
    unidade_destino_id: Optional[int] = None
    created_at: datetime
    produto_nome: Optional[str] = None
    unidade_origem_label: Optional[str] = None
    unidade_destino_label: Optional[str] = None


class EstoqueRelatorioFilters(BaseModel):
    categoria: Optional[str] = None
    status: Optional[str] = None
    situacao: Optional[str] = None
    produto_id: Optional[int] = None
    data_inicial: Optional[datetime] = None
    data_final: Optional[datetime] = None
