$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Iniciando backend..." -ForegroundColor Cyan
& (Join-Path $scriptDir "start-backend.ps1")

Write-Host "Iniciando frontend..." -ForegroundColor Cyan
& (Join-Path $scriptDir "start-frontend.ps1")

Write-Host ""
Write-Host "ERP 5BPRv em execucao:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:8000"
Write-Host "Health:   http://localhost:8000/health"
