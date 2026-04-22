# Padroes de Backend

## Stack

- `FastAPI`
- `SQLAlchemy 2`
- `Pydantic 2`

## Arquivos-base

- [backend/app/main.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/main.py)
- [backend/app/routes](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes)
- [backend/app/modules](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules)

## Organizacao esperada

- `routes`: exposicao HTTP
- `schemas`: contratos de entrada e saida
- `models`: persistencia
- `modules/*/service.py`: regras de negocio

## Regras de implementacao

- validar escopo por unidade sempre que o modulo exigir
- validar permissao por modulo no backend
- preferir mensagens claras e consistentes
- manter compatibilidade com o padrao ja usado no projeto
- preservar UTF-8 e saneamento defensivo onde ja existir legado

## Cuidados criticos

- nao quebrar regras de seguranca e autenticacao
- nao expor recursos sem validacao de escopo
- nao duplicar logica que ja exista em servicos centrais
- nao criar excecoes visuais/funcionais entre modulos semelhantes

## Checklist do agente backend

- model, schema e rota seguem o padrao existente
- regras de negocio ficaram no service
- mensagens de erro ficaram legiveis
- escopo por unidade foi respeitado
- autenticacao e autorizacao foram preservadas
- `py_compile` ou validacao equivalente passou
