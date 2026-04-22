# ERP 5BPRv

<p align="center">
  <img src="frontend/public/images/css/logo_5rv.png" alt="Logo ERP 5BPRv" width="180">
</p>

<p align="center">
  Sistema ERP do 5BPRv para apoio operacional, administrativo, logistico e institucional.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-0f172a?style=for-the-badge&logo=react" alt="React 19 + Vite">
  <img src="https://img.shields.io/badge/backend-FastAPI-0b1320?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/database-PostgreSQL%20%2F%20SQLite-1f2937?style=for-the-badge&logo=postgresql" alt="PostgreSQL / SQLite">
  <img src="https://img.shields.io/badge/status-em%20evolucao-374151?style=for-the-badge" alt="Projeto em evolucao">
</p>

## Visao geral

O ERP 5BPRv e um monolito modular que concentra:

- frontend web em `React + Vite`
- API e regras de negocio em `FastAPI + SQLAlchemy`
- documentacao tecnica e operacional
- portal institucional em `Site5Rv/`

O sistema foi estruturado para apoiar a operacao diaria com modulos especializados, preservando compatibilidade com fluxo local e legado quando necessario.

## Principais capacidades

- autenticacao e autorizacao institucional
- dashboard e navegacao por cards e hubs
- cadastro e gestao de policiais
- unidades, setores e organizacao de acesso
- quinquenio
- rancho
- controle de velocidade noturno
- planilha de acidentes de viatura
- estoque, materiais e material belico
- frota
- TPD e talonario
- LP, LSV e controle de efetivo
- exportacao de relatorios em `PDF` e `Excel`
- auditoria e trilhas de seguranca

## Stack

- frontend: `React 19`, `Vite`, `MUI`
- backend: `FastAPI`, `SQLAlchemy`, `Uvicorn`
- banco principal: `PostgreSQL`
- banco local/legado: `SQLite`
- relatorios: `ReportLab`, `OpenPyXL`, `jsPDF`

## Estrutura do repositorio

```text
backend/        API, modelos, migracoes e regras de negocio
frontend/       aplicacao web principal
docs/           documentacao tecnica, funcional e operacional
scripts/        automacoes para iniciar e verificar o ambiente
Site5Rv/        portal institucional
database/       artefatos e apoio de banco
```

## Modulos documentados

O projeto ja possui documentacao funcional para modulos e areas como:

- `P1 / Recursos Humanos`
- `P2 / Inteligencia`
- `P3 / Estatistica`
- `P4 / Logistica e Frota`
- `P5 / Relacoes Publicas`
- `PJMD`
- `UGE`
- `StCor`
- `Telematica`
- `Usuarios`, `Setores` e `Policiais`
- `Controle de Efetivo`
- `Estoque`, `Materiais` e `Material Belico`
- `TPD / Talonario`
- `Frota`
- `Romaneio`
- `Processos de Armas`
- `COPS`
- `Mapa Forca`
- `Quinquenio`
- `Rancho`
- `PAAVI`
- `EAP`

Referencia: [`docs/modules/README.md`](docs/modules/README.md)

## Instalacao e execucao local no Windows

### 1. Preparar o backend

Crie e ative um ambiente virtual Python, depois instale as dependencias:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Se o ambiente virtual ainda nao existir:

```powershell
python -m venv ..\.venv
```

### 2. Configurar variaveis do backend

Use [`backend/.env.example`](backend/.env.example) como base para seu arquivo `.env`.

Valores esperados no ambiente local:

- banco local em `SQLite` ou banco principal em `PostgreSQL`
- `ALLOWED_ORIGINS=http://localhost:3000`
- segredos JWT definidos para ambiente de desenvolvimento

### 3. Subir o backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 4. Preparar o frontend

```powershell
cd frontend
npm install
```

### 5. Subir o frontend

```powershell
cd frontend
npm run dev
```

### 6. Opcao automatizada

Tambem existe um script para iniciar o ambiente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-erp.ps1
```

### Enderecos esperados

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`
- health check: `http://127.0.0.1:8000/health`

## Fluxo rapido de desenvolvimento

```powershell
git pull
git checkout -b minha-feature
git add .
git commit -m "Descreve a alteracao"
git push -u origin minha-feature
```

## Documentacao principal

Os melhores pontos de entrada para entender o projeto sao:

- [`docs/README.md`](docs/README.md)
- [`docs/estado-atual.md`](docs/estado-atual.md)
- [`docs/README-ARQUITETURA.md`](docs/README-ARQUITETURA.md)
- [`docs/HANDOVER-TECNICO.md`](docs/HANDOVER-TECNICO.md)
- [`docs/operacao-local.md`](docs/operacao-local.md)
- [`docs/api.md`](docs/api.md)
- [`docs/modules/README.md`](docs/modules/README.md)

## Observacoes do repositorio

- o repositorio ignora ambientes virtuais, `node_modules`, bancos locais, logs e artefatos temporarios
- `Site5Rv_antigo/` ficou fora do versionamento para manter o repositorio atual mais enxuto
- a referencia principal do estado atual do sistema esta em [`docs/estado-atual.md`](docs/estado-atual.md)
