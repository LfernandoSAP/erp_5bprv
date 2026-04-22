# Checklist de Deploy e Entrega

## Backend

- revisar `.env`
- validar conexao com banco
- subir aplicacao com `uvicorn`
- validar autenticacao
- validar rotas criticas

## Frontend

- instalar dependencias
- rodar `npm run build`
- validar navegacao principal
- validar modulos criticos

## Seguranca

- validar cookies `HttpOnly`
- validar refresh token
- validar trilha de auditoria
- validar perfis e escopo por unidade

## Qualidade

- conferir se nao ha textos com mojibake
- conferir se cards e botoes seguem o padrao visual
- conferir se exportacoes principais continuam funcionando

## Checklist comercial/tecnico antes de entregar para terceiro

- entregar `HANDOVER-TECNICO.md`
- entregar documentacao de arquitetura
- entregar mapa de modulos
- entregar regras de negocio por dominio
- informar riscos conhecidos e proximos passos
