# Changelog

## [v0.3.1] - 2026-08-14

### 🔧 修复

- **看门狗不再弹黑色控制台窗口**：Task Scheduler 直接启动 `powershell.exe` 时，即使带 `-WindowStyle Hidden`，conhost 仍会在隐藏样式生效前闪一下（每 2 分钟一次）。改用 `wscript.exe` + `bridge/bridge-watchdog.vbs`（GUI 子系统宿主，永远不会创建控制台），并用 `MSXML2.ServerXMLHTTP` 直接探测桥接健康端点，全程零窗口、零 PowerShell
- 计划任务 `dsh-bridge-watchdog` 本体标记为 Hidden，任务列表不再显示

### 📦 新增

- `bridge/bridge-watchdog.vbs` — 无窗口看门狗（支持 `PROXY_BRIDGE_PORT` / `NODE_EXE` / `PROXY_BRIDGE_MEDIA_DIR` 环境变量）

## [v0.3.0] - 2026-08-14

### ✨ 新增

- **QQ 风格框选截图**：输入框内 📷 按钮 → 调起开源 [Flameshot](https://github.com/flameshot-org/flameshot) 全屏框选（变暗 + 十字光标 + 拖动选区 + 标注工具栏 + 确认/Esc 取消）
- **截图自动进入输入框**：框选确认后图片自动作为附件出现在输入框（模拟粘贴事件 + 剪贴板写入），回车即可发送
- **顶栏强刷按钮（↻）**：纯白样式放在"标准模式"旁边，一键清缓存 + 重载（等价 Ctrl+F5，方便加载插件最新代码）
- **桥接自愈看门狗**：计划任务每 2 分钟检测桥接服务，挂了自动拉起（解决应用重启后桥接丢失问题）

### 🔧 改进

- 截图按钮样式运行时复制旁边圆形按钮（大小/白底/金边完全统一，明暗主题自适应）
- 按钮位置自动定位（输入框"+"之后、模式区旁边），DOM 变化自动重挂
- 依赖 Flameshot（winget 安装：`winget install Flameshot.Flameshot`），可用 `FLAMESHOT_EXE` 覆盖路径

## [v0.2.0] - 2026-08-14

### ✨ 新增

- **对话内音视频内嵌播放**：消息里的 `.mp4/.webm/.mov` 链接自动升级为内嵌视频播放器；`.mp3/.wav/.ogg/.m4a/.aac/.flac/.opus` 自动升级为音频播放条
- **桥接服务 `/media` 通道**：本地生成/处理的图片、视频、音频可通过 `http://127.0.0.1:54123/media/<文件>` 在对话框内联展示（图片即看即显）
- **鲸鱼开关细节面板**：节点、实时延迟（含彩色状态点：<300ms 绿 / <700ms 琥珀 / >700ms 红）、系统代理状态、节点切换下拉框、渐变主按钮、弹出动画、悬停/聚焦反馈
- **对话区媒体监听**：MutationObserver 自动升级新消息中的媒体链接，无需手动刷新

### 🔧 改进

- 代理脚本与桥接路径全面参数化（`config.env` / 环境变量），去除本机写死路径，便于他人安装
- 桥接服务支持 `PROXY_BRIDGE_MEDIA_DIR` / `CLASH_PS1` / `CLASH_PID_FILE` / `PROXY_BRIDGE_PORT` 环境变量
- 明暗主题自适应（`--dsw-alias-*` 变量），与 DeepSeek Harness UI 风格一致

### 📦 组成

- `clash.ps1` — Clash 代理管理脚本（启动/停止/换节点/自检/自动接管/自动换活节点）
- `bridge/proxy-bridge.cjs` — 本地 HTTP 桥接服务（状态/节点/媒体通道）
- `dsh-plugin/` — DSH 客户端插件（鲸鱼开关 + 媒体内嵌）
- `launchers/` — 双击即用的 .bat 模板

## [v0.1.0] - 2026-08-14

### 初始版本

- 右上角小鲸鱼代理开关（绿肚子 = 开启）
- 悬停详情面板：节点、延迟、系统代理、节点切换
- Clash 代理一键启停、自动接管、自动换活节点
- 开机自启桥接服务
