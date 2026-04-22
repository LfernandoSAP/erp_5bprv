# Instalação de PHP e Composer no Windows

## Objetivo

Preparar a máquina de desenvolvimento para instalar e executar o `Laravel` dentro de [Site5Rv](C:/Users/Telematica/Documents/erp5bprv/Site5Rv).

## Pré-requisitos desejados

- `PHP 8.3.x`
- `Composer` atual
- `Node.js` já funcional
- extensões PHP comuns para Laravel habilitadas

## Extensões PHP recomendadas

Confirmar que a instalação do `PHP` possui ou permite habilitar:

- `bcmath`
- `ctype`
- `curl`
- `fileinfo`
- `json`
- `mbstring`
- `openssl`
- `pdo`
- `pdo_mysql`
- `tokenizer`
- `xml`

## Caminho recomendado no Windows

Para simplificar o ambiente institucional, a sugestão é:

- instalar o `PHP` em `C:\php`
- deixar o executável principal em `C:\php\php.exe`
- adicionar `C:\php` ao `PATH`

## Passo a passo sugerido

### 1. Instalar o PHP 8.3

Baixar uma distribuição de `PHP 8.3` para Windows, extrair em `C:\php` e garantir que exista:

```text
C:\php\php.exe
```

Depois:

- copiar `php.ini-development` para `php.ini`
- habilitar as extensões exigidas pelo Laravel no `php.ini`

## 2. Ajustar o PATH

Adicionar ao `PATH` do Windows:

```text
C:\php
```

Depois fechar e abrir novamente o terminal.

## 3. Validar o PHP

Executar:

```powershell
php -v
php -m
```

Resultado esperado:

- `PHP 8.3.x`
- lista de módulos contendo `mbstring`, `openssl`, `pdo_mysql`, `fileinfo` e `xml`

## 4. Instalar o Composer

Instalar o `Composer` para Windows e garantir que o comando fique disponível no terminal.

Validar:

```powershell
composer --version
```

## 5. Validar o Node

O `Node` já foi identificado como funcional neste ambiente via:

```powershell
npm.cmd --version
```

## 6. Teste final do ambiente

Executar na ordem:

```powershell
php -v
php -m
composer --version
npm.cmd --version
```

## 7. Bootstrap do Laravel após validação

Na raiz [Site5Rv](C:/Users/Telematica/Documents/erp5bprv/Site5Rv):

```powershell
composer create-project laravel/laravel .
composer require laravel/breeze --dev
php artisan breeze:install blade
npm.cmd install
npm.cmd install bootstrap @popperjs/core sass
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
npm.cmd run build
```

## Verificação de sucesso

O ambiente estará pronto quando:

- `php` responder no terminal
- `composer` responder no terminal
- o `Laravel` for criado sem erro
- o comando `php artisan` funcionar dentro de `Site5Rv`

## Observação para ambiente institucional

Se a máquina tiver restrição de instalação global:

- o `PHP` pode ser usado em modo portátil
- o importante é que `php.exe` esteja acessível no `PATH`
- o `Composer` também precisa ficar acessível para a instalação inicial do projeto
