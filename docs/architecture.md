# Arquitetura do Sistema

## Objetivo

Este documento descreve a arquitetura atual do ERP 5BPRv e a direção adotada para sua evolução.

## Estilo arquitetural

O sistema está sendo organizado como um `monólito modular`.

Na prática, isso significa:

- um único backend principal
- um único frontend principal
- módulos de negócio separados internamente
- compartilhamento controlado de autenticação, banco, utilitários e identidade visual

## Visão em camadas

### Frontend

Responsável por:

- navegação
- formulários
- exibição de dados
- exportação disparada pela interface
- consumo da API

Tecnologia principal:

- `React + Vite`

### API

Responsável por:

- receber requisições HTTP
- autenticar o usuário
- validar entrada e saída
- expor endpoints REST por módulo

Tecnologia principal:

- `FastAPI`

### Services

Responsáveis por:

- regras de negócio
- aplicação de permissões
- validações de fluxo
- orquestração entre rotas, repositórios e utilitários

### Repositories

Responsáveis por:

- acesso ao banco
- consultas
- persistência

### Models e Schemas

Responsáveis por:

- estrutura dos dados
- contratos da API
- mapeamento ORM
- validação via Pydantic

## Diagrama resumido

```text
Frontend (React/Vite)
  ->
API REST (FastAPI)
  ->
Services / Repositories
  ->
SQLAlchemy
  ->
PostgreSQL
```

## Banco de dados

O banco principal atual é `PostgreSQL`.

O projeto também possui camadas de compatibilidade e migrações leves para manter a base funcional durante a transição arquitetural.

Schemas já considerados na organização atual:

- `public`
- `rh`
- `logistica`
- `estatistica`

## Organizacao de backend

O backend atual já caminha para esta estrutura:

```text
backend/app/
  core/
  db/
  models/
  routes/
  schemas/
  shared/
  modules/
```

O padrão adotado internamente é:

```text
router -> service -> repository
```

Isso já está mais consolidado principalmente em:

- `logistica`
- `rh`
- `estatistica`
- `telematica/users`

## Organizacao de frontend

O frontend hoje está organizado principalmente em:

```text
frontend/src/
  components/
  config/
  constants/
  pages/
  services/
  utils/
```

A navegação principal está centralizada em `src/App.jsx`, com configuração de módulos em `src/config/navigation.js`.

O frontend autenticado hoje segue este fluxo:

- menu lateral com apenas módulos de 1º nível
- tela inicial de boas-vindas após login
- hubs de cards por módulo
- hubs de 2º nível para áreas como `Frota`, `Material Bélico` e `Romaneio`
- telas operacionais mantendo botão `Voltar`

## Módulos atualmente mais relevantes

- `RH`
  - policiais
  - unidades
  - setores

- `Logistica`
  - materiais
  - `TPD/Talonario`
  - frota
  - material bélico

- `Estatistica`
  - dashboard
  - logs

- `Telematica`
  - usuários e acessos administrativos

## Controle de acesso

As principais regras técnicas atuais são:

- autenticação por `JWT`
- escopo por unidade
- diferenciação entre visão global e local
- validação de escopo em utilitários compartilhados

## Estado atual da arquitetura

Hoje o projeto já possui uma base sólida:

- frontend separado do backend
- API REST funcional
- autenticação com JWT
- módulos separados por domínio
- extração gradual de regra de negócio para services/repositories
- relatórios em Excel e PDF
- scripts de start/stop/status para operação local

## Próximos princípios de evolução

- manter o padrão modular
- evitar duplicação de regra de negócio nas rotas
- manter documentação funcional atualizada
- fazer alterações pequenas e seguras
- validar sempre navegação, codificação de texto e responsividade após novas entregas
