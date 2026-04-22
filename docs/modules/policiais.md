# Módulo de Policiais

## Objetivo

Cadastrar e consultar policiais da estrutura do 5BPRv sem misturar esse cadastro com usuários de acesso ao sistema.

## Situação atual

O projeto agora possui:

- entidade própria de `Policial`
- cadastro de dados funcionais e pessoais
- ficha individual mais completa baseada no formulário interno
- vinculação do policial à unidade
- consulta com busca por nome, nome de guerra, CPF e RE
- painel de detalhes com todos os dados cadastrais do policial pesquisado
- cálculo visual do tempo de serviço com base na data de admissão
- edição de policial
- movimentação de policial para unidade cadastrada ou unidade externa
- histórico de movimentação de lotação do policial
- exportação em Excel e PDF nas consultas e no histórico
- exportação e impressão individual da ficha cadastral do policial em PDF
- feedback inline nas telas operacionais
- responsividade para tablet e smartphone

Arquivos principais:

- [backend/app/models/police_officer.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/police_officer.py)
- [backend/app/routes/police_officer.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/police_officer.py)
- [backend/app/schemas/police_officer.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/schemas/police_officer.py)
- [backend/app/modules/rh/service.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/modules/rh/service.py)
- [frontend/src/pages/PoliceOfficers.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PoliceOfficers.jsx)
- [frontend/src/pages/NewPoliceOfficer.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/NewPoliceOfficer.jsx)
- [frontend/src/pages/EditPoliceOfficer.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/EditPoliceOfficer.jsx)
- [frontend/src/pages/MovePoliceOfficer.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MovePoliceOfficer.jsx)
- [frontend/src/pages/PoliceOfficerMovementsList.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PoliceOfficerMovementsList.jsx)

## Campos principais

- nome completo
- nome de guerra
- posto/graduacão
- RE-DC
- data de apresentação
- data de admissão
- data de nascimento
- CPF
- RG
- naturalidade
- unidade
- OPM anterior
- motorista
- SAT PM
- filiação
- filhos
- endereço
- contatos
- associado
- seguro particular
- observação
- ciência

## Regras

- policial é uma entidade diferente de usuário do sistema
- CPF deve conter exatamente 11 dígitos
- CPF e RE devem ser únicos
- policial deve estar vinculado a uma unidade
- usuários globais consultam todas as unidades
- usuários locais consultam apenas policiais da própria unidade

## O que foi feito

- criada a entidade de policial
- criado o módulo visual de cadastro/consulta de policial
- adicionada a opção `Cadastro/Consulta de Policial` no menu principal
- ampliado o formulário para um padrão mais completo de ficha individual
- adicionada consulta detalhada dos dados do policial
- estruturado o endereço com apoio de busca automatizada por CEP
- adicionadas as ações de editar e movimentar o policial na consulta
- bloqueado o envio prematuro do formulário e reforçada a validação dos campos obrigatórios
- transformado o fluxo de movimentação em uma ação própria, com observação opcional e registro mais completo no histórico
- criada a tela de edição de policial
- adicionada exportação do resultado filtrado em Excel e PDF na consulta e no histórico
- adicionada ficha cadastral individual do policial em PDF, com impressão e download
- substituídos `alert`s por mensagens inline nos fluxos principais
- ajustado o módulo para leitura mais confortável em tablet e smartphone
- adicionada a seção `Material vinculado` no painel de detalhes do policial, consolidando materiais comuns e material bélico atualmente cautelados ao policial

## O que falta

- expandir a ligação entre cautela e histórico de materiais por policial, quando necessário
- evoluir regras futuras de workflow interno do P1, caso o módulo ganhe novas telas setoriais
