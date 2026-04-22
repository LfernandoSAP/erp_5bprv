$frontendStatus = "offline"
$backendStatus = "offline"

try {
  $frontendStatusCode = (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3).StatusCode
  $frontendStatus = "online ($frontendStatusCode)"
} catch {
}

try {
  $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3
  if ($health.status) {
    $backendStatus = "online ($($health.status))"
  }
} catch {
}

Write-Host "Frontend: $frontendStatus"
Write-Host "Backend:  $backendStatus"
