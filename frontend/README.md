# Frontend ERP 5BPRv

## Visão geral

O frontend do ERP 5BPRv foi construído com `React + Vite` e usa `MUI` como apoio para layout, drawer, dialogs e componentes selecionados.

Atualmente a interface cobre:

- autenticação
- navegação modular
- dashboard
- materiais
- `TPD/Talonário`
- frota
- material bélico
- policiais
- usuários
- setores
- unidades
- logs
- exportação de relatórios em `Excel` e `PDF`

## Rodando localmente

No diretório [frontend](C:/Users/Telematica/Documents/erp5bprv/frontend):

```powershell
npm install
npm run dev
```

Aplicação esperada:

- `http://localhost:3000`

Validações:

```powershell
npm run lint
npm run build
```

## Estrutura relevante

```text
frontend/
  public/
    images/
      css/
      reports/
  src/
    components/
    config/
    constants/
    pages/
    services/
    utils/
  package.json
  vite.config.js
```

## Padrões atuais

- layout responsivo para desktop, tablet e smartphone
- drawer temporário em telas menores
- lazy loading das páginas em `src/App.jsx`
- divisão de chunks no `vite.config.js`
- feedback inline para erro e sucesso
- confirmação explícita apenas em ações sensíveis
- estilos compartilhados em `src/components/appShellStyles.js`
- cards mobile nas principais consultas
- máscaras consistentes para data, CPF, telefone e CEP

## Estado atual da interface

O frontend já cobre:

- navegação principal por módulo
- login institucional redesenhado
- dashboard com indicadores consolidados
- consultas com resumo visual acima das tabelas
- alternativa em cards para smartphone nas telas mais densas
- estados de carregamento e vazio mais claros
- formulários de cadastro, edição e movimentação com orientações inline

## Relatórios

Arquivos-base:

- [reportExport.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/utils/reportExport.js)
- [reportContext.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/utils/reportContext.js)
- [ReportExportButtons.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/components/ReportExportButtons.jsx)
- [reportBranding.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/config/reportBranding.js)

Capacidades atuais:

- exportação do resultado filtrado na tela
- relatórios em `Excel` e `PDF`
- contexto com busca e escopo aplicado
- PDF institucional com cabeçalho, assinatura e paginação
- ficha individual do policial com exportação/impressão
- carregamento sob demanda das bibliotecas de exportação
- feedback inline de geração com sucesso/erro

## Imagens estáticas

Use:

- [public/images/css](C:/Users/Telematica/Documents/erp5bprv/frontend/public/images/css)
  Para fundos, banners, texturas e imagens usadas no CSS

- [public/images/reports](C:/Users/Telematica/Documents/erp5bprv/frontend/public/images/reports)
  Para brasão, logo e imagens institucionais dos relatórios

Exemplo:

```css
background-image: url('/images/css/fundo-painel.jpg');
```

## Navegação e módulos

Hoje a navegação principal segue a estrutura institucional do projeto, com destaque para:

- `P1 - Recursos Humanos`
- `P3 - Estatística`
- `P4 - Logística/Frota`
- `P5 - Relações Públicas`
- `UGE`
- `PJMD`
- `StCor`
- `Telemática`

Dentro de `P4 - Logística/Frota`, o frontend já expõe:

- `Materiais`
- `TPD/Talonário`
- `Material Bélico`
- `Frota`
- `Itens Inativos`

## Checklist rápido

Para uma rodada de homologação interna, validar:

- `npm run lint`
- `npm run build`
- login e logout
- consultas com exportação em `Excel` e `PDF`
- ficha PDF individual do policial
- responsividade em smartphone e tablet
- formulários de cadastro, edição e movimentação
- consistência textual do menu lateral e das telas principais
