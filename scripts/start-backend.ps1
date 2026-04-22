param(
  [int]$Port = 8000,
  [int]$TimeoutSeconds = 20
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$pythonExe = Join-Path $root ".venv\Scripts\python.exe"
$pythonwExe = Join-Path $root ".venv\Scripts\pythonw.exe"
$pidFile = Join-Path $root "backend-dev.pid"

function Get-ListeningProcessId {
  param([int]$Port)

  $lines = netstat -ano -p tcp | Select-String "LISTENING"
  foreach ($entry in $lines) {
    $parts = ($entry.Line -split '\s+') | Where-Object { $_ }
    if ($parts.Length -ge 5) {
      $localAddress = $parts[1]
      $state = $parts[3]
      $processId = $parts[4]
      if ($state -eq "LISTENING" -and $localAddress -match "[:\.]$Port$" -and $processId -match '^\d+$') {
        return [int]$processId
      }
    }
  }

  return $null
}

function Wait-ForPortRelease {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 10
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (-not (Get-ListeningProcessId -Port $Port)) {
      return $true
    }
    Start-Sleep -Milliseconds 300
  }

  return $false
}

if (-not (Test-Path $pythonExe)) {
  throw "Python da virtualenv nao encontrado em $pythonExe"
}

$runnerExe = if (Test-Path $pythonwExe) { $pythonwExe } else { $pythonExe }

if (Test-Path $pidFile) {
  $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid -match '^\d+$') {
    Stop-Process -Id ([int]$existingPid) -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$listenerPid = Get-ListeningProcessId -Port $Port
if ($listenerPid) {
  Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
}

if (-not (Wait-ForPortRelease -Port $Port -TimeoutSeconds 12)) {
  throw "A porta $Port nao foi liberada a tempo para iniciar o backend."
}

Start-Process `
  -FilePath $runnerExe `
  -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "$Port", "--no-server-header") `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -Method Get -TimeoutSec 3
    if ($health.status -eq "healthy") {
      $listenerPid = Get-ListeningProcessId -Port $Port
      if ($listenerPid) {
        Set-Content -Path $pidFile -Value $listenerPid -Encoding ascii
      }
      Write-Host "Backend iniciado com sucesso em http://127.0.0.1:$Port" -ForegroundColor Green
      exit 0
    }
  } catch {
  }
}

throw "Backend nao respondeu ao health-check em http://127.0.0.1:$Port/health dentro de $TimeoutSeconds segundos."
