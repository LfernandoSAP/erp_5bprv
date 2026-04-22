# Módulo de Previsão de Rancho

## Objetivo

Planejar mensalmente o consumo de `Café` e `Almoço` por unidade, usando uma grade operacional por participante e por dia útil.

## Situação atual

O módulo já possui:

- criação de planejamento por `mês`, `ano` e `unidade`
- adição de participantes `PM`, `Civil` e `Visitante`
- busca de PM por base de policiais via `RE-DC`
- grade mensal com marcação de `C` e `A`
- exclusão de sábados e domingos
- exportação `Excel`
- fechamento de planejamento com possibilidade de nova edição operacional

## Regras principais

- a base do planejamento é mensal
- sábados e domingos ficam fora da grade
- `PM` deve ser selecionado pela base de policiais
- `Civil` e `Visitante` podem ser inseridos manualmente
- a grade representa:
  - `C` = café
  - `A` = almoço

## Fluxo operacional

1. criar o planejamento do mês
2. adicionar os participantes
3. marcar `Café` e `Almoço` por dia útil
4. revisar totais por categoria
5. exportar a planilha, se necessário

## Estrutura de totais

O rodapé da grade já consolida:

- `TOTAL EFETIVO`
- `FUNCIONÁRIOS CIVIS`
- `AVULSOS`
- `TOTAL GERAL`

## Arquivos principais

- [backend/app/routes/rancho.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/rancho.py)
- [backend/app/modules/logistica/rancho_service.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/modules/logistica/rancho_service.py)
- [backend/app/schemas/rancho.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/schemas/rancho.py)
- [backend/app/models/rancho_configuracao.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/rancho_configuracao.py)
- [backend/app/models/rancho_participante.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/rancho_participante.py)
- [backend/app/models/rancho_lancamento.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/rancho_lancamento.py)
- [frontend/src/pages/RanchoPage.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/RanchoPage.jsx)
- [frontend/src/services/ranchoService.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/services/ranchoService.js)

## Observações

- a grade foi refinada para ficar mais próxima da planilha operacional real
- o módulo já trabalha com seleção por nome ou `RE-DC` parcial na busca de PM
