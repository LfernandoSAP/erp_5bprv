# Estado Atual do ERP 5BPRv

## Visão geral

O ERP 5BPRv está em operação como um sistema web interno, com frontend e backend separados e organização em `monólito modular`.

## Arquitetura atual

### Frontend

- `React`
- `Vite`
- `MUI`
- navegação centralizada em `frontend/src/App.jsx`
- serviços de API em `frontend/src/services`

### Backend

- `Python`
- `FastAPI`
- `SQLAlchemy`
- `Pydantic`
- autenticação com `JWT`
- organização modular em `router -> service -> repository`

### Banco de dados

- `PostgreSQL` como banco principal

## Módulos funcionais já ativos

- `P1 - Recursos Humanos`
- `P3 - Estatística`
- `P4 - Logística/Frota`
- `P5 - Relações Públicas`
- `UGE`
- `PJMD`
- `StCor`
- `Telemática`

## Módulos e telas já consolidados

- login institucional
- dashboard
- quinquênio
- previsão de rancho
- controle de velocidade noturno
- planilha de acidentes de viatura
- materiais
- `TPD/Talonário`
- frota
- material bélico
- romaneio
- estoque/manutenção
- policiais
- usuários
- setores
- unidades
- logs

## Capacidades já entregues

- exportação em `Excel`
- exportação em `PDF`
- ficha individual do policial em PDF
- impressão da ficha do policial
- busca de policial por `RE-DC` com reaproveitamento em módulos operacionais
- dashboards mensais operacionais no `P3`
- grade mensal operacional no `Rancho`
- responsividade para desktop, tablet e smartphone
- cards mobile nas consultas principais
- feedback inline no fluxo principal
- scripts de `start`, `stop` e `status` para execução local no Windows

## Padrões operacionais do frontend

- lazy loading de páginas
- menu lateral com módulos de 1º nível
- navegação principal por cards de módulo e submódulo
- tela inicial de boas-vindas após login
- hubs visuais para `P1 - Recursos Humanos` e `P4 - Logística/Frota`
- máscaras para data, CPF, CEP e telefone
- padronização de textos em PT-BR
- arquivos-fonte salvos em `UTF-8`
- saneamento defensivo de textos em módulos sensíveis, principalmente `Estoque/Manutenção` e `Material Bélico`

## Padrões operacionais do backend

- autenticação por token
- escopo por unidade
- separação gradual de regras de negócio em services
- compatibilidade controlada durante transições estruturais
- normalização defensiva de textos em respostas críticas da API quando houver legado com codificação inconsistente

## Fluxo técnico resumido

```text
Frontend (React/Vite)
  ->
API REST (FastAPI)
  ->
Services / Repositories
  ->
SQLAlchemy
  ->
PostgreSQL
```

## Operação local

### Execução manual

- backend em `http://localhost:8000`
- frontend em `http://localhost:3000`

### Scripts disponíveis

- [start-backend.ps1](C:/Users/Telematica/Documents/erp5bprv/scripts/start-backend.ps1)
- [start-frontend.ps1](C:/Users/Telematica/Documents/erp5bprv/scripts/start-frontend.ps1)
- [stop-erp.ps1](C:/Users/Telematica/Documents/erp5bprv/scripts/stop-erp.ps1)
- [status-erp.ps1](C:/Users/Telematica/Documents/erp5bprv/scripts/status-erp.ps1)

### Referência operacional

- [operacao-local.md](C:/Users/Telematica/Documents/erp5bprv/docs/operacao-local.md)

## Revisão operacional recente

Em `29/03/2026`, o sistema passou por uma revisão operacional curta com os seguintes resultados:

- `frontend` respondendo em `http://localhost:3000`
- `backend` respondendo em `http://127.0.0.1:8000/health`
- `npm run lint` do frontend sem erros
- autenticação funcional com usuário real de homologação
- leitura autenticada validada em:
  - `P1 - Recursos Humanos`
  - `P4 - Materiais`
  - `P4 - Frota`
  - `P4 - Material Bélico`
  - `P4 - Romaneio`
  - `Telemática`
- escrita controlada validada em `Estoque / Manutenção`, com saldo final coerente
- escrita controlada validada em `Materiais` e `TPD / Talonário` com payload mínimo estável

## Ajuste fino recente do P4

Também em `29/03/2026`, o `P4 - Logística/Frota` recebeu uma rodada final de acabamento com:

- limpeza dos catálogos centrais de `Frota` e `Material Bélico`
- padronização visual de `Materiais` e `TPD/Talonário`
- revisão dos fluxos de criação, edição e listagem do `TPD/Talonário`
- correção residual de textos como `Manutenção` em telas e listas auxiliares
- limpeza do arquivo central de navegação por cards

Resultado prático:

- o `P4` ficou mais homogêneo visualmente
- os módulos principais do setor passaram a compartilhar melhor os mesmos padrões de texto e apresentação

## Documento de referência

Se for preciso entender rapidamente “como o projeto está hoje”, este arquivo deve ser lido antes dos demais documentos históricos.

## Revisão global - 30/03/2026

Em `30/03/2026`, o projeto passou por uma revisão global focada em texto legado, consistência de API e estabilidade operacional.

Pontos consolidados:

- saneamento defensivo ampliado no backend para `Logística`, `RH`, `Telemática` e `Dashboard`
- limpeza dos retornos de `Materiais`, `TPD/Talonário`, `Usuários`, `Policiais`, `Setores` e `Unidades`
- revisão dos textos mais antigos no bloco de PDF do policial
- navegação por cards mantida como padrão ativo do frontend
- frontend local respondendo em `http://localhost:3000`
- backend respondendo em `http://127.0.0.1:8000/health`

Resultado prático:

- redução forte de textos legados quebrados na interface
- redução de texto inconsistente nas respostas da API
- base mais pronta para novas homologações e para preparação de hospedagem externa

## Expansão funcional recente - 10/04/2026

Em `10/04/2026`, o projeto consolidou novos módulos operacionais em `P1`, `P3` e `Assuntos Gerais`.

Pontos consolidados:

- `Controle de Bloco Quinquênio` no `P1 - Recursos Humanos`
- `Previsão de Rancho` em `Assuntos Gerais`
- `Controle de Velocidade Noturno` no `P3 - Estatística`
- `Planilha de Acidentes de Viatura` (`PAAVI`) no `P3 - Estatística`
- reaproveitamento da base de policiais por `RE-DC` em módulos novos

Resultado prático:

- o `P1` amplia o controle de blocos com cálculo por `1825 dias`
- o `Rancho` passa a operar com grade mensal e exportação
- o `P3` ganha dashboard mensal e fluxo estatístico de acidentes com viatura

