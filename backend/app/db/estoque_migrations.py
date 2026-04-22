from app.models.estoque import (
    EstoqueEntrada,
    EstoqueFornecedor,
    EstoqueMovimentacao,
    EstoqueOrdemManutencao,
    EstoqueProduto,
    EstoqueSaida,
)


def ensure_estoque_schema_compatibility(engine) -> None:
    EstoqueProduto.__table__.create(bind=engine, checkfirst=True)
    EstoqueFornecedor.__table__.create(bind=engine, checkfirst=True)
    EstoqueEntrada.__table__.create(bind=engine, checkfirst=True)
    EstoqueSaida.__table__.create(bind=engine, checkfirst=True)
    EstoqueOrdemManutencao.__table__.create(bind=engine, checkfirst=True)
    EstoqueMovimentacao.__table__.create(bind=engine, checkfirst=True)
