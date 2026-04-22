$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
$pidFiles = @(
  @{ Name = "backend"; Path = (Join-Path $root "backend-dev.pid") },
  @{ Name = "frontend"; Path = (Join-Path $root "frontend-dev.pid") }
)

$stoppedByPid = @()

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

foreach ($pidEntry in $pidFiles) {
  if (-not (Test-Path $pidEntry.Path)) {
    continue
  }

  $rawPid = Get-Content $pidEntry.Path -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($rawPid -match '^\d+$') {
    $pidValue = [int]$rawPid
    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
    if (-not $?) {
      Write-Host "PID $pidValue ($($pidEntry.Name)) nao estava ativo." -ForegroundColor DarkGray
    } else {
      Write-Host "Processo $($pidEntry.Name) finalizado via PID $pidValue." -ForegroundColor Yellow
      $stoppedByPid += $pidValue
    }
    Start-Sleep -Milliseconds 400
  }

  Remove-Item $pidEntry.Path -Force -ErrorAction SilentlyContinue
}

$ports = @(3000, 8000)
foreach ($port in $ports) {
  $listenerPid = Get-ListeningProcessId -Port $port
  if ($listenerPid) {
    if ($stoppedByPid -contains $listenerPid) {
      Write-Host "Porta $port liberada pelo processo finalizado via PID." -ForegroundColor Yellow
      continue
    }
    Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
    Write-Host "Processo da porta $port finalizado." -ForegroundColor Yellow
  } else {
    Write-Host "Nenhum processo ativo na porta $port." -ForegroundColor DarkGray
  }
}
