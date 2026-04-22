# Módulo de Setores

## Objetivo

Organizar os setores internos de cada unidade e permitir que usuários, materiais e fluxos sejam vinculados ao setor correto.

## Situação atual

O projeto já possui:

- entidade `Sector` no backend
- carga automatizada dos setores base do `5BPRv - EM` e das CIAs
- listagem, cadastro, edição, inativação e reativação de setores
- tela de setores integrada ao menu principal
- exibição de unidade com label hierárquica nas consultas
- consulta sob demanda com exportação em Excel e PDF
- feedback inline nas operações principais
- responsividade para tablet e smartphone

## Arquivos principais

- [backend/app/models/sector.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/sector.py)
- [backend/app/routes/sector.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/sector.py)
- [backend/app/schemas/sector.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/schemas/sector.py)
- [frontend/src/pages/Sectors.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Sectors.jsx)

## Telas

- consulta de setores
- cadastro de setor
- edição de setor

## Campos principais

- unidade
- nome
- código
- status

## Regras

- cada setor pertence a uma unidade
- unidade global pode gerenciar setores de todas as unidades
- admin local pode gerenciar apenas setores da própria unidade
- usuário sem perfil administrativo pode apenas consultar os setores visíveis no seu escopo
- inativação e reativação usam o mesmo registro
- não pode haver dois setores com o mesmo nome na mesma unidade

## O que foi feito

- criado o CRUD básico de setores no backend
- criada a tela de setores no frontend
- integrado o módulo ao menu principal
- alinhada a exibição de unidade da tabela com a hierarquia do ERP
- adicionada exportação do resultado filtrado em Excel e PDF
- substituídos `alert`s por mensagens inline nos fluxos principais
- ajustado o layout para leitura e uso melhores em telas menores

## O que falta

- relacionar setores a outros módulos com ainda mais profundidade
- criar filtros avançados por unidade na tela, se necessário
- consolidar cada vez mais os serviços compartilhados no frontend
