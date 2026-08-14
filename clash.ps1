<#
.SYNOPSIS
  按需启动 Clash 代理，用完自动关闭（通用版，可开源分发）。

.DESCRIPTION
  1. 启动 clash-win64 核心（使用本机订阅配置，默认当前选中项）
  2. 等待代理端口就绪
  3. 可选：恢复 list.yml 里保存的节点 / 用 -Node 指定节点 / -SystemProxy 开启系统代理
  4. 执行完 -Command 命令后自动关闭 Clash 并清理

  配置（按优先级）：环境变量 CLASH_APP_DIR > 同目录 config.env > 报错。
  必须通过上述方式指定 Clash for Windows 应用目录，例如：
    set CLASH_APP_DIR=D:\Apps\Clash.for.Windows
  或创建 config.env（复制 config.example 修改）。

.EXAMPLE
  # 启动代理，执行一个命令，然后自动关闭
  .\clash.ps1 -Command "node fetch.js"

  # 只做连通性自检后关闭（被墙站点验证，失败会自动换活节点）
  .\clash.ps1 -ProxyTest https://www.google.com/generate_204

  # 常驻运行（前台阻塞，Ctrl+C 关闭；或另开终端 .\clash.ps1 -Stop）
  .\clash.ps1 -SystemProxy

  # 指定订阅/节点/地区
  .\clash.ps1 -Profile 4 -Node "香港 · 01"
  .\clash.ps1 -Region 日本

  # 状态 / 关闭
  .\clash.ps1 -Status
  .\clash.ps1 -Stop
#>
[CmdletBinding()]
param(
  # 要在代理就绪后执行的命令（cmd 语法），执行完自动关闭 Clash
  [string]$Command,

  # 配置：list.yml 索引(0..N)、文件名、完整路径或订阅名模糊匹配；缺省用当前选中项
  [string]$Profile,

  # 手动指定节点名（应用到所有包含该节点的 select 组）；缺省恢复 list.yml 里的选择
  [string]$Node,

  # 自动换活节点时优先匹配的地区关键词（如 -Region 日本 / 香港 / 新加坡）
  [string]$Region,

  # 同时设置 Windows 系统代理（退出时自动恢复）
  [switch]$SystemProxy,

  # 只启动并做一次连通性自检（走代理请求这个 URL，例如 -ProxyTest https://www.google.com/generate_204；被墙站点更可信）
  [string]$ProxyTest,

  # 端口被无效代理占用时不要自动接管（默认会终止占用进程并用自己的核心接管）
  [switch]$NoTakeover,

  # 关闭由本脚本启动的 Clash
  [switch]$Stop,

  # 查询状态与可用配置
  [switch]$Status,

  # 安静模式（供脚本/Agent 调用）
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

# ---------------- 配置解析 ----------------
function Read-ConfigEnv {
  $f = Join-Path $PSScriptRoot 'config.env'
  if (Test-Path -LiteralPath $f) {
    foreach ($line in (Get-Content -LiteralPath $f -Encoding UTF8)) {
      $m = [regex]::Match($line, '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$')
      if ($m.Success -and $m.Groups[2].Value -and -not $m.Groups[2].Value.StartsWith('#')) {
        if (-not [Environment]::GetEnvironmentVariable($m.Groups[1].Value)) {
          [Environment]::SetEnvironmentVariable($m.Groups[1].Value, $m.Groups[2].Value)
        }
      }
    }
  }
}
Read-ConfigEnv

# ---------------- 常量（可配置） ----------------
$AppDir = $env:CLASH_APP_DIR
if (-not $AppDir) {
  throw '未配置 Clash 应用目录：请设置环境变量 CLASH_APP_DIR，或在本脚本同目录创建 config.env（参考 config.example）'
}
$CoreExe   = Join-Path $AppDir 'resources\static\files\win\x64\clash-win64.exe'
$DataDir   = Join-Path $AppDir 'data'
$Profiles  = Join-Path $DataDir 'profiles'
$ListFile  = Join-Path $Profiles 'list.yml'
$PidFile   = Join-Path $PSScriptRoot '.clash-run\clash.pid'
$RunDir    = Join-Path $PSScriptRoot '.clash-run'
$OutLog    = Join-Path $RunDir 'clash.out.log'
$ErrLog    = Join-Path $RunDir 'clash.err.log'
$Port      = 7890
$ProxyUrl  = "http://127.0.0.1:$Port"
$CtrlUrl   = 'http://127.0.0.1:9090'
$RegPath   = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'

function Log   { if (-not $Quiet) { Write-Host ("{0}" -f ($args -join ' ')) -ForegroundColor Cyan } }
function Ok    { if (-not $Quiet) { Write-Host ("{0}" -f ($args -join ' ')) -ForegroundColor Green } }
function Warn  { if (-not $Quiet) { Write-Host ("{0}" -f ($args -join ' ')) -ForegroundColor Yellow } }
function Fail  { if (-not $Quiet) { Write-Host ("{0}" -f ($args -join ' ')) -ForegroundColor Red } }

# ---------------- 基础工具 ----------------
function Get-ProfileIndex {
  $m = Select-String -Path $ListFile -Pattern '^index: (\d+)' | Select-Object -First 1
  if (-not $m) { return 0 }
  return [int]$m.Matches[0].Groups[1].Value
}

function Get-ProfileFiles {
  @(Select-String -Path $ListFile -Pattern '^  - time: (\S+\.yml)' | ForEach-Object { $_.Matches[0].Groups[1].Value })
}

# 返回 @{ File = '...'; Name = '...' } 列表
function Get-ProfileMeta {
  $content = Get-Content -LiteralPath $ListFile -Raw -Encoding UTF8
  $out = @()
  $entries = [regex]::Split($content, '(?m)^  - time: ')
  foreach ($e in $entries) {
    if ($e -match '^(\S+\.yml)\r?\n    name: (.+?)\r?\n') {
      $out += [pscustomobject]@{ File = $Matches[1]; Name = $Matches[2].Trim() }
    }
  }
  return $out
}

function Resolve-ProfilePath {
  param([string]$Spec)
  $files = Get-ProfileFiles
  $meta  = Get-ProfileMeta

  if ([string]::IsNullOrWhiteSpace($Spec)) {
    $idx = Get-ProfileIndex
    if ($idx -lt 0 -or $idx -ge $files.Count) { throw "list.yml index $idx 越界" }
    return Join-Path $Profiles $files[$idx]
  }
  if ($Spec -match '^\d+$') {
    $i = [int]$Spec
    if ($i -lt 0 -or $i -ge $files.Count) { throw "索引 $Spec 越界（可用 0..$($files.Count - 1)）" }
    return Join-Path $Profiles $files[$i]
  }
  if (Test-Path -LiteralPath $Spec) { return (Resolve-Path -LiteralPath $Spec).Path }
  $cand = Join-Path $Profiles $Spec
  if (Test-Path -LiteralPath $cand) { return $cand }
  # 按订阅名匹配
  $hit = $meta | Where-Object { $_.Name -like "*$Spec*" } | Select-Object -First 1
  if ($hit) { return Join-Path $Profiles $hit.File }
  # 按文件名模糊匹配
  $fhit = Get-ChildItem -LiteralPath $Profiles -Filter *.yml | Where-Object { $_.Name -like "*$Spec*" } | Select-Object -First 1
  if ($fhit) { return $fhit.FullName }
  throw "找不到配置: $Spec"
}

function Test-PortOpen {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Get-ManagedPid {
  if (Test-Path -LiteralPath $PidFile) {
    $n = 0
    $raw = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    if ([int]::TryParse($raw, [ref]$n)) { return $n }
  }
  return $null
}

# ---------------- 系统代理 ----------------
$script:OldProxyEnable = $null
$script:OldProxyServer = $null
$script:SysProxyStateFile = Join-Path $RunDir 'sysproxy-state.txt'

function Enable-SystemProxy {
  if (-not (Test-Path -LiteralPath $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }
  $p = Get-ItemProperty -Path $RegPath -ErrorAction SilentlyContinue
  $script:OldProxyEnable = $p.ProxyEnable
  $script:OldProxyServer = $p.ProxyServer
  # 原状态落盘，供其他进程（如 -Stop）恢复
  $state = ("{0}`n{1}" -f $script:OldProxyEnable, $script:OldProxyServer)
  [System.IO.File]::WriteAllText($script:SysProxyStateFile, $state, (New-Object System.Text.UTF8Encoding($false)))
  Set-ItemProperty -Path $RegPath -Name ProxyEnable -Value 1
  Set-ItemProperty -Path $RegPath -Name ProxyServer -Value $ProxyUrl
  Ok "已开启系统代理 $ProxyUrl"
}

function Disable-SystemProxy {
  $restored = $false
  if (Test-Path -LiteralPath $script:SysProxyStateFile) {
    $lines = @(Get-Content -LiteralPath $script:SysProxyStateFile -Encoding UTF8)
    if ($lines.Count -ge 1 -and $lines[0] -match '^\d+$') {
      Set-ItemProperty -Path $RegPath -Name ProxyEnable -Value ([int]$lines[0])
    }
    if ($lines.Count -ge 2 -and -not [string]::IsNullOrWhiteSpace($lines[1])) {
      Set-ItemProperty -Path $RegPath -Name ProxyServer -Value $lines[1].Trim()
    }
    Remove-Item -LiteralPath $script:SysProxyStateFile -Force -ErrorAction SilentlyContinue
    $restored = $true
    Ok '已恢复系统代理设置'
  } elseif ($null -ne $script:OldProxyEnable) {
    Set-ItemProperty -Path $RegPath -Name ProxyEnable -Value $script:OldProxyEnable
    if ($null -ne $script:OldProxyServer) { Set-ItemProperty -Path $RegPath -Name ProxyServer -Value $script:OldProxyServer }
    $restored = $true
    Ok '已恢复系统代理设置'
  }
  if (-not $restored) {
    # 回退：若系统代理仍指向本代理端口（127.0.0.1:7890），则关闭
    $cur = Get-ItemProperty -Path $RegPath -ErrorAction SilentlyContinue
    if ($cur.ProxyEnable -eq 1 -and "$($cur.ProxyServer)" -match '127\.0\.0\.1:7890') {
      Set-ItemProperty -Path $RegPath -Name ProxyEnable -Value 0
      Ok '系统代理已关闭（原状态未知）'
    }
  }
}

# ---------------- 节点选择 ----------------
# 等待 external-controller 就绪（混合端口先起，控制器稍后才绑定）
function Wait-Controller {
  $deadline = (Get-Date).AddSeconds(15)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Uri "$CtrlUrl/version" -TimeoutSec 3 | Out-Null
      return $true
    } catch { Start-Sleep -Milliseconds 500 }
  }
  return $false
}

function Set-ProxyGroup {
  param([string]$Group, [string]$NodeName)
  $g = [uri]::EscapeDataString($Group)
  # 注意：必须用 UTF-8 字节发送，否则中文/emoji 节点名会被编码破坏导致 400
  $body = [System.Text.Encoding]::UTF8.GetBytes((@{ name = $NodeName } | ConvertTo-Json))
  for ($i = 0; $i -lt 3; $i++) {
    try {
      Invoke-RestMethod -Method Put -Uri "$CtrlUrl/proxies/$g" -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 5 | Out-Null
      return $true
    } catch {
      if ($i -lt 2) { Start-Sleep -Milliseconds 800 }
    }
  }
  return $false
}

function Apply-NodeSelection {
  param([string]$ProfilePath, [string]$NodeOverride)

  if ([string]::IsNullOrWhiteSpace($NodeOverride)) {
    # 恢复 list.yml 里该配置记录的选择
    $content = Get-Content -LiteralPath $ListFile -Raw -Encoding UTF8
    $fname   = [System.IO.Path]::GetFileName($ProfilePath)
    $block   = [regex]::Split($content, '(?m)^  - time: ') | Where-Object { $_ -match "^$([regex]::Escape($fname))" } | Select-Object -First 1
    if ($block) {
      $pairs = [regex]::Matches($block, '(?m)^\s+- name: (.+?)\r?\n\s+now: (.+?)$')
      foreach ($p in $pairs) {
        $grp = $p.Groups[1].Value.Trim()
        $nodeName = $p.Groups[2].Value.Trim()
        if ($nodeName -and $nodeName -ne 'DIRECT' -and $nodeName -ne 'REJECT') {
          if (Set-ProxyGroup -Group $grp -NodeName $nodeName) { Ok "组 [$grp] -> $nodeName" }
          else { Warn "组 [$grp] 节点设置失败（控制器未就绪？）" }
        }
      }
    }
  } else {
    # 手动指定节点：应用到所有包含该节点的 select 组
    try {
      $all = Invoke-RestMethod -Uri "$CtrlUrl/proxies" -TimeoutSec 10
      foreach ($prop in $all.proxies.PSObject.Properties) {
        $g = $prop.Value
        if ($g.type -eq 'Selector' -and $g.all -contains $NodeOverride) {
          if (Set-ProxyGroup -Group $prop.Name -NodeName $NodeOverride) { Ok "组 [$($prop.Name)] -> $NodeOverride" }
        }
      }
    } catch { Warn "节点选择失败: $($_.Exception.Message)" }
  }
}

# 从配置文件中提取真实节点名（proxies: 段，最多 $Limit 个）
function Get-ProxyNames {
  param([string]$ProfilePath, [int]$Limit = 20)
  $names = @()
  $inProxies = $false
  foreach ($ln in (Get-Content -LiteralPath $ProfilePath -Encoding UTF8)) {
    if ($ln -match '^proxies:') { $inProxies = $true; continue }
    if ($inProxies) {
      if ($ln -match '^[a-zA-Z0-9-]+:') { break }   # 下一个顶层键
      if ($ln -match '^\s+-\s*\{?name:\s*([^,}]+)') { $names += $Matches[1].Trim() }
      if ($names.Count -ge $Limit) { break }
    }
  }
  return $names
}

# 测单个节点延迟（毫秒），失败返回 $null
function Test-NodeDelay {
  param([string]$NodeName)
  try {
    $n = [uri]::EscapeDataString($NodeName)
    $r = Invoke-RestMethod -Uri "$CtrlUrl/proxies/$n/delay?timeout=2500&url=http://www.gstatic.com/generate_204" -TimeoutSec 6
    return [int]$r.delay
  } catch { return $null }
}

# 扫描候选节点，返回按延迟排序的可用列表 @{ name; delay }
function Find-LiveNodes {
  param([string[]]$Names)
  $live = @()
  foreach ($n in $Names) {
    $d = Test-NodeDelay -NodeName $n
    if ($null -ne $d) { $live += [pscustomobject]@{ name = $n; delay = $d } }
  }
  return ($live | Sort-Object delay)
}

# 把某节点应用到 GLOBAL 及所有包含该节点的 select 组
function Apply-NodeToGroups {
  param([string]$NodeName)
  $applied = $false
  if (Set-ProxyGroup -Group 'GLOBAL' -NodeName $NodeName) { Ok "GLOBAL -> $NodeName"; $applied = $true }
  try {
    $all = Invoke-RestMethod -Uri "$CtrlUrl/proxies" -TimeoutSec 10
    foreach ($prop in $all.proxies.PSObject.Properties) {
      $g = $prop.Value
      if ($prop.Name -ne 'GLOBAL' -and $g.type -eq 'Selector' -and $g.all -contains $NodeName) {
        if (Set-ProxyGroup -Group $prop.Name -NodeName $NodeName) { Ok "组 [$($prop.Name)] -> $NodeName"; $applied = $true }
      }
    }
  } catch { Warn "组扫描失败: $($_.Exception.Message)" }
  return $applied
}

# 走代理请求被墙站点，能返回 204 才算"有效代理"（避免把直连当成代理）
function Test-ProxyHealth {
  param([string]$Url = 'https://www.google.com/generate_204')
  try {
    $r = Invoke-WebRequest -Uri $Url -Proxy $ProxyUrl -UseBasicParsing -TimeoutSec 10
    return ($r.StatusCode -eq 204)
  } catch { return $false }
}

# 自检（较宽松的超时，用于主流程）
function Test-ProxyConnectivity {
  param([string]$Url = 'https://www.google.com/generate_204')
  try {
    $r = Invoke-WebRequest -Uri $Url -Proxy $ProxyUrl -UseBasicParsing -TimeoutSec 15
    return ($r.StatusCode -eq 204)
  } catch { return $false }
}

# 确保代理可用：自检不通时（且未显式指定 -Node）自动扫描并切换可用节点
function Ensure-WorkingNode {
  param([string]$ProfilePath, [string]$NodeOverride)

  if (Test-ProxyConnectivity) { return $true }

  if (-not [string]::IsNullOrWhiteSpace($NodeOverride)) {
    Warn "自检失败：指定节点 [$NodeOverride] 可能不可用"
    return $false
  }

  Warn '自检失败：当前节点不可用，自动扫描可用节点...'
  $candidates = @(Get-ProxyNames -ProfilePath $ProfilePath -Limit 12)
  if (-not [string]::IsNullOrWhiteSpace($Region)) {
    $filtered = @($candidates | Where-Object { $_ -like "*$Region*" })
    if ($filtered.Count -gt 0) { $candidates = $filtered; Log ("按地区 [$Region] 过滤，候选 {0} 个" -f $filtered.Count) }
    else { Warn "没有匹配地区 [$Region] 的节点，使用全部候选" }
  }
  if ($candidates.Count -eq 0) { Warn '配置中没有解析到节点'; return $false }
  $live = @(Find-LiveNodes -Names $candidates)
  if ($live.Count -eq 0) { Warn '扫描完毕，没有可用节点（订阅可能已失效）'; return $false }

  Ok ("找到延迟可达节点 {0} 个，按延迟逐个用真实 HTTPS 验证:" -f $live.Count)
  # 延迟通 ≠ HTTPS 通，逐个切换并做真实自检（最多试 5 个）
  foreach ($n in ($live | Select-Object -First 5)) {
    Log ("  尝试节点: {0} ({1}ms)" -f $n.name, $n.delay)
    Apply-NodeToGroups -NodeName $n.name | Out-Null
    if (Test-ProxyConnectivity) {
      Ok "  使用节点: $($n.name)"
      return $true
    }
    Warn "  节点 $($n.name) HTTPS 不通，换下一个"
  }
  Warn '候选节点均无法完成真实 HTTPS 连接'
  return $false
}

function Start-Core {
  param([string]$ProfilePath)

  if (Test-PortOpen) {
    $owner = (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
    if (Test-ProxyHealth) {
      Warn "端口 $Port 已有可用代理（进程 $owner），直接复用"
      # 收养：若当前无托管实例（或已失效），把占用进程登记为托管，保证 -Stop 能关掉
      $managed = Get-ManagedPid
      $managedAlive = ($managed -and (Get-Process -Id $managed -ErrorAction SilentlyContinue))
      if (-not $managedAlive) {
        if (-not (Test-Path -LiteralPath $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }
        $owner | Out-File -LiteralPath $PidFile -Encoding UTF8
      }
      return $false
    }
    Warn "端口 $Port 被进程 $owner 占用，但代理不通（坏配置/直连）"
    if ($NoTakeover) { throw "请先释放端口 $Port（已指定 -NoTakeover 禁止自动接管）" }
    $ownerPath = $null
    try { $ownerPath = (Get-Process -Id $owner -ErrorAction SilentlyContinue).Path } catch {}
    if ($ownerPath -and $ownerPath.StartsWith($AppDir, [System.StringComparison]::OrdinalIgnoreCase)) {
      Warn "占用进程是 Clash 核心 ($ownerPath)，自动终止并接管"
      Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 800
    } else {
      throw "端口 $Port 被非 Clash 进程占用 ($ownerPath)，请手动释放"
    }
  }
  if (-not (Test-Path -LiteralPath $CoreExe)) { throw "找不到 Clash 核心: $CoreExe" }
  if (-not (Test-Path -LiteralPath $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }

  # 复制 geoip 数据库到运行目录（4MB，核心启动需要）
  $mmdb = Join-Path $DataDir 'Country.mmdb'
  if (Test-Path -LiteralPath $mmdb) {
    Copy-Item -LiteralPath $mmdb -Destination (Join-Path $RunDir 'Country.mmdb') -Force
  }

  Log "启动核心: $CoreExe"
  # 注意：路径含空格时必须手动加引号，否则会被拆成多个参数
  $argStr = "-d `"$RunDir`" -f `"$ProfilePath`""
  $proc = Start-Process -FilePath $CoreExe `
    -ArgumentList $argStr `
    -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
  $proc.Id | Out-File -LiteralPath $PidFile -Encoding UTF8

  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen) { return $true }
    if ($proc.HasExited) { throw "Clash 启动失败(退出码 $($proc.ExitCode))，日志见 $ErrLog" }
    Start-Sleep -Milliseconds 500
  }
  throw "等待 30 秒端口 $Port 未就绪，日志见 $ErrLog"
}

function Stop-Core {
  $pidN = Get-ManagedPid
  if ($pidN) {
    Stop-Process -Id $pidN -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 300
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    Ok "已关闭本脚本启动的 Clash (pid $pidN)"
  } else {
    Warn '未找到由本脚本启动的 Clash（可能已被手动关闭）'
  }
  Disable-SystemProxy
}

# ---------------- 状态 ----------------
function Show-Status {
  $listening = Test-PortOpen
  $pidN = Get-ManagedPid
  $procAlive = $false
  if ($pidN) { $procAlive = [bool](Get-Process -Id $pidN -ErrorAction SilentlyContinue) }

  Write-Host ''
  Write-Host '==== Clash 状态 ====' -ForegroundColor Cyan
  if ($listening) {
    $owner = (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
    Ok "代理端口 $Port : 监听中 (进程 $owner)"
  } else {
    Warn "代理端口 $Port : 未监听"
  }
  if ($pidN) {
    if ($procAlive) { Ok "托管实例 : 运行中 (pid $pidN)" } else { Warn "托管实例 : pid $pidN 已退出" }
  } else {
    Warn '托管实例 : 无'
  }
  $p = Get-ItemProperty -Path $RegPath -ErrorAction SilentlyContinue
  Write-Host ("系统代理 : ProxyEnable={0} ProxyServer={1}" -f $p.ProxyEnable, $p.ProxyServer) -ForegroundColor Gray

  Write-Host ''
  Write-Host '==== 可用订阅 ====' -ForegroundColor Cyan
  $meta = Get-ProfileMeta
  $files = Get-ProfileFiles
  for ($i = 0; $i -lt $meta.Count; $i++) {
    $mark = if ($i -eq (Get-ProfileIndex)) { ' <-- 当前' } else { '' }
    Write-Host ("[{0}] {1}  ({2}){3}" -f $i, $meta[$i].Name, $meta[$i].File, $mark) -ForegroundColor White
  }
  Write-Host ''
}

# ---------------- 主流程 ----------------
if ($Status) { Show-Status; exit 0 }
if ($Stop)   { Stop-Core; exit 0 }

$profilePath = Resolve-ProfilePath $Profile
Log "使用配置: $([System.IO.Path]::GetFileName($profilePath))"

$code = 0
try {
  $started = Start-Core -ProfilePath $profilePath

  if (Test-PortOpen) {
    Ok "代理就绪: $ProxyUrl"
    if ($SystemProxy) { Enable-SystemProxy }
    if (Wait-Controller) {
      Apply-NodeSelection -ProfilePath $profilePath -NodeOverride $Node
    } else {
      Warn "控制器 $CtrlUrl 未就绪，跳过节点选择"
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($ProxyTest)) {
    if (Ensure-WorkingNode -ProfilePath $profilePath -NodeOverride $Node) {
      Ok "自检通过: $ProxyTest"
    } else {
      Fail '自检失败：没有可用代理节点'
      Stop-Core
      exit 1
    }
    Stop-Core
    exit 0
  }

  if (-not [string]::IsNullOrWhiteSpace($Command)) {
    # 先确保代理可用（含自动换活节点），再执行命令
    if (-not (Ensure-WorkingNode -ProfilePath $profilePath -NodeOverride $Node)) {
      Warn '代理未就绪，命令可能失败，仍将执行'
    }
    $oldHttp   = $env:HTTP_PROXY
    $oldHttps  = $env:HTTPS_PROXY
    $env:HTTP_PROXY  = $ProxyUrl
    $env:HTTPS_PROXY = $ProxyUrl
    try {
      Log "执行命令: $Command"
      cmd /c $Command
      $code = $LASTEXITCODE
      Log "命令退出码: $code"
    } finally {
      $env:HTTP_PROXY  = $oldHttp
      $env:HTTPS_PROXY = $oldHttps
    }
    Stop-Core
    exit $code
  }

  # 无命令模式：确保可用节点后保持运行
  if (-not (Ensure-WorkingNode -ProfilePath $profilePath -NodeOverride $Node)) {
    Warn '没有可用代理节点，但仍保持运行（可稍后手动 -Node 指定）'
  }
  # 幂等：若已有另一个脚本实例在常驻运行，本实例退出（用脚本 pid 文件判断，与核心 pid 无关）
  $scriptPidFile = Join-Path $RunDir 'clash-script.pid'
  $otherScript = $null
  if (Test-Path -LiteralPath $scriptPidFile) {
    $n = 0
    if ([int]::TryParse((Get-Content -LiteralPath $scriptPidFile -Raw).Trim(), [ref]$n)) { $otherScript = $n }
  }
  if ($otherScript -and $otherScript -ne $PID -and (Get-Process -Id $otherScript -ErrorAction SilentlyContinue)) {
    Warn "已有常驻脚本实例 (pid $otherScript) 在运行，本实例退出"
    exit 0
  }
  if (-not (Test-Path -LiteralPath $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }
  $PID | Out-File -LiteralPath $scriptPidFile -Encoding UTF8
  $script:StopNow = $false
  try {
    [Console]::CancelKeyPress += {
      param($s, $e)
      $e.Cancel = $true
      $script:StopNow = $true
    }
  } catch { }   # 非交互环境（如后台任务）没有 CancelKeyPress，忽略即可
  Write-Host 'Clash 已就绪。按 Ctrl+C 关闭，或另开终端执行: .\clash.ps1 -Stop' -ForegroundColor Yellow
  while (-not $script:StopNow) {
    Start-Sleep -Seconds 2
    # 被外部 -Stop 关闭（pid 文件被删/核心已退出）时，本实例自动退出
    $alive = Get-ManagedPid
    if (-not $alive) { break }
    if (-not (Get-Process -Id $alive -ErrorAction SilentlyContinue)) { break }
  }
  Remove-Item -LiteralPath $scriptPidFile -Force -ErrorAction SilentlyContinue
  Stop-Core
  exit 0

} catch {
  Fail "错误: $_"
  Stop-Core
  exit 1
}
