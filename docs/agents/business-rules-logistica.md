# Regras de Negocio - Logistica e Frota

## Principio central

Quase todos os fluxos dependem de:

- unidade
- setor
- perfil do usuario
- escopo hierarquico

## Frota

- `Cadastro de Viaturas` e a base mestre
- `Controle Geral de Viaturas` e visao operacional complementar
- `Mapa Forca` complementa a frota, nao duplica a base

## COPs

- mantem cadastro proprio
- possuem detalhe operacional
- possuem historico de movimentacao

## Estoque e materiais

- entradas, saidas e manutencao devem manter rastreabilidade
- campos de responsabilidade e localizacao sao criticos

## Material belico

- exige maior cuidado com movimentacao e historico
- vinculo de unidade e responsavel nao pode ser perdido

## Processos de armas

- seguem padrao de cadastro e consulta
- devem preservar coerencia documental

## O que um agente nao deve quebrar

- escopo por unidade
- vinculos entre item, setor, policial e viatura
- historico de movimentacoes
- diferenca entre cadastro-base e visoes operacionais
