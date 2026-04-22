# Deploy em Apache

## Objetivo

Orientar a publicação do portal institucional do 5º BPRv em ambiente Apache com PHP 8.3+, MySQL atual e operação simples.

## Pré-requisitos

- PHP 8.3 com extensões usuais do Laravel habilitadas
- Composer disponível no servidor de build ou em estação de publicação
- Apache com `mod_rewrite` habilitado
- Banco MySQL acessível pela rede interna
- Permissão de escrita em `storage/` e `bootstrap/cache/`

## Estratégia recomendada

A forma ideal de publicação é apontar o `DocumentRoot` do Apache para:

```text
Site5Rv/public
```

Essa é a forma mais segura porque mantém o restante da aplicação fora da raiz web.

## Passos de publicação

1. Copiar o projeto para o servidor ou pasta de publicação.
2. Criar o `.env` a partir de [.env.cpd.example](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/.env.cpd.example) e ajustar os dados reais do ambiente.
3. Executar:

```powershell
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
composer run deploy
```

4. Garantir permissão de escrita em:

```text
storage/
bootstrap/cache/
```

5. Reiniciar o Apache, se necessário.

## Assets do front-end

Os assets podem ser gerados antes da publicação, em estação de build:

```powershell
npm install
npm run build
```

Depois, basta publicar `public/build/` junto com o projeto.

## Exemplo de VirtualHost

```apache
<VirtualHost *:80>
    ServerName portal-5bprv.local
    DocumentRoot "C:/caminho/Site5Rv/public"

    <Directory "C:/caminho/Site5Rv/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## Checklist pós-deploy

- Home abre sem erro
- Login administrativo responde
- `storage` está servindo uploads corretamente
- Rotas amigáveis funcionam sem `index.php`
- Painel administrativo autentica normalmente
- Publicações, páginas e galerias abrem sem erro 500
