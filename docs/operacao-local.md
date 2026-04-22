# Operação Local no Windows

## Objetivo

Este documento registra o procedimento manual que funcionou melhor para subir o ERP 5BPRv localmente quando frontend e backend caem ou ficam instáveis.

## Endereços esperados

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`
- health check do backend: `http://127.0.0.1:8000/health`

## Ordem recomendada

1. subir o backend
2. confirmar a porta `8000`
3. subir o frontend
4. confirmar a porta `3000`
5. abrir o sistema no navegador

## Backend

### Comando estável

```powershell
cd c:\Users\Telematica\Documents\erp5bprv\backend
C:\Users\Telematica\Documents\erp5bprv\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Validação

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health
```

Resultado esperado:

- resposta `200`
- corpo com `{"status":"healthy"}`

## Frontend

### Comando

```powershell
cd c:\Users\Telematica\Documents\erp5bprv\frontend
npm run dev
```

### Validação

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000
```

Resultado esperado:

- resposta `200`
- Vite exibindo `Local: http://localhost:3000/`

## Configuração consolidada

### Frontend

- `frontend/vite.config.js`
  - `host: 'localhost'`
  - `port: 3000`
  - `strictPort: true`
  - `cors: true`

- `frontend/.env`
  - `PORT=3000`
  - `REACT_APP_API_URL=http://localhost:8000`
  - `VITE_API_BASE_URL=/api`
  - `VITE_BACKEND_URL=http://localhost:8000`

### Backend

- o backend responde localmente em `127.0.0.1:8000`
- o frontend consome a API pelo proxy `/api`

## Diagnóstico rápido

### Ver portas em uso

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### Ver processos Node

```powershell
tasklist | findstr node
```

### Verificar se o backend está de pé

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health
```

### Verificar se o frontend está de pé

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000
```

## Sintomas comuns

### Frontend abre, mas a aplicação mostra erro interno do servidor

Causa provável:

- backend fora do ar

Checagem:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health
```

### Chrome mostra `chrome-error://chromewebdata`

Causa provável:

- a aba antiga tentou recarregar enquanto o frontend estava fora do ar

Ação:

- abrir uma nova aba em `http://localhost:3000`
- ou usar `Ctrl + F5`

### Vite sobe, mas o navegador não carrega

Checar:

- se a porta `3000` realmente está ouvindo
- se o backend está ativo
- se o proxy `/api` não está falhando por falta da `8000`

## Observação prática

Quando houver dúvida, considerar este procedimento como a referência operacional mais confiável para recuperação local do ambiente no Windows.

