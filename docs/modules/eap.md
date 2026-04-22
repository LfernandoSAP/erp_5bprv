# EAP 5o BPRv

## Objetivo

Controlar turmas de EAP dentro do `P3 - Estatistica`, com o fluxo centrado no modulo e nao no policial.

## Fluxo atual

- primeiro cria-se o `Modulo EAP`
- o modulo guarda `Modulo`, `Tipo`, `Local`, periodo `EAD`, periodo `Presencial` e campo `Outros`
- depois os policiais sao incluidos nesse modulo por busca de `RE` ou nome
- ao selecionar o policial, o sistema reaproveita `Nome completo`, `Posto/Graduacao` e `Unidade`
- a tela exibe a quantidade de policiais incluidos em cada modulo

## Estrutura atual

- `EapModulo`: cabecalho da turma
- `EapModuloParticipante`: policiais vinculados ao modulo
- `EapRegistro`: mantido como estrutura legada para migracao de compatibilidade

## Arquivos principais

- `frontend/src/pages/EapPage.jsx`
- `frontend/src/services/eapService.js`
- `backend/app/routes/eap_registro.py`
- `backend/app/models/eap_modulo.py`
- `backend/app/models/eap_modulo_participante.py`
- `backend/app/db/eap_migrations.py`

## Endpoints

- `GET /api/estatistica/eap/modules`
- `GET /api/estatistica/eap/modules/{id}`
- `POST /api/estatistica/eap/modules`
- `PUT /api/estatistica/eap/modules/{id}`
- `DELETE /api/estatistica/eap/modules/{id}`
- `POST /api/estatistica/eap/modules/{id}/participantes`
- `DELETE /api/estatistica/eap/modules/{id}/participantes/{participante_id}`
