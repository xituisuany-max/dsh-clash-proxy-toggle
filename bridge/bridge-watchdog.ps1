# bridge-watchdog.ps1 — 桥接服务自愈脚本（配合计划任务每 N 分钟运行）
# 用法（示例，每 2 分钟检查一次）：
#   $action  = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<本脚本绝对路径>"'
#   $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
#   Register-ScheduledTask -TaskName 'dsh-bridge-watchdog' -Action $action -Trigger $trigger -Force
#
# 可选环境变量：PROXY_BRIDGE_PORT（默认 54123）、NODE_EXE（node 路径，默认 node）
$port = 54123
if ($env:PROXY_BRIDGE_PORT) { $port = [int]$env:PROXY_BRIDGE_PORT }

if (-not (Test-NetConnection 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue)) {
  $bridge = Join-Path $PSScriptRoot 'proxy-bridge.cjs'
  $node = 'node'
  if ($env:NODE_EXE) { $node = $env:NODE_EXE }
  Start-Process -FilePath $node -ArgumentList "`"$bridge`"" -WindowStyle Hidden
}
