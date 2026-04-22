# ERP 5BPRv

Sistema ERP do 5BPRv, organizado como um monolito modular para apoiar operacoes administrativas, logisticas e institucionais.

## Visao geral

O projeto concentra frontend, backend, documentacao tecnica e um portal institucional legado/evoluido no mesmo repositorio.

Hoje o sistema cobre, entre outros pontos:

- autenticacao e controle de acesso
- dashboard institucional
- policiais, unidades e setores
- quinquenio
- rancho
- controle de velocidade noturno
- planilha de acidentes de viatura
- materiais, estoque e material belico
- frota
- TPD/Talonario
- LP, LSV e controle de efetivo
- exportacao em PDF e Excel
- trilhas de auditoria

## Stack principal

- frontend: React 19 + Vite + MUI
- backend: FastAPI + SQLAlchemy
- banco principal: PostgreSQL
- compatibilidade local/legado: SQLite
- relatorios e planilhas: ReportLab, OpenPyXL e jsPDF

## Estrutura do repositorio

```text
backend/     API, regras de negocio, modelos e migracoes
frontend/    interface web em React + Vite
docs/        arquitetura, operacao local, modulos e handover
scripts/     automacoes para subir e monitorar o ambiente
Site5Rv/     portal institucional
```

## Como rodar localmente no Windows

### Backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Se preferir, use o caminho absoluto documentado em [`docs/operacao-local.md`](docs/operacao-local.md).

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Subida automatizada

Tambem existe um script para iniciar o ambiente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-erp.ps1
```

### Enderecos esperados

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`
- health check: `http://127.0.0.1:8000/health`

## Documentacao

Os pontos de entrada mais importantes da documentacao estao em:

- [`docs/README.md`](docs/README.md)
- [`docs/estado-atual.md`](docs/estado-atual.md)
- [`docs/README-ARQUITETURA.md`](docs/README-ARQUITETURA.md)
- [`docs/HANDOVER-TECNICO.md`](docs/HANDOVER-TECNICO.md)
- [`docs/operacao-local.md`](docs/operacao-local.md)
- [`docs/api.md`](docs/api.md)

## Observacoes

- o repositorio ignora ambientes virtuais, `node_modules`, arquivos de banco local, logs e artefatos temporarios
- a pasta `Site5Rv_antigo/` ficou fora do versionamento para manter o repositorio atual mais enxuto
