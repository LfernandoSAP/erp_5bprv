# Padroes de Frontend

## Stack

- `React 19`
- `Vite`
- `MUI`

## Arquivos-base

- [frontend/src/App.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/App.jsx)
- [frontend/src/config/navigation.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/config/navigation.js)
- [frontend/src/components/appShellStyles.js](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/components/appShellStyles.js)
- [frontend/src/components/ModuleCard.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/components/ModuleCard.jsx)

## Regras visuais

- usar o dark theme institucional ja consolidado
- hubs e subhubs devem usar `ModuleCard`
- botoes devem usar estilos semanticos de `appShellStyles`
- evitar CSS solto quando ja existir padrao reutilizavel

## Regras de navegacao

- a navegacao principal nasce em `navigation.js`
- telas devem respeitar o fluxo atual por paginas e hubs
- novos cards devem manter consistencia com os modulos ja existentes

## Regras de implementacao

- preferir componentes reutilizaveis
- manter responsividade desktop/mobile
- evitar reintroducao de texto corrompido
- manter coerencia entre listagem, detalhe, edicao e exportacao

## Checklist do agente frontend

- a tela segue o padrao visual existente
- os botoes usam estilos centralizados
- os cards usam `ModuleCard` quando aplicavel
- a navegacao ficou conectada no `App.jsx` e em `navigation.js`
- o texto ficou correto em UTF-8
- `npm run build` passou
