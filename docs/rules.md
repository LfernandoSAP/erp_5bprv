# Regras do Projeto

## Objetivo

Este arquivo define regras de organização, padrões de implementação e limites de alteração para o ERP 5BPRv.

## Princípios gerais

- fazer mudanças pequenas, seguras e progressivas
- evitar quebrar funcionalidades existentes
- reaproveitar o que já existe antes de criar algo novo
- manter separação clara entre frontend, backend e regras de negócio
- atualizar a documentação em `docs/` ao final de alterações relevantes

## Padrão de nomes

### Frontend

- componentes: `PascalCase`
- páginas: `PascalCase`
- serviços: `camelCase` com sufixo `Service`
- constantes: nomes claros e centralizados

Exemplos:

- `Login.jsx`
- `MaterialBelicoList.jsx`
- `authService.js`
- `itemCategories.js`

### Backend

- arquivos de rota com nomes objetivos por recurso
- modelos com nomes no singular
- schemas com nomes alinhados ao modelo
- funções com verbos claros

Exemplos:

- `user.py`
- `item.py`
- `material_belico.py`
- `create_item`
- `list_users`

## Como criar telas

- verificar primeiro se já existe página parecida para reaproveitamento
- manter a lógica de consumo da API fora da página sempre que possível
- concentrar chamadas HTTP em `services/`
- evitar misturar regra de negócio complexa dentro da tela
- manter navegação simples e previsível

## Como criar serviços

- um serviço deve representar um recurso ou grupo de ações relacionadas
- usar `apiFetch` como base comum de chamadas
- centralizar token, headers e tratamento padrão no serviço base
- evitar chamadas HTTP espalhadas diretamente em vários componentes

## Como tratar erros

- backend deve responder com mensagens claras e status HTTP coerentes
- frontend deve exibir mensagem amigável sem esconder o erro real
- validações de segurança devem acontecer no backend
- o frontend pode validar usabilidade, mas não substitui a validação da API

## Como organizar componentes

- componentes reutilizáveis devem ficar em `components/`
- páginas completas devem ficar em `pages/`
- constantes compartilhadas devem ficar em `constants/`
- lógica de acesso a API deve ficar em `services/`

## Como a IA deve trabalhar neste projeto

- explicar antes de alterar
- implementar em etapas pequenas
- não inventar regra de negócio sem aviso
- não substituir estrutura existente sem necessidade
- verificar primeiro se já existe código reutilizável
- manter o foco em modularidade, segurança e manutenção
- atualizar a documentação ao final de alterações importantes

## O que a IA não deve fazer

- não realizar refatorações grandes de uma vez
- não mudar fluxo sensível sem alinhamento
- não quebrar a hierarquia entre `5BPRv - EM` e as CIAs
- não confiar apenas no frontend para permissões
- não espalhar regra de negócio em vários pontos sem centralização

## Direção de arquitetura

- privilegiar `unit_id` como base de escopo de dados
- evoluir para controle por `role` e `sector`
- mover regras repetidas para camadas reutilizáveis
- separar melhor rotas, serviços e repositórios conforme o sistema crescer

## Regra prática de documentação

Sempre que algo importante for criado ou alterado, registrar:

### O que foi feito

Exemplos:

- criada tela `NewItem`
- criado serviço `itemService`
- criada regra de escopo por unidade

### Por que foi feito

Exemplos:

- evitar lógica duplicada
- centralizar categorias
- impedir acesso cruzado entre unidades

### O que falta

Exemplos:

- validar setor
- revisar permissão por perfil
- integrar com novo endpoint
