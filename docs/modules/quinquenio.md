# Módulo de Quinquênio

## Objetivo

Controlar os blocos de quinquênio do policial, com cálculo automático de direito, interrupções, períodos de uso e status do bloco.

## Situação atual

O módulo já possui:

- busca do policial por `RE-DC`
- leitura de `data_admissao` no cadastro do policial
- cálculo automático por ciclos de `1825 dias`
- registro de interrupções
- recálculo das previsões futuras
- registro do próximo bloco
- controle dos `3 períodos` por bloco
- bloqueio de mais de `1 Pecúnia` por bloco
- timeline operacional do policial

## Regras principais

- o direito é calculado por ciclos de `1825 dias`
- interrupções somam dias ao cálculo do próximo bloco
- cada bloco possui `3 períodos`
- apenas `1 período` por bloco pode ser `Pecúnia`
- períodos de `Fruição` aceitam `15` ou `30` dias
- `Pecúnia` não usa data de início nem fracionamento

## Fluxo operacional

1. buscar o policial por `RE-DC`
2. analisar o resumo de tempo de serviço
3. registrar interrupções, quando existirem
4. registrar o próximo bloco quando houver direito
5. configurar os períodos do bloco
6. acompanhar saldo, status e timeline

## Status trabalhados

- `PREVISTO`
- `CONCEDIDO`
- `EM_USO`
- `ENCERRADO`

## Arquivos principais

- [backend/app/routes/quinquenio.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/quinquenio.py)
- [backend/app/modules/rh/quinquenio_service.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/modules/rh/quinquenio_service.py)
- [backend/app/schemas/quinquenio.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/schemas/quinquenio.py)
- [backend/app/models/quinquenio_bloco.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/quinquenio_bloco.py)
- [backend/app/models/quinquenio_periodo.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/quinquenio_periodo.py)
- [backend/app/models/quinquenio_bloco_interrupcao.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/quinquenio_bloco_interrupcao.py)
- [frontend/src/pages/QuinquenioPage.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/QuinquenioPage.jsx)
- [frontend/src/services/quinquenioService.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/services/quinquenioService.js)

## Observações

- o módulo não altera dados cadastrais do policial
- a base principal do cálculo é o cadastro já existente no `P1`
- a interface foi ajustada para manter os blocos recolhidos por padrão e expandir sob demanda
