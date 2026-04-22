# Checklist de Homologação

## Antes da publicação

- `php artisan test` executado com sucesso
- `npm run build` executado com sucesso
- `.env` local não será enviado ao servidor
- `APP_DEBUG=false` previsto para produção
- dados reais de banco separados do código

## No servidor

- `.env` criado manualmente
- `APP_KEY` gerada no servidor
- conexão com MySQL validada
- migrations aplicadas
- seeders aplicados quando necessário
- link de storage criado
- cache de configuração e rotas gerado

## Validação funcional

- portal público abre
- login administrativo funciona
- dashboard abre
- módulo de notícias funciona
- módulo de banners funciona
- módulo de páginas funciona
- módulo de galerias funciona
- módulo de configurações funciona
- módulo de usuários funciona

## Segurança mínima

- `APP_DEBUG=false`
- `.env` fora de versionamento
- credenciais reais não expostas
- rotas administrativas protegidas por autenticação
- módulos sensíveis restritos a `admin`

## Encerramento

- registrar URL final do portal
- registrar URL final do admin
- registrar usuário administrador inicial
- guardar procedimento de rollback e contato técnico responsável
