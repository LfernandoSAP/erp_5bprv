# Módulo de Frota

## Objetivo

Organizar a estrutura de frota do ERP de forma modular, com submenu próprio na sidebar e espaço para evolução operacional.

## Telas

- `Frota`
- `Cadastro de Viaturas`
- `Controle Geral de Viaturas`

## Campos atuais em Cadastro de Viaturas

- marca da viatura
- modelo da viatura
- ano
- prefixo da viatura
- detentor
- vigência do contrato
- KM atual
- data do KM atual
- data da última revisão
- KM da última revisão

## Regra atual

- o submenu de frota segue a nova estrutura modular da sidebar
- o card `Motocicletas` foi removido da vitrine principal
- `Viaturas 04 Rodas` foi renomeado para `Cadastro de Viaturas`
- em `Cadastro de Viaturas`, o campo `Detentor` aceita:
  - `DER`
  - `PMESP`
  - `CONCESSIONÁRIA`
  - `OUTROS`
- quando o detentor exigir complemento, o sistema abre campo para digitação

## Permissões

- a frota respeita o escopo por unidade nas consultas e movimentações
- a estrutura continua preparada para permissão mais fina por módulo futuramente

## O que foi feito

- criado módulo pai `Frota` com submenu expansível
- removido o subitem `Caminhões`
- removido o card de `Motocicletas` da vitrine principal
- renomeado `Viaturas 04 Rodas` para `Cadastro de Viaturas`
- criada a tela principal de `Cadastro de Viaturas`
- criada tabela do submódulo com base na planilha operacional de frota
- conectado o submódulo ao backend para salvar e listar registros reais
- adicionadas ações de editar, inativar e reativar
- adicionada busca por marca, modelo, prefixo e detentor
- adicionada a exibição da unidade com leitura hierárquica na listagem da frota
- adicionado vínculo opcional de policial responsável na frota
- adicionada tela de movimentação da frota, com origem travada e destino editável
- adicionada tela de histórico de movimentações da frota
- criado o card `Controle Geral de Viaturas`, com cadastro próprio para dados operacionais como prefixo, placa, combustível, KM atual, situação, RENAVAM, chassi, cor, anos da viatura e condutor fixo
- adicionados filtros por unidade dentro do escopo visível do usuário
- adicionada exportação em `Excel` e `PDF` nas consultas e no histórico da frota
- os relatórios da frota usam o resultado filtrado da tela e levam contexto de busca e escopo aplicado
- os textos de botões e o feedback visual foram padronizados com o restante da aplicação
- as telas do módulo foram ajustadas para uso melhor em tablet e smartphone

## Scripts operacionais

Para teste local e reinício controlado, o projeto também conta com:

- `scripts/start-backend.ps1`
- `scripts/start-frontend.ps1`
- `scripts/stop-erp.ps1`
- `scripts/status-erp.ps1`

## O que falta

- especializar campos e regras de negócio por categoria quando necessário
- adicionar filtros avançados no histórico da frota, se necessário
