# Módulo de Usuários

## Objetivo

Gerenciar usuários do sistema e controlar quem pode acessar o ERP.

## Situação atual

O projeto já possui:

- login por CPF e senha
- criação de usuários por administrador
- vinculação do usuário a uma unidade
- perfis por `role_code`
- setor principal e acessos adicionais por módulo
- consulta sob demanda com exportação em Excel e PDF
- feedback inline nas telas de login, consulta, cadastro e edição
- responsividade para tablet e smartphone

## Arquivos principais

- [backend/app/routes/auth.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/auth.py)
- [backend/app/routes/user.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/user.py)
- [backend/app/models/user.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/user.py)
- [frontend/src/pages/Login.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Login.jsx)
- [frontend/src/pages/Users.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Users.jsx)
- [frontend/src/pages/NewUser.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/NewUser.jsx)
- [frontend/src/pages/EditUser.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/EditUser.jsx)

## Telas

- login
- listagem de usuários
- novo usuário
- editar usuário

## Campos principais

- CPF
- nome
- RE
- posto/graduação
- unidade
- setor principal
- acessos adicionais por módulo
- senha
- perfil
- ativo

## Regras

- usuário precisa estar ativo para acessar
- CPF deve ser único
- CPF deve conter exatamente 11 dígitos
- apenas administrador pode criar usuários
- usuário não administrador não deve administrar outras unidades
- exclusão de usuário é lógica por inativação
- reativação de usuário reutiliza o mesmo registro
- usuário não pode excluir a si mesmo
- setor principal representa a lotação principal do usuário
- módulos adicionais podem ser liberados por `module_access_codes`

## O que foi feito

- implementado login autenticado por token
- implementada criação de usuário por admin
- corrigido o formulário de novo usuário para carregar unidades reais da API
- ajustada a tela para consultar usuários sob demanda
- adicionada exclusão lógica de usuários
- adicionada edição de usuários com senha opcional
- adicionada reativação de usuários inativos
- melhorado o visual da tela de novo usuário
- criado um padrão visual compartilhado para as telas principais do sistema
- integrado o cadastro e a listagem com `sector_id` e `role_code`
- adicionada validação de CPF com exatamente 11 dígitos no cadastro
- cadastro e edição passaram a exibir checkboxes de módulo para gravar `module_access_codes`
- consulta de usuários passou a mostrar os módulos liberados por usuário
- substituídos `alert`s por mensagens inline nas telas de usuários, novo usuário, edição e login
- adicionada exportação do resultado filtrado em Excel e PDF
- ajustada a experiência para telas menores com layout responsivo

## O que falta

- definir regras mais detalhadas por perfil
- expandir a auditoria de ações administrativas
- consolidar cada vez mais a relação entre setor principal, acessos adicionais e autorização efetiva
