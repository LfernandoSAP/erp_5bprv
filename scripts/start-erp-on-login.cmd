@echo off
setlocal

timeout /t 15 /nobreak >nul

start "" /B powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\Telematica\Documents\erp5bprv\scripts\start-erp.ps1"

endlocal
