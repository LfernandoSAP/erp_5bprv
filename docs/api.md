# API do Projeto

## Visão geral

O frontend acessa o backend usando o prefixo `/api`.

No ambiente de desenvolvimento, o proxy do Vite encaminha essas chamadas para:

- `http://127.0.0.1:8000`

Arquivo relacionado:

- [vite.config.js](C:/Users/Telematica/Documents/erp5bprv/frontend/vite.config.js)

## Autenticação

Autenticação atual baseada em `Bearer Token` com `JWT`.

Fluxo:

1. frontend envia CPF e senha
2. backend valida usuário
3. backend devolve `access_token`
4. frontend salva token no `localStorage`
5. chamadas seguintes enviam `Authorization: Bearer <token>`

Arquivos relacionados:

- [frontend/src/services/api.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/services/api.js)
- [backend/app/routes/auth.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/auth.py)
- [backend/app/core/auth.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/core/auth.py)
- [backend/app/core/security.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/core/security.py)

## Endpoints atuais

### Status da API

#### `GET /`

Resposta esperada:

```json
{ "status": "online" }
```

#### `GET /health`

Resposta esperada:

```json
{ "status": "healthy" }
```

### Autenticação

#### `POST /auth/login`

Entrada:

```json
{
  "cpf": "string",
  "password": "string"
}
```

Saída esperada:

```json
{
  "access_token": "jwt",
  "token_type": "bearer"
}
```

#### `POST /auth/bootstrap-admin`

Uso atual:

- cria o primeiro administrador quando ainda não existe usuário cadastrado

Observação:

- este endpoint é sensível e deve ser mantido com bastante cuidado

### Dashboard

#### `GET /dashboard/summary`

Retorna:

- total de itens
- total de itens ativos
- total de itens inativos
- agregação por status
- agregação por categoria
- agregação por unidade

### Itens

#### `GET /items/`

Lista itens visíveis para o usuário autenticado.

Parametros:

- `include_inactive` opcional

#### `GET /items/search?q=...`

Busca itens por texto.

#### `POST /items/`

Cria item.

Regra atual:

- item pode receber `unit_id` e `sector_id`
- `sector_id` deve pertencer a unidade escolhida

#### `GET /items/{item_id}`

Consulta item por ID.

#### `PUT /items/{item_id}`

Atualiza item.

Regra atual:

- permite atualizar unidade e setor
- ao trocar a unidade sem informar novo setor, o setor do item é limpo
- `sector_id` deve pertencer a unidade escolhida

#### `DELETE /items/{item_id}`

Inativa item.

#### `PUT /items/{item_id}/restore`

Restaura item inativado.

### Movimentações

#### `GET /movements/`

Lista movimentações visíveis no escopo do usuário.

Campos legíveis retornados:

- `item_name`
- `user_name`
- `from_unit_label`
- `to_unit_label`
- `from_sector_name`
- `to_sector_name`

#### `POST /movements/`

Cria movimentação.

Regra atual:

- aceita unidade e setor de origem e destino
- setores devem pertencer a unidade informada
- atualiza unidade, setor, localizacao e status do item conforme o tipo

### Logs

#### `GET /logs/`

Lista logs no escopo do usuário autenticado.

Retorna:

- IDs do log, item e usuário
- nome do item
- nome do usuário
- acao
- detalhes
- data/hora

### Usuários

#### `GET /users/`

Lista usuários.

Regra atual:

- unidade com visão global lista todos
- admin local lista usuários da própria unidade
- usuário comum recebe apenas o próprio usuário
- aceita `q` opcional para pesquisar por CPF ou nome

#### `POST /users/`

Cria usuário.

Regra atual:

- apenas administrador autorizado pode criar
- admin local só pode criar usuário para a própria unidade

#### `GET /users/{user_id}`

Consulta um usuário específico dentro do escopo do usuário autenticado.

Regra atual:

- unidade com visão global pode consultar qualquer usuário
- admin local consulta usuários da própria unidade
- usuário comum consulta apenas o próprio usuário

#### `PUT /users/{user_id}`

Atualiza usuário.

Regra atual:

- administrador autorizado pode editar usuários da unidade permitida
- usuário comum pode atualizar apenas os próprios dados básicos e senha
- `ADMIN_GLOBAL` só pode existir na unidade principal
- `sector_id` deve pertencer a unidade escolhida

#### `DELETE /users/{user_id}`

Inativa usuário.

Regra atual:

- apenas administrador autorizado pode excluir
- admin local só pode excluir usuário da própria unidade
- o próprio usuário autenticado não pode se autoexcluir

#### `PUT /users/{user_id}/restore`

Reativa usuário.

Regra atual:

- apenas administrador autorizado pode reativar
- admin local só pode reativar usuário da própria unidade

### Policiais

#### `GET /police-officers/`

Lista policiais visíveis no escopo do usuário autenticado.

Regra atual:

- unidade com visão global lista todos
- unidade local lista apenas policiais da própria unidade
- aceita `q` e `include_inactive`

#### `POST /police-officers/`

Cadastra policial.

Regra atual:

- apenas administrador autorizado pode cadastrar
- CPF deve ter 11 dígitos
- CPF e RE devem ser únicos

#### `GET /police-officers/{officer_id}`

Consulta um policial dentro do escopo permitido.

#### `PUT /police-officers/{officer_id}`

Atualiza um policial dentro do escopo permitido.

Uso atual:

- permite editar os dados cadastrais
- permite movimentar para outra unidade cadastrada
- permite registrar `external_unit_name` quando o destino for uma unidade externa

#### `DELETE /police-officers/{officer_id}`

Inativa um policial.

#### `PUT /police-officers/{officer_id}/restore`

Reativa um policial.

### Setores

#### `GET /sectors/`

Lista setores no escopo do usuário autenticado.

Regra atual:

- unidade com visão global lista todos
- admin local e usuário comum veem apenas setores da própria unidade
- aceita `q`, `unit_id` e `include_inactive`

#### `GET /sectors/{sector_id}`

Consulta um setor especifico no escopo permitido.

#### `POST /sectors/`

Cria setor.

Regra atual:

- apenas administrador autorizado pode criar
- admin local só pode criar setor na própria unidade

#### `PUT /sectors/{sector_id}`

Atualiza setor.

Regra atual:

- apenas administrador autorizado pode editar
- não permite duplicar nome de setor na mesma unidade

#### `DELETE /sectors/{sector_id}`

Inativa setor.

#### `PUT /sectors/{sector_id}/restore`

Reativa setor.

### Material bélico

#### `GET /material-belico/`

Lista materiais bélicos por escopo do usuário.

Parametros:

- `category` opcional
- `include_inactive` opcional

Campos legíveis retornados:

- `unit_label`

#### `POST /material-belico/`

Cria material bélico.

Campos importantes nesta etapa:

- `unit_id`
- `police_officer_id` opcional
- `category`
- campos específicos por categoria

#### `GET /material-belico/controle-geral`

Lista controle geral de material bélico.

#### `POST /material-belico/controle-geral`

Cria registro de controle geral.

#### `GET /material-belico/{item_id}`

Consulta por id.

#### `PUT /material-belico/{item_id}`

Atualiza registro.

#### `DELETE /material-belico/{item_id}`

Inativa registro.

#### `POST /material-belico/{item_id}/movements`

Movimenta material bélico.

Campos aceitos:

- `movement_type`
- `to_unit_id`
- `to_police_officer_id`
- `details`

### Unidades

#### `GET /units/`

Lista unidades cadastradas.

#### `GET /units/tree/root`

Retorna a árvore hierárquica de unidades.

#### `POST /units/`

Cria unidade.

Campos aceitos nesta etapa:

- `name`
- `code`
- `type`
- `parent_unit_id`
- `parent_id` apenas por compatibilidade
- `can_view_all`
- `is_active`

Uso atual no frontend:

- consulta da árvore de unidades
- cadastro simples de novas unidades para usuários com visão global

Padrao atual de tipos:

- `batalhao`
- `cia`
- `pelotão`

### Frota

#### `GET /fleet/vehicles/`

Lista viaturas da frota dentro do escopo de unidade do usuário autenticado.

Query params aceitos:

- `q`
- `include_inactive`
- `category`

Campos retornados relevantes nesta etapa:

- `unit_name`
- `unit_label`
- `police_officer_re`
- `police_officer_name`

#### `POST /fleet/vehicles/`

Cria registro de viatura.

Campos aceitos nesta etapa:

- `unit_id`
- `police_officer_id`
- `category`
- `brand`
- `model`
- `year`
- `prefix`
- `holder`
- `is_active`

Uso atual no frontend:

- submódulo `Frota > Cadastro de Viaturas`

#### `PUT /fleet/vehicles/{vehicle_id}`

Atualiza os dados principais da viatura.

#### `GET /fleet/vehicles/{vehicle_id}`

Retorna um registro específico da frota dentro do escopo do usuário autenticado.

#### `POST /fleet/vehicles/{vehicle_id}/movements`

Registra movimentação do item da frota, com unidade de origem travada, unidade de destino editável e policial responsável opcional.

#### `GET /fleet/vehicles/movements/history`

Lista o histórico de movimentações da frota dentro do escopo do usuário autenticado.

#### `DELETE /fleet/vehicles/{vehicle_id}`

Inativa logicamente a viatura.

#### `PUT /fleet/vehicles/{vehicle_id}/restore`

Reativa viatura inativada.

## Regras técnicas atuais da API

- autenticação por token
- proteção no backend
- filtro por unidade em rotas sensíveis
- logs de ação em parte do módulo de itens
- escopo de unidade começou a ser centralizado em `backend/app/utils/scope.py`

## Ajustes implementados nesta etapa

- centralização inicial das regras de escopo por unidade
- reutilização dessa regra em `items`, `material-belico`, `movements` e `units`
- correção do resumo `by_unit` no dashboard para respeitar o escopo do usuário
- evolução controlada do modelo `Unit` com `parent_unit_id`, `code`, `type`, `can_view_all` e `is_active`
- migração leve no startup para adicionar colunas faltantes na tabela `units`
- ajuste de `users`, `logs` e `movements` para respeitar melhor o escopo de unidade
- carga automática das unidades base do 5BPRv no startup da API
- evolução da árvore de unidades para batalhão > companhias > pelotões
- adicionada API de consulta individual e edição de usuários
- adicionada API de reativação de usuários inativos
- adicionada API completa de setores com CRUD básico e escopo por unidade
- integrada a API de itens com `sector_id`
- evoluída a API de movimentações para unidade e setor de origem e destino
- melhorada a consulta de logs com nomes de item e usuário
- adicionada API inicial de frota, hoje usada pelo submódulo `Cadastro de Viaturas`

## Melhorias futuras recomendadas

- documentar payloads completos de cada schema
- padronizar respostas de erro
- centralizar autorizacao por perfil
- adicionar versao de API se houver crescimento grande
