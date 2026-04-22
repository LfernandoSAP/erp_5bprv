# Padrões do Projeto

## Convenções gerais

- código em `UTF-8`
- nomes de classes em `StudlyCase`
- métodos e variáveis em `camelCase`
- tabelas em plural e `snake_case`
- colunas descritivas e previsíveis
- arquivos Blade organizados por contexto funcional

## Padrões de backend

- controllers por área:
  - `App\\Http\\Controllers\\Public`
  - `App\\Http\\Controllers\\Admin`
- validação em `App\\Http\\Requests\\Admin`
- models em `App\\Models`
- regras simples no controller apenas quando fizer sentido
- regras repetidas devem migrar para serviços futuros

## Padrões de rotas

- rotas públicas nomeadas com prefixo `public.`
- rotas administrativas nomeadas com prefixo `admin.`
- rotas administrativas protegidas por `auth`
- uso consistente de `Route::prefix()` e `Route::name()`

## Padrões de views

- layouts base em `resources/views/layouts`
- páginas públicas em `resources/views/public`
- páginas administrativas em `resources/views/admin`
- componentes Blade em `resources/views/components`

## Padrões de banco

- usar `foreignId()->constrained()` quando aplicável
- incluir `created_by` e `updated_by` nos módulos editoriais
- usar `softDeletes()` em entidades que podem exigir recuperação administrativa
- `slug` deve ser único quando representar URL pública

## Padrões de segurança

- segredos apenas em `.env`
- proteção `CSRF` habilitada
- validação server-side obrigatória
- uploads restritos a imagens válidas
- nomes de arquivos sem depender do nome original enviado pelo usuário
- áreas administrativas sempre autenticadas

## Padrões visuais

- identidade institucional com base clara
- uso forte de `preto`, `amarelo/dourado` e tons neutros
- interface responsiva
- tipografia limpa e legível
- blocos visuais com hierarquia clara

## Padrões de documentação

- cada fase relevante deve atualizar os documentos em [docs](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs)
- decisões estruturais importantes devem ser registradas antes de mudanças amplas
