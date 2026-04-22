from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class EstoqueProduto(Base):
    __tablename__ = "estoque_produtos"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    codigo_patrimonio = Column(String(120), nullable=True, index=True)
    categoria = Column(String(100), nullable=True, index=True)
    unidade_medida = Column(String(50), nullable=True)
    estoque_minimo = Column(Integer, nullable=False, default=0)
    estoque_atual = Column(Integer, nullable=False, default=0)
    localizacao = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="Ativo")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class EstoqueFornecedor(Base):
    __tablename__ = "estoque_fornecedores"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    cnpj = Column(String(18), nullable=True, index=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    endereco = Column(String(250), nullable=True)
    produto_servico = Column(String(250), nullable=True)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="Ativo")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class EstoqueEntrada(Base):
    __tablename__ = "estoque_entradas"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("logistica.estoque_produtos.id"), nullable=False, index=True)
    quantidade_recebida = Column(Integer, nullable=False)
    data_entrada = Column(DateTime(timezone=False), nullable=True)
    numero_documento = Column(String(120), nullable=True)
    fornecedor_id = Column(Integer, ForeignKey("logistica.estoque_fornecedores.id"), nullable=True, index=True)
    fornecedor_nome = Column(String(200), nullable=True)
    responsavel_recebimento = Column(String(200), nullable=True)
    unidade_destino_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    observacoes = Column(Text, nullable=True)
    saldo_anterior = Column(Integer, nullable=False, default=0)
    saldo_atual = Column(Integer, nullable=False, default=0)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    produto = relationship("EstoqueProduto")
    fornecedor = relationship("EstoqueFornecedor")
    unidade_destino = relationship("Unit")

    @property
    def produto_nome(self):
        return self.produto.nome if self.produto else None

    @property
    def unidade_destino_label(self):
        if not self.unidade_destino:
            return None
        return (
            getattr(self.unidade_destino, "display_name", None)
            or getattr(self.unidade_destino, "name", None)
        )

    @property
    def fornecedor_label(self):
        if self.fornecedor:
            return self.fornecedor.nome
        return self.fornecedor_nome


class EstoqueSaida(Base):
    __tablename__ = "estoque_saidas"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("logistica.estoque_produtos.id"), nullable=False, index=True)
    quantidade = Column(Integer, nullable=False)
    data_saida = Column(DateTime(timezone=False), nullable=True)
    motivo_saida = Column(String(80), nullable=True)
    destino_solicitante = Column(String(200), nullable=True)
    responsavel = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    saldo_anterior = Column(Integer, nullable=False, default=0)
    saldo_atual = Column(Integer, nullable=False, default=0)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    produto = relationship("EstoqueProduto")

    @property
    def produto_nome(self):
        return self.produto.nome if self.produto else None


class EstoqueOrdemManutencao(Base):
    __tablename__ = "estoque_ordens_manutencao"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    numero_ordem = Column(String(40), nullable=False, unique=True, index=True)
    tipo = Column(String(80), nullable=False)
    item_equipamento = Column(String(200), nullable=False)
    patrimonio_placa = Column(String(120), nullable=True)
    descricao_problema = Column(Text, nullable=False)
    data_abertura = Column(DateTime(timezone=False), nullable=True)
    previsao_conclusao = Column(DateTime(timezone=False), nullable=True)
    data_conclusao = Column(DateTime(timezone=False), nullable=True)
    responsavel_tecnico = Column(String(200), nullable=True)
    pecas_utilizadas = Column(Text, nullable=True)
    custo_estimado = Column(Numeric(12, 2), nullable=True)
    custo_real = Column(Numeric(12, 2), nullable=True)
    status = Column(String(30), nullable=False, default="Aberta")
    observacoes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class EstoqueMovimentacao(Base):
    __tablename__ = "estoque_movimentacoes"
    __table_args__ = {"schema": "logistica"}

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("logistica.estoque_produtos.id"), nullable=False, index=True)
    entrada_id = Column(Integer, ForeignKey("logistica.estoque_entradas.id"), nullable=True, index=True)
    saida_id = Column(Integer, ForeignKey("logistica.estoque_saidas.id"), nullable=True, index=True)
    tipo = Column(String(20), nullable=False, index=True)
    quantidade = Column(Integer, nullable=False)
    saldo_anterior = Column(Integer, nullable=False, default=0)
    saldo_atual = Column(Integer, nullable=False, default=0)
    responsavel = Column(String(200), nullable=True)
    observacao = Column(Text, nullable=True)
    unidade_origem_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    unidade_destino_id = Column(Integer, ForeignKey("rh.units.id"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    produto = relationship("EstoqueProduto")
    entrada = relationship("EstoqueEntrada")
    saida = relationship("EstoqueSaida")
    unidade_origem = relationship("Unit", foreign_keys=[unidade_origem_id])
    unidade_destino = relationship("Unit", foreign_keys=[unidade_destino_id])

    @property
    def produto_nome(self):
        return self.produto.nome if self.produto else None

    @property
    def unidade_origem_label(self):
        if not self.unidade_origem:
            return None
        return (
            getattr(self.unidade_origem, "display_name", None)
            or getattr(self.unidade_origem, "name", None)
        )

    @property
    def unidade_destino_label(self):
        if not self.unidade_destino:
            return None
        return (
            getattr(self.unidade_destino, "display_name", None)
            or getattr(self.unidade_destino, "name", None)
        )
