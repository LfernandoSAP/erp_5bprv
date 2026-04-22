# Módulo PAAVI

## Objetivo

Registrar e consultar a `Planilha de Acidentes de Viatura`, usando o `RE-DC` do policial como ponto principal de entrada dos dados.

## Situação atual

O módulo já possui:

- busca de policial por `RE-DC` parcial ou nome
- preenchimento automático de:
  - `RE-DC`
  - `Posto/Graduação`
  - `Nome`
- cadastro da ficha `PAAVI`
- listagem com tabela no padrão operacional
- detalhe da ficha
- edição e exclusão
- exportação `Excel`
- exportação `PDF`

## Campos principais

- `Portaria de Sindicância nº`
- `R.E. MOT`
- `Nome`
- `Posto/Graduação`
- `R.E. ENC`
- `Data/Hora do fato`
- `SP`
- `KM`
- `Quantidade de policial militar`
- `Quantidade civil`
- `Observação`

## Fluxo operacional

1. digitar `RE-DC` ou nome do policial
2. selecionar o policial na base
3. preencher os dados complementares da planilha
4. salvar a ficha
5. consultar, editar, excluir ou exportar

## Arquivos principais

- [backend/app/routes/planilha_acidente_viatura.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/planilha_acidente_viatura.py)
- [backend/app/schemas/planilha_acidente_viatura.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/schemas/planilha_acidente_viatura.py)
- [backend/app/models/planilha_acidente_viatura.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/planilha_acidente_viatura.py)
- [frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx)
- [frontend/src/services/planilhaAcidenteViaturaService.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/services/planilhaAcidenteViaturaService.js)

## Observações

- a tela foi aproximada visualmente da planilha institucional do `PAAVI`
- o frontend foi corrigido para mostrar corretamente os dados do policial retornados pela base
