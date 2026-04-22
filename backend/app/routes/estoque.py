from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.modules.logistica import service as logistica_service
from app.schemas.estoque import (
    EstoqueEntradaCreate,
    EstoqueEntradaOut,
    EstoqueEntradaUpdate,
    EstoqueFornecedorCreate,
    EstoqueFornecedorOut,
    EstoqueFornecedorUpdate,
    EstoqueMovimentacaoCreate,
    EstoqueMovimentacaoOut,
    EstoqueOrdemManutencaoCreate,
    EstoqueOrdemManutencaoOut,
    EstoqueOrdemManutencaoUpdate,
    EstoqueProdutoCreate,
    EstoqueProdutoOut,
    EstoqueProdutoUpdate,
    EstoqueSaidaCreate,
    EstoqueSaidaOut,
    EstoqueSaidaUpdate,
)

router = APIRouter(prefix="/estoque", tags=["P4 - Estoque/Manutenção"])


@router.get("/produtos", response_model=List[EstoqueProdutoOut])
def list_produtos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.list_estoque_produtos(db=db, current_user=current_user)


@router.post("/produtos", response_model=EstoqueProdutoOut, status_code=201)
def create_produto(payload: EstoqueProdutoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_produto(payload=payload, db=db, current_user=current_user)


@router.get("/produtos/{item_id}", response_model=EstoqueProdutoOut)
def get_produto(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_produto(item_id=item_id, db=db, current_user=current_user)


@router.put("/produtos/{item_id}", response_model=EstoqueProdutoOut)
def update_produto(item_id: int, payload: EstoqueProdutoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.update_estoque_produto(item_id=item_id, payload=payload, db=db, current_user=current_user)


@router.delete("/produtos/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produto(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_produto(item_id=item_id, db=db, current_user=current_user)


@router.get("/fornecedores", response_model=List[EstoqueFornecedorOut])
def list_fornecedores(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.list_estoque_fornecedores(db=db, current_user=current_user)


@router.post("/fornecedores", response_model=EstoqueFornecedorOut, status_code=201)
def create_fornecedor(payload: EstoqueFornecedorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_fornecedor(payload=payload, db=db, current_user=current_user)


@router.get("/fornecedores/{item_id}", response_model=EstoqueFornecedorOut)
def get_fornecedor(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_fornecedor(item_id=item_id, db=db, current_user=current_user)


@router.put("/fornecedores/{item_id}", response_model=EstoqueFornecedorOut)
def update_fornecedor(item_id: int, payload: EstoqueFornecedorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.update_estoque_fornecedor(item_id=item_id, payload=payload, db=db, current_user=current_user)


@router.delete("/fornecedores/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fornecedor(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_fornecedor(item_id=item_id, db=db, current_user=current_user)


@router.get("/entradas", response_model=List[EstoqueEntradaOut])
def list_entradas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.list_estoque_entradas(db=db, current_user=current_user)


@router.post("/entradas", response_model=EstoqueEntradaOut, status_code=201)
def create_entrada(payload: EstoqueEntradaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_entrada(payload=payload, db=db, current_user=current_user)


@router.get("/entradas/{item_id}", response_model=EstoqueEntradaOut)
def get_entrada(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_entrada(item_id=item_id, db=db, current_user=current_user)


@router.put("/entradas/{item_id}", response_model=EstoqueEntradaOut)
def update_entrada(item_id: int, payload: EstoqueEntradaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.update_estoque_entrada(item_id=item_id, payload=payload, db=db, current_user=current_user)


@router.delete("/entradas/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entrada(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_entrada(item_id=item_id, db=db, current_user=current_user)


@router.get("/saidas", response_model=List[EstoqueSaidaOut])
def list_saidas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.list_estoque_saidas(db=db, current_user=current_user)


@router.post("/saidas", response_model=EstoqueSaidaOut, status_code=201)
def create_saida(payload: EstoqueSaidaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_saida(payload=payload, db=db, current_user=current_user)


@router.get("/saidas/{item_id}", response_model=EstoqueSaidaOut)
def get_saida(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_saida(item_id=item_id, db=db, current_user=current_user)


@router.put("/saidas/{item_id}", response_model=EstoqueSaidaOut)
def update_saida(item_id: int, payload: EstoqueSaidaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.update_estoque_saida(item_id=item_id, payload=payload, db=db, current_user=current_user)


@router.delete("/saidas/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saida(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_saida(item_id=item_id, db=db, current_user=current_user)


@router.get("/ordens-manutencao", response_model=List[EstoqueOrdemManutencaoOut])
def list_ordens_manutencao(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.list_estoque_ordens_manutencao(db=db, current_user=current_user)


@router.post("/ordens-manutencao", response_model=EstoqueOrdemManutencaoOut, status_code=201)
def create_ordem_manutencao(payload: EstoqueOrdemManutencaoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_ordem_manutencao(payload=payload, db=db, current_user=current_user)


@router.get("/ordens-manutencao/{item_id}", response_model=EstoqueOrdemManutencaoOut)
def get_ordem_manutencao(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_ordem_manutencao(item_id=item_id, db=db, current_user=current_user)


@router.put("/ordens-manutencao/{item_id}", response_model=EstoqueOrdemManutencaoOut)
def update_ordem_manutencao(item_id: int, payload: EstoqueOrdemManutencaoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.update_estoque_ordem_manutencao(item_id=item_id, payload=payload, db=db, current_user=current_user)


@router.delete("/ordens-manutencao/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ordem_manutencao(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_ordem_manutencao(item_id=item_id, db=db, current_user=current_user)


@router.get("/movimentacoes", response_model=List[EstoqueMovimentacaoOut])
def list_movimentacoes(
    produto_id: int | None = None,
    data_inicial: datetime | None = None,
    data_final: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return logistica_service.list_estoque_movimentacoes(
        produto_id=produto_id,
        data_inicial=data_inicial,
        data_final=data_final,
        db=db,
        current_user=current_user,
    )


@router.post("/movimentacoes", response_model=EstoqueMovimentacaoOut, status_code=201)
def create_movimentacao(payload: EstoqueMovimentacaoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.create_estoque_movimentacao(payload=payload, db=db, current_user=current_user)


@router.get("/movimentacoes/{item_id}", response_model=EstoqueMovimentacaoOut)
def get_movimentacao(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.get_estoque_movimentacao(item_id=item_id, db=db, current_user=current_user)


@router.delete("/movimentacoes/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movimentacao(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return logistica_service.delete_estoque_movimentacao(item_id=item_id, db=db, current_user=current_user)


