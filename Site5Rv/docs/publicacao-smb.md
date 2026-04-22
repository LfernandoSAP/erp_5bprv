# Publicação com pasta compartilhada SMB

## Quando usar

Este cenário é útil quando os arquivos do portal precisam ser publicados em uma pasta compartilhada SMB/CIFS e não existe liberdade para alterar o `DocumentRoot` do Apache.

## Estratégia

Separar a aplicação em duas camadas:

- camada privada da aplicação: projeto Laravel completo
- camada pública: conteúdo equivalente ao diretório `public/`

## Estrutura sugerida

```text
D:\portais\site5bprv-app\        -> aplicação completa
D:\portais\site5bprv-public\     -> raiz web publicada no Apache
```

## Funcionamento

1. A aplicação completa fica fora da raiz pública.
2. O Apache continua apontando para a pasta pública compartilhada.
3. O conteúdo de `Site5Rv/public/` é copiado para a pasta publicada.
4. O `index.php` publicado deve apontar para a aplicação privada real.

## Ajuste típico no `index.php` da pasta publicada

Exemplo conceitual:

```php
require 'D:/portais/site5bprv-app/vendor/autoload.php';
$app = require_once 'D:/portais/site5bprv-app/bootstrap/app.php';
```

Os caminhos exatos devem ser ajustados conforme a estrutura do servidor.

## Cuidados importantes

- Nunca publicar `app/`, `config/`, `database/`, `.env` ou `vendor/` diretamente na raiz web compartilhada.
- Garantir que `storage/app/public` continue acessível pelo portal.
- Se não for possível usar link simbólico, publicar também os arquivos públicos de upload em uma pasta servida pelo Apache.

## Recomendação prática

Se o ambiente institucional realmente impedir o uso de `DocumentRoot` em `public/`, vale preparar um procedimento de publicação com:

- cópia da aplicação privada para um diretório interno
- cópia apenas de `public/` para o compartilhamento SMB
- revisão manual do `index.php`
- teste imediato das rotas amigáveis e dos uploads
