# process-pet-action.ps1 — 鲸鱼娘桌宠动作素材处理管线
# 输入：Ref2VA 生成的绿幕 mp4（1:1 方屏、纯绿 RGB~80,224,0、24fps）
# 输出：outputs/imagegen/pet/<action>_0/1.png..N.png（220x220 透明 PNG 序列）
#
# 用法：
#   .\process-pet-action.ps1 -Action eat -Mp4 "G:\...\pet-eat-720p.mp4" -Fps 8
#   .\process-pet-action.ps1 -Action dance -Mp4 "G:\...\pet-dance-720p.mp4" -Fps 12
#
# 帧数规格：8fps -> 41 帧；12fps -> 62 帧（由源视频帧数推算，自动取整）

param(
  [Parameter(Mandatory = $true)][string]$Action,
  [Parameter(Mandatory = $true)][string]$Mp4,
  [ValidateSet(8, 12)][int]$Fps = 8,
  [double]$Scale = 1.0,
  [string]$OutRoot = "G:\deepseek harness\outputs\imagegen"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $Mp4)) { throw "mp4 not found: $Mp4" }

# 读源视频帧数（24fps 假设；若不同按实际比例取帧）
$probe = ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 $Mp4 2>$null
if (-not $probe -or $probe -match '^N/A') { $probe = ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 $Mp4 2>$null }
$srcFrames = [int]($probe.Trim())
$fpsStr = (ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 $Mp4 2>$null | ForEach-Object { $_.Trim() })
$srcFps = [double]1
if ($fpsStr -match '^(\d+)/(\d+)$') { $srcFps = [double]$matches[1] / [double]$matches[2] }
elseif ($fpsStr -match '^(\d+(?:\.\d+)?)$') { $srcFps = [double]$matches[1] }
$targetFrames = [math]::Round($srcFrames * $Fps / $srcFps)
if ($Fps -eq 8 -and $targetFrames -gt 41) { $targetFrames = 41 }
if ($Fps -eq 12 -and $targetFrames -gt 62) { $targetFrames = 62 }
Write-Host "source: ${srcFrames}f @ ${srcFps}fps -> target ${targetFrames}f @ ${Fps}fps"

$outDir = Join-Path $OutRoot "pet\${Action}_0"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
# 清理旧帧
Get-ChildItem $outDir -Filter *.png -ErrorAction SilentlyContinue | Remove-Item -Force

# Scale<1 时先缩小角色再透明 pad 回 220x220（保持与其他动作一致的比例）
$canvas = 220
$inner = [int][math]::Floor($canvas * $Scale / 2) * 2
if ($inner -lt 16) { $inner = 16 }
if ($Scale -lt 1.0) {
  $off = [int](($canvas - $inner) / 2)
  $vf = "chromakey=0x50E000:0.12:0.10,despill=green,fps=$Fps,scale=${inner}:${inner}:flags=lanczos,pad=${canvas}:${canvas}:${off}:${off}:color=0x00000000,format=rgba"
} else {
  $vf = "chromakey=0x50E000:0.12:0.10,despill=green,fps=$Fps,scale=220:220:flags=lanczos,format=rgba"
}
ffmpeg -y -loglevel error -i $Mp4 -vf $vf -start_number 1 -frames:v $targetFrames "$outDir\%d.png"
if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed" }

$n = (Get-ChildItem $outDir -Filter *.png).Count
Write-Host "OK: ${Action}_0 -> $n frames at $outDir"
