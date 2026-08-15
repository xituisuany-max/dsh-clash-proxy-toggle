@echo off
rem One-key refresh for DSH desktop GUI (CDP reload first, full restart fallback)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dsh-refresh.ps1"
pause
