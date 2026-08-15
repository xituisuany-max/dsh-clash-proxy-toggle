# dsh-restart.ps1 - Fully restart the DSH desktop app (kill all processes, relaunch with CDP).
# WARNING: this interrupts any running agent task.
param([int]$CdpPort = 9222, [int]$GuiPort = 55668)

$exe = "C:\Users\Administrator\AppData\Local\Programs\DeepSeek Harness Desktop\DeepSeek Harness Desktop.exe"
if (-not (Test-Path $exe)) {
  $cand = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq "DeepSeek Harness Desktop.exe" } | Select-Object -First 1 -ExpandProperty ExecutablePath
  if ($cand) { $exe = $cand } else { Write-Host "ERROR: DSH executable not found"; exit 1 }
}

Write-Host "Stopping DSH processes..."
Get-Process -Name "DeepSeek Harness Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 4

Write-Host "Relaunching with CDP port $CdpPort..."
Start-Process -FilePath $exe -ArgumentList "--remote-debugging-port=$CdpPort"

# Wait for the GUI port to come up
for ($i = 0; $i -lt 90; $i++) {
  if (Test-NetConnection 127.0.0.1 -Port $GuiPort -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Host "GUI is up on port $GuiPort (took ${i}s)"
    exit 0
  }
  Start-Sleep -Seconds 1
}
Write-Host "WARNING: GUI port $GuiPort did not come up within 90s"
exit 1
