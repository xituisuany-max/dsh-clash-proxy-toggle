# dsh-refresh.ps1 - One-key refresh for the DSH desktop GUI.
# 1) Try a lightweight CDP page reload (fast, keeps the app running).
# 2) If CDP is unavailable, fall back to a full app restart.
$ErrorActionPreference = "Continue"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Trying lightweight CDP reload..."
& (Join-Path $dir "dsh-reload.ps1")
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK: page reloaded via CDP (app kept running)."
  exit 0
}

Write-Host "CDP unavailable - doing a full app restart..."
& (Join-Path $dir "dsh-restart.ps1")
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK: DSH restarted. Note: running agent tasks were interrupted."
  exit 0
}
Write-Host "ERROR: refresh failed."
exit 1
