# Módulo de Estoque

## Objetivo

Controlar materiais comuns, seu cadastro, consulta, alteração, inativação e movimentação.

## Situação atual

O projeto já possui:

- cadastro e edição de itens
- campo `modelo do material`
- busca textual
- inativação lógica e restauração
- dashboard com totais
- histórico de movimentações
- controle de responsabilidade atual por `Policial`, `Setor`, `Reserva da unidade` ou `Viatura`
- controle de `detentor`

Arquivos principais:

- [backend/app/models/item.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/item.py)
- [backend/app/routes/items.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/items.py)
- [backend/app/routes/item_movement.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/item_movement.py)
- [backend/app/modules/logistica/service.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/modules/logistica/service.py)
- [frontend/src/pages/Items.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Items.jsx)
- [frontend/src/pages/NewItem.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/NewItem.jsx)
- [frontend/src/pages/EditItem.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/EditItem.jsx)
- [frontend/src/pages/Movement.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Movement.jsx)

## Regras

- item deve estar vinculado a uma unidade
- a responsabilidade atual do item pode ser `Policial`, `Setor`, `Reserva da unidade` ou `Viatura`
- quando a responsabilidade for setorial, o setor deve pertencer à mesma unidade
- quando a responsabilidade for individual, o policial deve pertencer à mesma unidade
- quando a responsabilidade for de viatura, o veículo deve pertencer à mesma unidade
- exclusão atual é lógica, não física
- ao inativar manualmente, o status operacional passa para `BAIXADO`
- ao restaurar, o status operacional passa para `EM_ESTOQUE`

## O que foi feito

- criado fluxo básico de CRUD de itens
- criada busca por itens
- criada inativação com restauração
- adicionado o campo `modelo` no cadastro, edição e visualização do material
- adicionado o campo `detentor` no cadastro e na edição, no mesmo padrão de viaturas
- integrado `sector_id` ao cadastro, edição e listagem de materiais
- movimentação evoluída para registrar unidade e setor de origem e destino
- a movimentação passou a registrar também a responsabilidade atual do bem
- listagem e formulários agora diferenciam explicitamente `Policial`, `Setor`, `Reserva da unidade` e `Viatura`
- o histórico de movimentações mostra origem e destino de responsabilidade junto com unidade, setor e localização
- a tela de `Materiais` oferece filtro por unidade dentro do escopo permitido do usuário
- quando o usuário filtra por uma `CIA`, a consulta passa a incluir automaticamente os pelotões abaixo dela
- a consulta principal, a tela de inativos e o histórico de movimentações exportam relatórios em `Excel` e `PDF`
- os relatórios carregam o resultado filtrado da tela e incluem contexto de busca e escopo aplicado
- o módulo recebeu melhorias de responsividade para tablet e smartphone
- o fluxo principal usa feedback inline de erro e sucesso, reduzindo dependências de `alert`

## Campos complementares atuais

O módulo de materiais também já trabalha com:

- `modelo`
- `detentor`
- `detentor_outros`

## Responsabilidade atual

Os materiais comuns agora aceitam quatro tipos de responsabilidade:

- `Policial`
- `Setor`
- `Reserva da unidade`
- `Viatura`

Quando o tipo for `Viatura`, o sistema exibe o campo `Viatura vinculada` e carrega dinamicamente as viaturas ativas da `Frota`, filtradas pela unidade selecionada. O vínculo fica salvo no material e aparece tanto na consulta quanto na movimentação e no histórico.
