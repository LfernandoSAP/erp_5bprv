from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Tabela de Categorias
class Categoria(Base):
    __tablename__ = "categorias"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)
    descricao = Column(Text)
    
    produtos = relationship("Produto", back_populates="categoria")

# Tabela de Unidades/Localizações
class Unidade(Base):
    __tablename__ = "unidades"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)
    municipio = Column(String(100))
    
    estoques = relationship("Estoque", back_populates="unidade")

# Tabela de Responsáveis
class Responsavel(Base):
    __tablename__ = "responsaveis"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    re = Column(String(50), unique=True)
    posto_graduacao = Column(String(50))
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    
    unidade = relationship("Unidade")
    movimentacoes = relationship("Movimentacao", back_populates="responsavel")

# Tabela de Produtos/Itens
class Produto(Base):
    __tablename__ = "produtos"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True)
    nome = Column(String(200), nullable=False)
    descricao = Column(Text)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    tipo = Column(String(100))
    marca = Column(String(100))
    modelo = Column(String(100))
    calibre = Column(String(50))
    numero_serie = Column(String(100), unique=True, index=True)
    unidade_medida = Column(String(20))
    especificacoes = Column(Text)
    ativo = Column(Boolean, default=True)
    
    categoria = relationship("Categoria", back_populates="produtos")
    estoques = relationship("Estoque", back_populates="produto")
    movimentacoes = relationship("Movimentacao", back_populates="produto")

# Tabela de Estoque
class Estoque(Base):
    __tablename__ = "estoque"
    
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=False)
    quantidade_atual = Column(Float, default=0)
    quantidade_minima = Column(Float, default=0)
    lote = Column(String(50))
    data_validade = Column(Date)
    observacoes = Column(Text)
    
    produto = relationship("Produto", back_populates="estoques")
    unidade = relationship("Unidade", back_populates="estoques")

# Tabela de Movimentações
class Movimentacao(Base):
    __tablename__ = "movimentacoes"
    
    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, default=datetime.now, nullable=False)
    tipo = Column(String(20), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Float, nullable=False)
    unidade_origem_id = Column(Integer, ForeignKey("unidades.id"))
    unidade_destino_id = Column(Integer, ForeignKey("unidades.id"))
    responsavel_id = Column(Integer, ForeignKey("responsaveis.id"))
    documento = Column(String(100))
    observacoes = Column(Text)
    
    produto = relationship("Produto", back_populates="movimentacoes")
    responsavel = relationship("Responsavel", back_populates="movimentacoes")
    unidade_origem = relationship("Unidade", foreign_keys=[unidade_origem_id])
    unidade_destino = relationship("Unidade", foreign_keys=[unidade_destino_id])
