# Handover Tecnico - ERP 5BPRv

## Objetivo

Este documento serve como material de transferencia tecnica do ERP 5BPRv para:

- novo desenvolvedor individual
- nova equipe tecnica
- parceiro de manutencao
- potencial comprador tecnico do projeto

Ele complementa a documentacao ja existente e resume o que precisa ser entendido para operar, evoluir e sustentar o sistema.

## Resumo executivo

O ERP 5BPRv e um sistema web interno voltado a operacao administrativa e operacional do policiamento rodoviario, com foco em:

- gestao de usuarios, perfis e auditoria
- estrutura hierarquica de unidades e setores
- cadastro e movimentacao de policiais
- logistica de materiais, material belico, frota e TPD/Talonario
- estatistica operacional
- fluxos proprios de RH como quinquenio, LP, LSV e rancho

## Stack atual

### Backend

- `Python`
- `FastAPI`
- `SQLAlchemy 2`
- `Pydantic 2`
- `Uvicorn`

### Frontend

- `React 19`
- `Vite`
- `MUI`

### Banco

- producao alvo: `PostgreSQL`
- compatibilidade de desenvolvimento: `SQLite`

## Estrutura macro

### Backend

- [backend/app/main.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/main.py)
- [backend/app/routes](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes)
- [backend/app/modules](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules)
- [backend/app/models](/c:/Users/Telematica/Documents/erp5bprv/backend/app/models)
- [backend/app/schemas](/c:/Users/Telematica/Documents/erp5bprv/backend/app/schemas)

### Frontend

- [frontend/src/App.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/App.jsx)
- [frontend/src/config/navigation.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/config/navigation.js)
- [frontend/src/pages](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages)
- [frontend/src/components](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/components)
- [frontend/src/services](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/services)

## Modulos principais hoje

### P1 - Recursos Humanos

- Cadastro / Consulta de Policial
- Controle de Efetivo
- Controle de Bloco Quinquenio
- Controle de Bloco Lic Premio
- Controle de Fruicao LSV
- Controle de Fruicao Lic Premio
- Controle de Bloco MVM

### Assuntos Gerais

- Previsao de Rancho

### P3 - Estatistica

- Controle de Velocidade Noturno
- Planilha de Acidentes de Viatura - PAAVI

### P4 - Logistica / Frota

- Materiais
- Estoque / Manutencao
- TPD / Talonario
- Material Belico
- Processos de Armas
- Romaneio
- Frota
- Controle de COPs
- Mapa Forca de Viaturas

### Telematica / Administracao

- usuarios
- unidades
- setores
- auditoria de seguranca
- controle de acesso por modulo

## Regras criticas de negocio

### RH

- `Quinquenio`: calculo por ciclos de `1825 dias`, com impacto de interrupcoes
- `LP`: blocos e periodos independentes por policial
- `LSV`: fluxo semelhante a LP, mas com regras proprias de fruicao
- `Rancho`: grade mensal por dia util, com `Cafe` e `Almoco`

### Logistica

- escopo por unidade e obrigatorio
- varios fluxos dependem de setor, unidade e perfil do usuario
- `Mapa Forca` complementa a frota, nao substitui o cadastro-base
- `Controle de COPs` mantem historico de movimentacao

### Seguranca

- autenticacao com `JWT`, `refresh token` e cookies `HttpOnly`
- trilha de auditoria administrativa
- validacao de modulo e escopo no backend

## Pontos tecnicos que nao devem ser quebrados

- escopo hierarquico por unidade
- validacao de permissoes por modulo
- padrao visual unificado com `ModuleCard`
- saneamento UTF-8 e prevencao de mojibake
- separacao entre cadastro-base e visoes operacionais complementares

## Documentos que devem ser lidos primeiro

- [README-ARQUITETURA.md](/c:/Users/Telematica/Documents/erp5bprv/docs/README-ARQUITETURA.md)
- [decisions.md](/c:/Users/Telematica/Documents/erp5bprv/docs/decisions.md)
- [api.md](/c:/Users/Telematica/Documents/erp5bprv/docs/api.md)
- [business-rules.md](/c:/Users/Telematica/Documents/erp5bprv/docs/business-rules.md)
- [estado-atual.md](/c:/Users/Telematica/Documents/erp5bprv/docs/estado-atual.md)

## Informacoes que um comprador tecnico vai querer

- stack consolidada e maturidade do projeto
- modulos ja operacionais
- cobertura funcional por area
- arquitetura de autenticacao e seguranca
- facilidade de manutencao por organizacao de codigo
- dependencias criticas
- riscos conhecidos e debito tecnico remanescente
- clareza das regras de negocio

## Riscos e debito tecnico conhecidos

- coexistencia de compatibilidade entre `SQLite` e `PostgreSQL`
- existencia de saneamento defensivo em alguns pontos legados de texto
- parte da navegacao ainda depende de convencoes internas do projeto
- modulos grandes no frontend exigem disciplina de padronizacao

## Checklist de transicao

- subir backend localmente
- subir frontend localmente
- validar autenticacao
- validar permissoes de modulos
- revisar variaveis de ambiente
- revisar documentos em `docs/agents`
- revisar decisoes em `docs/decisions.md`
- validar build do frontend
- validar compilacao sintatica do backend

## Sugestao de pacote comercial/tecnico

Se o projeto for apresentado para venda, convem entregar junto:

- este handover tecnico
- documentacao de arquitetura
- mapa de modulos
- lista de regras criticas por dominio
- fluxo de deploy
- descricao do escopo atual e backlog sugerido

## Proximo nivel recomendado

Se quiser profissionalizar ainda mais a transferencia:

- criar diagrama ER das tabelas principais
- criar diagrama de modulos do frontend
- criar documento de deploy por ambiente
- criar inventario de endpoints por dominio
- criar playbooks de agentes e skills por area
