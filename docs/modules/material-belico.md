# Módulo de Material Bélico

## Objetivo

Controlar materiais bélicos com estrutura separada do estoque comum.

## Situação atual

O projeto já possui:

- módulo próprio no frontend
- rotas específicas no backend
- listagem por categoria
- cadastro
- listagem de controle geral
- inativação lógica
- cadastro e consulta usando a unidade real do usuário e da API
- controle de responsabilidade atual por `Policial`, `Setor` ou `Reserva da unidade`
- movimentação própria do material bélico com origem travada e destino editável

## Arquivos principais

- [backend/app/routes/material_belico.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/material_belico.py)
- [backend/app/models/material_belico.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/material_belico.py)
- [frontend/src/pages/MaterialBelico.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelico.jsx)
- [frontend/src/pages/MaterialBelicoInsert.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoInsert.jsx)
- [frontend/src/pages/MaterialBelicoEdit.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoEdit.jsx)
- [frontend/src/pages/MaterialBelicoMove.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoMove.jsx)
- [frontend/src/pages/MaterialBelicoList.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoList.jsx)
- [frontend/src/pages/MaterialBelicoControleGeralInsert.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoControleGeralInsert.jsx)
- [frontend/src/pages/MaterialBelicoControleGeralList.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MaterialBelicoControleGeralList.jsx)

## Regras

- registros devem ser vinculados a uma unidade
- quando a responsabilidade for individual, o registro deve apontar para um policial ativo da mesma unidade
- quando a responsabilidade for setorial, o registro deve apontar para um setor da mesma unidade
- quando o item estiver em reserva, não exige policial nem setor
- o filtro por unidade deve ser respeitado

## O que foi feito

- criado módulo separado de material bélico
- criadas rotas específicas para cadastro, consulta e movimentação
- removido `unit_id` fixo dos cadastros do módulo
- integrada a leitura hierárquica de unidade nas listagens
- adicionados filtros textuais nas consultas por categoria e no controle geral
- adicionada pesquisa explícita por `RE` para vincular policial responsável
- criada movimentação de material bélico com atualização de unidade e responsabilidade atual
- adicionados botões `Editar` e `Movimentar` nas consultas do módulo
- cadastro, edição, consulta e movimentação passaram a controlar a `responsabilidade atual` com as opções `Policial`, `Setor` e `Reserva da unidade`
- adicionados histórico próprio e exportação de relatórios em `Excel` e `PDF` nas consultas por categoria, no controle geral e nas movimentações
- os relatórios usam o resultado filtrado da tela e incluem contexto de busca e escopo aplicado
- as telas do módulo foram ajustadas para responsividade em tablet e smartphone
- o frontend do módulo passou a usar feedback inline para erro e sucesso no fluxo normal
- removidos cards que não faziam mais sentido operacional no hub do módulo
- adicionados campos complementares por categoria, como nome, lote, validade, quantidade, marca, modelo, tipo, sexo e tamanho

## O que falta

- revisar políticas finas de permissão
- definir validações obrigatórias por categoria
- expandir o histórico para destacar responsabilidade de origem e destino em todas as visões
