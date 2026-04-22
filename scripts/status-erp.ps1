$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot

$services = @(
  @{
    Name = "Backend"
    Port = 8000
    PidFile = Join-Path $root "backend-dev.pid"
    StdoutLog = Join-Path $root "backend-dev.log"
    StderrLog = Join-Path $root "backend-dev.err.log"
  },
  @{
    Name = "Frontend"
    Port = 3000
    PidFile = Join-Path $root "frontend-dev.pid"
    StdoutLog = Join-Path $root "frontend-dev.log"
    StderrLog = Join-Path $root "frontend-dev.err.log"
  }
)

function Get-ListenerForPort {
  param([int]$Port)

  $lines = netstat -ano -p tcp | Select-String "LISTENING"
  foreach ($entry in $lines) {
    $parts = ($entry.Line -split '\s+') | Where-Object { $_ }
    if ($parts.Length -ge 5) {
      $localAddress = $parts[1]
      $state = $parts[3]
      $processId = $parts[4]
      if ($state -eq "LISTENING" -and $localAddress -match "[:\.]$Port$" -and $processId -match '^\d+$') {
        return [PSCustomObject]@{
          LocalPort = $Port
          OwningProcess = [int]$processId
        }
      }
    }
  }

  return $null
}

function Get-ProcessSummary {
  param([int]$ProcessId)

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return $null
  }

  [PSCustomObject]@{
    Id = $process.Id
    Name = $process.ProcessName
    StartTime = $process.StartTime
  }
}

foreach ($service in $services) {
  Write-Host ""
  Write-Host "=== $($service.Name) ===" -ForegroundColor Cyan

  $savedPid = $null
  if (Test-Path $service.PidFile) {
    $rawPid = Get-Content $service.PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($rawPid -match '^\d+$') {
      $savedPid = [int]$rawPid
    }
  }

  $listener = Get-ListenerForPort -Port $service.Port
  $listeningPid = if ($listener) { [int]$listener.OwningProcess } else { $null }

  $pidStatus = if ($savedPid) { "PID salvo: $savedPid" } else { "PID salvo: nenhum" }
  Write-Host $pidStatus -ForegroundColor Yellow

  if ($savedPid) {
    $savedProcess = Get-ProcessSummary -ProcessId $savedPid
    if ($savedProcess) {
      Write-Host "Processo salvo: VIVO ($($savedProcess.Name), iniciado em $($savedProcess.StartTime))" -ForegroundColor Green
    } else {
      Write-Host "Processo salvo: MORTO" -ForegroundColor Red
    }
  } else {
    Write-Host "Processo salvo: nao monitorado" -ForegroundColor DarkGray
  }

  if ($listener) {
    Write-Host "Porta $($service.Port): ATIVA (PID $listeningPid)" -ForegroundColor Green
  } else {
    Write-Host "Porta $($service.Port): INATIVA" -ForegroundColor Red
  }

  if ($listeningPid) {
    $listeningProcess = Get-ProcessSummary -ProcessId $listeningPid
    if ($listeningProcess) {
      Write-Host "Processo da porta: $($listeningProcess.Name) | PID $($listeningProcess.Id)" -ForegroundColor Green
    }
  }

  Write-Host ""
  Write-Host "Ultimas linhas de log:" -ForegroundColor Cyan
  if (Test-Path $service.StdoutLog) {
    Write-Host "-- stdout --" -ForegroundColor DarkCyan
    Get-Content $service.StdoutLog -Tail 8
  } else {
    Write-Host "-- stdout indisponivel --" -ForegroundColor DarkGray
  }

  if (Test-Path $service.StderrLog) {
    $stderrTail = Get-Content $service.StderrLog -Tail 8
    if ($stderrTail) {
      Write-Host "-- stderr --" -ForegroundColor DarkYellow
      $stderrTail
    }
  }
}
