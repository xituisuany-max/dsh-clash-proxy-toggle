# 🐳 dsh-client-ui-pet — DSH 鲸鱼娘桌宠插件

一只住在 DSH Web GUI 角落的 Q 版蓝发女仆鲸鱼娘。

## 功能（v0.3）

- **可拖动 + 多吸附点**：拖到任意位置松手，自动吸附最近的目标——**4 个屏幕角 + 聊天输入框上方（左/中/右 3 个点）**，拖到输入框上方松开即吸附（"鲸鱼娘看着你输入"）；吸附位置持久化，刷新/窗口缩放后自动重新对齐；**快速甩出**会播放游泳动作并回弹归位
- **23 个动作序列帧动画**（素材经本地 proxy-bridge `/media/pet/<action>_0/<n>.png` 提供）：

  | 动作 | 帧数 | 帧率 | 循环 | 触发 |
  |---|---|---|---|---|
  | idle 待机 | 41 | 8 fps | ✅ | 默认（站姿） |
  | sit 坐姿待机 | 41 | 8 fps | ✅ | 吸附在输入框上方时（隐形椅子悬空坐姿+晃腿摇脑袋） |
  | sit_happy 坐姿拍手 | 41 | 8 fps | ❌ | **仅坐姿**：单击 / 双击循环 / 随机小动作 |
  | sit_wave 坐姿挥手 | 41 | 8 fps | ❌ | **仅坐姿**：双击循环 / 悬停 / 窗口失焦 |
  | sit_think 坐姿思考 | 41 | 8 fps | ✅ | **仅坐姿**：agent 运行中（托腮晃腿） |
  | sit_sleep 坐姿瞌睡 | 41 | 8 fps | ✅ | **仅坐姿**：空闲 90s（头一点一点打瞌睡） |
  | sit_eat 坐姿干饭 | 41 | 8 fps | ❌ | **仅坐姿**：思考干饭 / 关键词"吃/饿/干饭" |
  | sit_stretch 坐姿伸懒腰 | 41 | 8 fps | ❌ | **仅坐姿**：随机小动作 / 双击循环 |
  | happy 开心 | 62 | 12 fps | ❌ | 单击 / 任务完成 |
  | wave 挥手 | 41 | 8 fps | ❌ | 双击循环 / 悬停小概率 / 窗口失焦 |
  | sleep 睡觉 | 41 | 8 fps | ✅ | 双击循环 / 空闲 90s / 深夜小概率 |
  | cry 哭哭 | 41 | 8 fps | ❌ | 双击循环 / 任务出错 |
  | think 思考 | 41 | 8 fps | ✅ | agent 运行中 |
  | drag 拖拽 | 41 | 8 fps | ✅ | 拖拽移动中 |
  | eat 干饭 | 41 | 8 fps | ❌ | 关键词"吃/饿/干饭" / 右键点播 / **思考时偶尔干饭（吃完继续思考）** |
  | dance 跳舞 | 62 | 12 fps | ✅ | 双击循环 / 任务成功且多工具时小概率 / 关键词"跳舞" |
  | blush 害羞 | 41 | 8 fps | ❌ | 长按 600ms 摸摸头 / 双击循环 / 关键词"辛苦/摸摸/可爱" |
  | surprise 惊吓 | 41 | 8 fps | ❌ | 任务开始瞬间 / 页面恢复可见 |
  | stretch 伸懒腰 | 41 | 8 fps | ❌ | 随机小动作 |
  | angry 生气 | 41 | 8 fps | ❌ | 双击循环 / 同一 turn 连续 2 次出错 / 关键词"生气" |
  | music 唱歌 | 62 | 12 fps | ✅ | 双击循环 / 关键词"唱歌" |
  | swim 游泳 | 41 | 8 fps | ✅ | 拖拽甩出 / 关键词"游泳" |
  | wait 等待 | 41 | 8 fps | ✅ | 审批等待 / 长任务运行超 60s |

- **鼠标交互**：
  - **单击**：蹦跳 + 随机台词气泡
  - **长按 600ms**：害羞摸头 + 「呜…好舒服~」
  - **双击**：循环切换 wave → sleep → cry → dance → angry → blush（带气泡提示）
  - **悬停 1.5s**：小概率挥手 + 「嗯？主人在看鲸鱼娘~」（30s 冷却）
  - **滚轮**：缩放 80%–150%
  - **右键菜单**：动作点播（**滑动选择器**：滚轮/拖动切换、滑动实时预览、点击播放）、设置面板、重置位置、隐藏桌宠
- **会话状态联动**：
  - 任务开始 → surprise + 「开工啦！」→ think
  - 运行中 → think；超 60s → wait
  - **审批等待** → wait + 「等主人审批中…」
  - 同一 turn 连续 2 次工具出错 → angry
  - 任务结束出错 → cry；成功 → happy（多工具时小概率 dance 庆祝）
  - 空闲 90s → sleep；5 分钟 → 深度气泡「呼…呼…Zzz」
  - 用户新指令唤醒 → idle + 「嗯？主人叫我~」
  - **关键词触发**：对用户消息文本匹配「睡觉/跳舞/唱歌/吃/辛苦/摸摸/生气/游泳/你好」等 → 对应动作
- **时间型**：整点报时、首次交互时段问候（早/午/晚/夜）、深夜 23–6 点提醒（每天一次，可开关）
- **Token 统计汇报**：累计各会话 `tokenUsage` 投影的当日增量（localStorage 按天记账，跨天自动重置）；**随机汇报**（每 15–40 分钟一次 + 任务完成时 15% 概率）——汇报时气泡显示「今日已用 X tokens，剩余 Y tokens~」并**自动播放吃白饭动作**（坐姿时自动切坐姿干饭）；每日预算可在设置面板调整（剩余 = 预算 − 今日用量）
- **随机小动作**：空闲时每 40–90s 随机伸懒腰 / 害羞 / 小挥手（最低优先级，不打断状态动作）
- **粒子特效**：happy/跳舞→爱心音符、哭哭→泪滴、睡觉→Zzz、游泳→泡泡、害羞→脸红、生气→💢
- **偏好持久化**（localStorage `dshPetPrefs.v3`）：位置、大小、透明度、台词/整点/随机/深夜开关、每日预算
- **设置面板**（右键菜单 → 设置）：大小滑杆、透明度滑杆、四个开关、每日预算输入、重置位置、隐藏
- 明暗主题自适应（气泡/菜单/面板用 DSH 主题 CSS 变量）、低配降级（无帧回退静态图）

## 动作优先级（打断规则）

```
用户主动(0) > 会话状态(1) > 时间型(2) > 随机小动作(3) > idle(99)
```

- 低优先级不能打断高优先级；用户动作打断状态动作后，播完自动恢复
- sleep 只能被用户动作或唤醒打断

## 素材规格

- 23 个动作均为 RunningHub MiniMax H3 **多图生视频（Ref2VA）** 生成，1:1 方屏，纯绿幕（RGB ~80,224,0）
- 本地 chroma-key 抠图（`scripts/process-pet-action.ps1`，chromakey + despill）→ 透明 PNG 序列帧（220×220）
- 角色：深蓝渐变长卷发 + 鱼鳍发梢 + 呆毛、蓝白女仆装、围裙印蓝色小鲸鱼、蓝色鱼尾、Q 版 2-3 头身

## 结构

```
dsh-pet/
├── package.json         # @dsh-external/dsh-client-ui-pet v0.3.0
├── cordis.patch.yml     # Cordis 补丁（客户端插件注册）
├── docs/
│   └── plan-more-animations-triggers.md   # v0.3 扩展计划（含决策记录）
├── scripts/
│   └── process-pet-action.ps1             # 绿幕 mp4 → 220×220 透明序列帧管线
└── lib/
    ├── index.js         # 插件入口（转发 client）
    └── client.js        # 桌宠 UI：动作优先级引擎/交互/联动/时间型/粒子/设置
```

## 安装（本机开发）

1. 在 DSH 的 web profile 注册依赖与 bundle：

   `%APPDATA%\deepseek-harness-desktop\harness-home\profiles\web\package.json`
   → `dependencies` 加 `"@dsh-external/dsh-client-ui-pet": "file:G:/deepseek harness/dsh-pet"`
   → `bundles` 数组加 `"@dsh-external/dsh-client-ui-pet"`

2. 建立 node_modules junction：

   ```powershell
   New-Item -ItemType Junction -Path "<profiles>\web\node_modules\@dsh-external\dsh-client-ui-pet" -Target "G:\deepseek harness\dsh-pet"
   ```

3. 桥接（proxy-bridge）需运行并放行 `pet/` 子目录媒体：

   ```powershell
   $env:PROXY_BRIDGE_MEDIA_DIR = 'G:\deepseek harness\outputs\imagegen'
   node "G:\deepseek harness\dsh-clash-proxy-toggle\bridge\proxy-bridge.cjs"
   ```

4. 强刷 DSH Web（Ctrl+F5），右下角出现鲸鱼娘。

## 序列帧素材位置

- 帧目录：`G:\deepseek harness\outputs\imagegen\pet\{idle,happy,wave,sleep,cry,think,drag,eat,dance,blush,surprise,stretch,angry,music,swim,wait}_0\{1..N}.png`
- 源视频：`G:\deepseek harness\outputs\imagegen\pet-*-720p.mp4`（1:1 绿幕）
- 角色参考：`G:\deepseek harness\outputs\imagegen\鲸鱼娘三视图.png`
- Ref2VA 提示词：`G:\deepseek harness\outputs\pet-ref2va-prompt-*.txt`

## License

MIT
