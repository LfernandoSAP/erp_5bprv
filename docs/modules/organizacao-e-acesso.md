# Módulo de Organização e Acesso

## Objetivo

Definir como o ERP representa a hierarquia institucional, os setores internos e as regras de visibilidade por unidade, perfil e módulo.

## Situação atual

O projeto já trabalha com:

- hierarquia de unidades
- vínculo de usuário à unidade
- setor principal do usuário
- acessos adicionais por módulo
- escopo por unidade no backend
- leitura contextual do usuário autenticado no frontend
- controle progressivo de visibilidade por módulo

## Arquivos principais

- [backend/app/models/unit.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/unit.py)
- [backend/app/models/sector.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/sector.py)
- [backend/app/models/user.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/user.py)
- [backend/app/models/user_module_access.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/user_module_access.py)
- [backend/app/utils/scope.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/utils/scope.py)
- [frontend/src/config/navigation.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/config/navigation.js)
- [frontend/src/utils/authAccess.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/utils/authAccess.js)

## Estrutura institucional atual

### Unidades

Hierarquia prevista:

- `5BPRv-EM`
- `1Cia`
  - `1Pel`
  - `2Pel`
- `2Cia`
  - `1Pel`
  - `2Pel`
- `3Cia`
  - `1Pel`
  - `2Pel`
- `4Cia`
  - `1Pel`
  - `2Pel`

### Setores principais

No `EM`:

- `P1`
- `P2`
- `P3`
- `P4`
- `P5`
- `UGE/Convênios`
- `PJMD`
- `StCor`
- `Telemática`

Nas `CIA/Pelotão`:

- `P1`
- `P3`
- `P4`
- `P5`
- `UGE/Convênios`
- `PJMD`
- `Sala de Rádio - PDR`
- `Telemática`

## Regras atuais

- toda entidade operacional relevante deve respeitar escopo por unidade
- o backend é o ponto final de controle de acesso
- o frontend pode esconder opções, mas não substitui a validação da API
- `module_access_codes` complementam o setor principal do usuário
- administradores continuam com visão ampliada conforme perfil e escopo

## O que foi feito

- analisada a base atual de organização e acesso
- registrada a evolução alvo de `Unit`, `User`, `Sector` e acessos por módulo
- criada base reutilizável de escopo em `backend/app/utils/scope.py`
- rotas principais passaram a reutilizar a mesma regra central de unidade
- modelo `Unit` foi expandido com campos de organização e hierarquia
- criada a entidade `Sector`
- adicionados `sector_id` e `role_code` em `User`
- criada a estrutura de `user_module_access` no backend
- criado backfill automático para perfis e setores padrão
- frontend de usuários foi conectado a setor e perfil
- frontend passou a representar `module_access_codes` com checkboxes
- a sidebar passou a respeitar melhor contexto institucional, setor e acessos adicionais
- o token de login passou a incluir contexto útil para saudação e escopo visual

## O que falta

- evoluir o uso de perfis de forma ainda mais centralizada
- remover dependências legadas quando a transição estiver concluída
- ampliar o detalhamento de autorização por módulo no backend
- consolidar totalmente a leitura institucional entre token, menu e API
