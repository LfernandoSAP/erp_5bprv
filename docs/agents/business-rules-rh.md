# Regras de Negocio - RH

## Cadastro de policial

- dados funcionais e pessoais vem do cadastro-base
- `data_admissao` e critica para calculos futuros

## Quinquenio

- calculo por ciclos de `1825 dias`
- interrupcoes impactam os proximos blocos
- cada bloco tem `3 periodos`
- no maximo `1 Pecunia` por bloco

## LP

- blocos independentes por policial
- periodos podem ser fracionados conforme a regra do modulo

## LSV

- segue logica semelhante a LP em estrutura de cards
- mantem regras proprias de concessao e fruicao

## Rancho

- grade mensal por `mes/ano/unidade`
- so dias uteis entram na grade
- marcacoes de `Cafe` e `Almoco`

## O que um agente nao deve quebrar

- calculo de datas e ciclos
- separacao entre bloco, periodo e interrupcao
- leitura correta do cadastro-base do policial
- coerencia entre backend e frontend nos fluxos de RH
