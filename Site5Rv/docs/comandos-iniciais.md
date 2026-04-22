# Comandos Iniciais

## Pré-requisitos

O ambiente precisa ter:

- `PHP 8.3+`
- `Composer`
- `Node.js` e `npm`
- acesso ao banco `MySQL`

## Verificação do ambiente

```powershell
php -v
composer --version
npm.cmd --version
```

## Instalação prevista do projeto

Executar na raiz [Site5Rv](C:/Users/Telematica/Documents/erp5bprv/Site5Rv):

```powershell
composer create-project laravel/laravel .
composer require laravel/breeze --dev
php artisan breeze:install blade
npm.cmd install
npm.cmd install bootstrap @popperjs/core sass
php artisan migrate
php artisan storage:link
npm.cmd run build
```

## Configuração inicial recomendada

Após a instalação do `Laravel`:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Configurar no `.env`:

- `APP_NAME`
- `APP_ENV`
- `APP_URL`
- `DB_CONNECTION=mysql`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

## Observação

Enquanto `PHP` e `Composer` não estiverem acessíveis no ambiente, a estrutura física do projeto já pode ser mantida e versionada, mas a aplicação ainda não poderá ser executada.
