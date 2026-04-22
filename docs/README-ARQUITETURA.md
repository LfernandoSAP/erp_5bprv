# Arquitetura do Projeto ERP 5BPRv

## Visão geral

O projeto é um ERP web interno voltado à operação do `5BPRv`, com foco em:

- gestão de usuários e permissões
- hierarquia militar de unidades
- setores e módulos por área
- cadastro e movimentação de policiais
- materiais e material bélico
- frota
- TPD/Talonário
- estoque, manutenção e relatórios
- logs e trilha de auditoria

O sistema opera com frontend e backend separados, consumindo API HTTP e persistindo principalmente em `PostgreSQL`, mantendo compatibilidade de desenvolvimento com `SQLite`.

## Stack tecnológica

### Backend

- `Python 3`
- `FastAPI`
- `SQLAlchemy 2`
- `Pydantic 2`
- `Uvicorn`
- `python-jose`
- `passlib`
- `python-dotenv`
- `reportlab`

### Frontend

- `React 19`
- `Vite`
- `MUI`
- `xlsx`
- `jsPDF`
- `jspdf-autotable`

### Banco de dados

- banco principal: `PostgreSQL`
- compatibilidade local e legado: `SQLite`

## Organização do backend

Raiz principal:

- [backend/app](/c:/Users/Telematica/Documents/erp5bprv/backend/app)

Pastas principais:

- [core](/c:/Users/Telematica/Documents/erp5bprv/backend/app/core)
- [db](/c:/Users/Telematica/Documents/erp5bprv/backend/app/db)
- [models](/c:/Users/Telematica/Documents/erp5bprv/backend/app/models)
- [schemas](/c:/Users/Telematica/Documents/erp5bprv/backend/app/schemas)
- [routes](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes)
- [modules](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules)
- [shared](/c:/Users/Telematica/Documents/erp5bprv/backend/app/shared)

Arquivo central:

- [main.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/main.py)

## Organização do frontend

Raiz principal:

- [frontend/src](/c:/Users/Telematica/Documents/erp5bprv/frontend/src)

Pastas principais:

- [pages](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages)
- [components](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/components)
- [services](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/services)
- [config](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/config)
- [utils](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/utils)

Navegação principal:

- [App.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/App.jsx)
- [navigation.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/config/navigation.js)

## Modelos principais de negócio

- `User`
- `UserModuleAccess`
- `LoginAttempt`
- `AuditEvent`
- `Unit`
- `Sector`
- `PoliceOfficer`
- `Item`
- `MaterialBelico`
- `FleetVehicle`
- `ControleEfetivo`
- `LpRegistro`, `LpBloco`
- `LsvRegistro`, `LsvBloco`
- `QuinquenioBloco`, `QuinquenioPeriodo`, `QuinquenioBlocoInterrupcao`
- `RanchoConfiguracao`, `RanchoParticipante`, `RanchoLancamento`
- `ControleVelocidadeNoturno`
- `PlanilhaAcidenteViatura`
- `ProcessoApaf`
- `ProcessoCraf`
- `Cop`, `CopMovement`

## Domínios funcionais principais

### 1. Usuários e permissões

O sistema trabalha com:

- usuário autenticado
- perfil técnico por `role_code`
- unidade principal
- setor principal
- acessos por módulo

### 2. Unidades e hierarquia militar

A hierarquia principal segue:

- Batalhão / EM
- CIAs
- Pelotões

Complemento estrutural:

- `code` permanece como identificador técnico interno
- `codigo_opm` representa o código operacional e administrativo real

### 3. Policiais

Fluxos principais:

- cadastro completo
- consulta com detalhe
- edição
- movimentação
- histórico
- vínculo com materiais
- romaneio de medidas

### 3.1. P1 - Recursos Humanos

Fluxos principais já operacionais:

- Cadastro / Consulta de Policial
- Movimentação de policial
- Controle de Bloco Quinquênio
- Controle de Bloco Lic Prêmio
- Controle de Fruição LSV
- Controle de Efetivo

Estado atual:

- o módulo de `Quinquênio` lê `data_admissao` do policial e calcula os blocos por ciclos de `1825 dias`
- o cálculo considera interrupções registradas no histórico do policial
- cada bloco mantém até `3 períodos`, com regra de no máximo `1 Pecúnia` por bloco
- a interface já expõe resumo do policial, interrupções, timeline e cards expansíveis dos blocos

### 3.2. Assuntos Gerais

Fluxos principais:

- Previsão de Rancho

Estado atual:

- o planejamento mensal do rancho trabalha por `mês/ano/unidade`
- a grade replica a lógica operacional de marcação de `Café` e `Almoço`
- sábados e domingos ficam fora da grade
- o módulo possui exportação `Excel` e controle de fechamento do planejamento

### 3.3. P3 - Estatística

Fluxos principais já operacionais:

- Controle de Velocidade Noturno
- Planilha de Acidentes de Viatura (`PAAVI`)

Estado atual:

- `Controle de Velocidade Noturno` opera com grade mensal por dia x unidade e dashboard consolidado por mês
- `PAAVI` usa o `RE-DC` como chave principal de busca do policial, retornando automaticamente `RE`, `Posto/Graduação` e `Nome`
- o `PAAVI` já possui listagem, detalhe, edição e exportação `Excel/PDF`

### 4. P4 - Logística/Frota

Fluxos principais:

- materiais
- material bélico
- frota
- TPD/Talonário
- estoque e manutenção
- processos de armas
- controle de COPs
- mapa força de viaturas

Estado atual da frota:

- `Cadastro de Viaturas` segue como base mestre dos veículos
- `Controle Geral de Viaturas` funciona como visão operacional complementar
- `Controle de COPs` opera com fluxo próprio de cadastro, detalhe e movimentação
- `Mapa Força de Viaturas` lê a frota existente e mantém apenas os campos complementares do mapa
- o hub da `Frota` já expõe esses submódulos em um padrão visual unificado

### 5. RH complementar

Fluxos principais:

- Controle de Efetivo
- LP
- LSV
- Quinquênio
- Previsão de Rancho

## Módulos recentes por área

### P1 - Recursos Humanos

- `Controle de Bloco Quinquênio`
- `Controle de Bloco Lic Prêmio`
- `Controle de Fruição LSV`

### P3 - Estatística

- `Controle de Velocidade Noturno`
- `Planilha de Acidentes de Viatura`

### Assuntos Gerais

- `Previsão de Rancho`

## Segurança

### Autenticação

A autenticação atual usa:

- `access token` JWT
- `refresh token`
- cookies `HttpOnly`
- fallback por header `Authorization` para compatibilidade controlada

Arquivos centrais:

- [auth.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes/auth.py)
- [security.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/core/security.py)
- [auth.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/core/auth.py)
- [api.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/services/api.js)
- [authService.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/services/authService.js)

### Sessão no frontend

- o navegador envia cookies automaticamente com `credentials: "include"`
- a sessão é bootstrapada por `GET /api/auth/me`
- em caso de `401`, o frontend tenta `POST /api/auth/refresh`
- se o refresh falhar, a sessão é encerrada

### Rate limit e auditoria

- tabela `login_attempts`
- tabela `audit_events`
- tela `Telemática > Auditoria de Segurança`
- alertas visuais para eventos recentes `FAILED` e `DENIED`

### Headers de segurança

O backend adiciona:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## Operação local

Scripts principais:

- [start-backend.ps1](/c:/Users/Telematica/Documents/erp5bprv/scripts/start-backend.ps1)
- [start-frontend.ps1](/c:/Users/Telematica/Documents/erp5bprv/scripts/start-frontend.ps1)
- [start-erp.ps1](/c:/Users/Telematica/Documents/erp5bprv/scripts/start-erp.ps1)
- [check-erp.ps1](/c:/Users/Telematica/Documents/erp5bprv/scripts/check-erp.ps1)

Endereços locais:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`
- health: `http://localhost:8000/health`

## Resumo executivo

Se um desenvolvedor entrar no projeto rapidamente, o resumo é:

- ERP web interno militarizado
- backend em `Python + FastAPI + SQLAlchemy`
- frontend em `React + Vite`
- banco principal em `PostgreSQL`
- navegação por módulos, submódulos e hubs visuais
- forte dependência de escopo hierárquico por unidade
- autenticação endurecida com `JWT + refresh + HttpOnly cookie`
- evolução incremental com foco em preservar operação enquanto refatora
