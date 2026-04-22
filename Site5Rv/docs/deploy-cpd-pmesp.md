# Deploy no CPD PMESP

## Objetivo

Consolidar um roteiro operacional para publicar o portal institucional do 5º BPRv no servidor do CPD PMESP, fora do ambiente local de desenvolvimento.

## Premissas

- O desenvolvimento ocorre localmente.
- O ambiente final usa `Apache`, `PHP 8.3+` e `MySQL`.
- O portal não será servido por `artisan serve` em produção.
- O arquivo `.env` final será criado somente no servidor de destino.

## Artefatos que devem ir para o servidor

Publicar o projeto Laravel completo, incluindo:

- `app/`
- `bootstrap/`
- `config/`
- `database/`
- `public/`
- `resources/`
- `routes/`
- `storage/`
- `vendor/`
- `composer.json`
- `composer.lock`

Se os assets já forem gerados antes da publicação, garantir também:

- `public/build/`

## Arquivos que não devem ser publicados com dados reais embutidos

- `.env`
- credenciais no código
- backups locais
- logs de desenvolvimento

## Ordem recomendada de implantação

1. Copiar os arquivos do projeto para o servidor do CPD.
2. Criar o `.env` a partir de [.env.cpd.example](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/.env.cpd.example).
3. Ajustar `APP_URL`, banco, e-mail e demais variáveis reais.
4. Executar:

```powershell
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
composer run deploy
```

5. Garantir que o Apache esteja servindo o diretório `public/`, quando possível.
6. Validar home, login, admin, uploads e rotas amigáveis.

## Build dos assets

O ideal é gerar os assets antes da publicação, em estação de build ou homologação:

```powershell
npm install
npm run build
```

Depois, publicar a pasta `public/build/` junto com o restante do projeto.

## Permissões mínimas

Garantir escrita para o usuário do Apache em:

- `storage/`
- `bootstrap/cache/`

## Verificações pós-publicação

- A home abre sem erro 500
- O login do admin funciona
- O menu administrativo carrega corretamente
- Uploads existentes abrem via `/storage/...`
- Notícias, páginas e galerias públicas abrem
- A edição de configurações e usuários funciona

## Observação operacional

Se o CPD PMESP exigir pasta compartilhada SMB ou impedir `DocumentRoot` em `public/`, seguir o procedimento complementar em [publicacao-smb.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/publicacao-smb.md).
