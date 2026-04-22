param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 25
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$stdoutLog = Join-Path $root "frontend-dev.log"
$stderrLog = Join-Path $root "frontend-dev.err.log"
$pidFile = Join-Path $root "frontend-dev.pid"
$npmCmd = (Get-Command npm.cmd).Source

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
    $listenerPid = Get-ListeningProcessId -Port $Port
    if (-not $listenerPid) {
      return $true
    }
    Start-Sleep -Milliseconds 300
  }

  return $false
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
  throw "Frontend nao encontrado em $frontendDir"
}

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
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
  throw "A porta $Port nao foi liberada a tempo para iniciar o frontend."
}

if (Test-Path $stdoutLog) {
  Remove-Item $stdoutLog -Force -ErrorAction SilentlyContinue
}
if (Test-Path $stderrLog) {
  Remove-Item $stderrLog -Force -ErrorAction SilentlyContinue
}

$process = Start-Process `
  -FilePath $npmCmd `
  -ArgumentList @("run", "dev") `
  -WorkingDirectory $frontendDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$healthy = $false
$listenerPid = $null

while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 1
  try {
    $statusCode = (Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 3).StatusCode
    if ($statusCode -ge 200 -and $statusCode -lt 500) {
      $resolvedPid = Get-ListeningProcessId -Port $Port
      if ($resolvedPid) {
        $listenerPid = $resolvedPid
      }
      $healthy = $true
      break
    }
  } catch {
  }
}

if (-not $healthy) {
  Write-Host "Frontend nao respondeu dentro do tempo esperado." -ForegroundColor Yellow
  if (Test-Path $stdoutLog) {
    Write-Host "Ultimas linhas de saida:" -ForegroundColor Yellow
    Get-Content -Path $stdoutLog -Tail 30
  }
  if (Test-Path $stderrLog) {
    Write-Host "Ultimas linhas de erro:" -ForegroundColor Yellow
    Get-Content -Path $stderrLog -Tail 30
  }
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  exit 1
}

if ($listenerPid) {
  Set-Content -Path $pidFile -Value $listenerPid -Encoding ascii
} else {
  Set-Content -Path $pidFile -Value $process.Id -Encoding ascii
}

Write-Host "Frontend iniciado com sucesso em http://localhost:$Port" -ForegroundColor Green
