# Plano da Fase 1

## Objetivo da fase

Entregar a base funcional do portal institucional, com estrutura pronta para evolução segura nas próximas fases.

## Entregas previstas

- estrutura inicial do projeto `Laravel`
- autenticação simples
- layouts mestre público e administrativo
- migrations principais
- models principais
- rotas iniciais
- `HomeController` público
- `DashboardController` administrativo
- home pública estática com conteúdo mockado
- tela de login
- dashboard administrativo simples

## Ordem de execução

### Bloco 1

- definir árvore inicial de diretórios
- registrar comandos de instalação
- registrar configuração recomendada

### Bloco 2

- bootstrap do projeto `Laravel`
- instalação do `Breeze`
- ajuste do `Bootstrap 5`
- organização de controllers e views

### Bloco 3

- criação das migrations principais
- criação dos models e relacionamentos iniciais
- criação das rotas web base

### Bloco 4

- criação do layout público
- criação do layout administrativo
- implementação da home pública inicial
- implementação do dashboard administrativo

## Critérios de pronto da fase

- aplicação sobe localmente
- login funciona
- `/` carrega layout institucional
- `/admin` ou dashboard autenticado responde corretamente
- migrations executam sem erro
- estrutura fica clara para crescimento futuro

## Fora do escopo nesta fase

- CRUD completo de notícias
- CRUD de banners
- CRUD de páginas institucionais
- upload real de imagens
- integração total da home com banco de dados

Esses itens entram nas fases seguintes.
