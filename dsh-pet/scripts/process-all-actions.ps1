# process-all-actions.ps1 — 批量处理全部动作素材（绿幕 mp4 → 220x220 透明序列帧）
# 对每个动作：若 outputs/imagegen/pet-<action>-720p.mp4 存在则调用 process-pet-action.ps1
# 8fps 动作 41 帧；12fps 动作（happy/dance/music）62 帧

param(
  [string]$OutRoot = "G:\deepseek harness\outputs\imagegen"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$actions = @(
  @{ name = "idle";     fps = 8  },
  @{ name = "happy";    fps = 12 },
  @{ name = "wave";     fps = 8  },
  @{ name = "sleep";    fps = 8  },
  @{ name = "cry";      fps = 8  },
  @{ name = "think";    fps = 8  },
  @{ name = "drag";     fps = 8  },
  @{ name = "eat";      fps = 8  },
  @{ name = "dance";    fps = 12 },
  @{ name = "blush";    fps = 8  },
  @{ name = "surprise"; fps = 8  },
  @{ name = "stretch";  fps = 8  },
  @{ name = "angry";    fps = 8  },
  @{ name = "music";    fps = 12 },
  @{ name = "swim";     fps = 8  },
  @{ name = "wait";     fps = 8  }
)

$done = 0; $skipped = 0
foreach ($a in $actions) {
  $mp4 = Join-Path $OutRoot "pet-$($a.name)-720p.mp4"
  if (-not (Test-Path $mp4)) { Write-Host "skip $($a.name): no mp4"; $skipped++; continue }
  Write-Host "=== $($a.name) (${fps}fps) ==="
  & (Join-Path $scriptDir "process-pet-action.ps1") -Action $a.name -Mp4 $mp4 -Fps $a.fps -OutRoot $OutRoot
  if ($LASTEXITCODE -eq 0) { $done++ }
}
Write-Host "done=$done skipped=$skipped"
