# Fluxos do Sistema

## Padrao de descricao

Sempre documentar os fluxos neste formato:

- entrada
- validacoes
- processamento
- saida

## Login

### Entrada

- CPF
- senha

### Validacoes

- CPF deve existir
- senha deve existir
- usuario deve estar ativo
- credenciais devem ser validas

### Processamento

- backend localiza o usuario
- backend verifica a senha
- backend gera token JWT
- frontend salva token no `localStorage`

### Saida

- usuario autenticado no sistema

## Criar item

### Entrada

- dados do item
- usuario autenticado

### Validacoes

- usuario deve estar autenticado
- unidade do usuario deve ser considerada
- numero de serie nao pode duplicar quando aplicavel

### Processamento

- frontend envia dados para a API
- backend cria o item vinculado a unidade correta
- backend grava log de criacao

### Saida

- item criado e retornado para a interface

## Editar item

### Entrada

- identificador do item
- novos dados
- usuario autenticado

### Validacoes

- item deve existir
- usuario deve ter permissao para a unidade do item

### Processamento

- backend atualiza os campos permitidos
- backend registra log da edicao

### Saida

- item atualizado

## Movimentar item

### Entrada

- item selecionado
- dados da movimentacao
- usuario autenticado

### Validacoes

- item deve existir
- usuario deve ter permissao sobre o item
- unidade de origem e destino devem existir
- setor de origem e destino devem respeitar a unidade escolhida

### Processamento

- frontend apresenta origem apenas para conferencia, sem permitir edicao manual
- backend grava a movimentacao
- backend atualiza unidade, setor, localizacao e status do item conforme o tipo
- backend retorna a movimentacao com nomes legiveis de unidade e setor
- backend registra historico

### Saida

- movimentacao concluida

## Inativar item

### Entrada

- identificador do item
- usuario autenticado

### Validacoes

- item deve existir
- usuario deve ter permissao para o item

### Processamento

- item recebe `is_active = false`
- item recebe `status = BAIXADO`
- backend registra log de inativacao

### Saida

- item deixa de aparecer na listagem principal

## Restaurar item

### Entrada

- identificador do item
- usuario autenticado

### Validacoes

- item deve existir
- usuario deve ter permissao para o item

### Processamento

- item recebe `is_active = true`
- item recebe `status = EM_ESTOQUE`
- backend registra log de restauracao

### Saida

- item volta para a listagem principal

## Criar usuario

### Entrada

- dados do novo usuario
- usuario autenticado

### Validacoes

- somente perfil autorizado pode criar usuarios
- unidade informada deve existir
- CPF nao pode estar duplicado

### Processamento

- backend gera hash da senha
- backend cria usuario

### Saida

- usuario criado

## Consultar dashboard

### Entrada

- usuario autenticado

### Validacoes

- usuario deve estar autenticado

### Processamento

- backend calcula totais
- backend aplica escopo por unidade
- backend retorna resumo

### Saida

- dashboard com indicadores

## Cadastrar material belico

### Entrada

- dados do material belico
- usuario autenticado

### Validacoes

- usuario deve ter permissao na unidade
- categoria deve ser valida
- dados obrigatorios devem existir

### Processamento

- backend cria registro vinculado a unidade

### Saida

- material belico cadastrado

## Gerar relatorio

### Estado atual

Ainda nao existe fluxo formal de relatorios implementado no projeto atual.

### Direcao sugerida

#### Entrada

- filtros
- periodo
- unidade
- tipo de relatorio

#### Validacoes

- usuario deve ter permissao sobre o escopo consultado

#### Processamento

- backend consolida dados conforme filtros

#### Saida

- dados estruturados para exibicao ou exportacao
