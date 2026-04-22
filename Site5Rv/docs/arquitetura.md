# Arquitetura Proposta

## Visão geral

O novo portal institucional do `5º BPRv` será um monólito web tradicional em `Laravel`, com renderização server-side via `Blade`.

Essa escolha prioriza:

- simplicidade operacional
- baixo acoplamento
- facilidade de manutenção
- compatibilidade com hospedagem institucional em `Apache`
- curva de suporte menor para futuras equipes

## Camadas principais

### Aplicação web

- rotas HTTP em `routes/web.php`
- controllers separados entre área pública e administrativa
- views em `Blade`
- componentes reutilizáveis para cabeçalho, rodapé, cards e alertas

### Domínio

- models `Eloquent` por módulo
- regras de negócio mantidas em controllers enxutos e, quando necessário, classes de apoio futuras
- validação com `Form Requests`

### Persistência

- banco `MySQL`
- migrations versionadas
- seeders para usuário inicial, configurações básicas e conteúdo de exemplo

### Arquivos

- uploads via `storage/app/public`
- links públicos via `php artisan storage:link`
- organização por contexto:
  - `banners/`
  - `posts/`
  - `galleries/`
  - `pages/`

## Separação de áreas

### Área pública

Responsável por:

- home institucional
- histórico
- notícias
- galerias
- páginas institucionais

### Área administrativa

Responsável por:

- autenticação
- dashboard
- CRUDs de conteúdo
- gerenciamento de publicação

## Estrutura inicial sugerida

```text
Site5Rv/
  app/
    Http/
      Controllers/
        Admin/
        Public/
      Requests/
        Admin/
    Models/
  bootstrap/
  config/
  database/
    factories/
    migrations/
    seeders/
  docs/
  public/
  resources/
    views/
      admin/
      components/
      layouts/
      public/
  routes/
  storage/
  tests/
```

## Módulos da fase inicial

- `User`
- `Page`
- `Post`
- `Banner`
- `Gallery`
- `GalleryPhoto`
- `Setting`

## Princípios arquiteturais

- controllers curtos
- validação centralizada
- nomenclatura consistente
- uso de `softDeletes` apenas onde houver valor administrativo
- evitar lógica acoplada à view
- evitar dependências front-end pesadas nesta fase

## Deploy institucional

Como o ambiente pode não permitir alteração do `DocumentRoot`, o projeto deve prever duas estratégias:

- preferencial: apontar o `Apache` para `public/`
- alternativa institucional: publicar uma cópia controlada do conteúdo público com adaptação mínima de bootstrap, documentada separadamente na fase de deploy

Essa adaptação será detalhada depois, para não contaminar a base principal do projeto.
