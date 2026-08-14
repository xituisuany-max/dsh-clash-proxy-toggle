<div align="center">

# 🐋 dsh-clash-proxy-toggle

**DeepSeek Harness Web GUI 的 Clash 代理开关** — 右上角一只小鲸鱼，肚子变绿就是代理开着。

| 开启（绿肚子） | 关闭（无颜色） |
|---|---|
| ![on](docs/whale-on.png) | ![off](docs/whale-off.png) |

悬停鲸鱼弹出详情面板：节点 / 延迟 / 系统代理状态、切换节点、一键启停。

**对话内媒体直出**：生成的图片 / 视频 / 音频都能直接在对话框里看和播放 🎬🎵🖼️

</div>

---

## 🆕 更新（v0.3.0）

> 完整更新历史见 [CHANGELOG.md](CHANGELOG.md) · [Releases](https://github.com/xituisuany-max/dsh-clash-proxy-toggle/releases)

**v0.3.0** 新增：

- 🎯 **QQ 风格框选截图**：输入框 📷 按钮 → 调起 [Flameshot](https://github.com/flameshot-org/flameshot) 全屏框选（变暗 + 十字光标 + 拖动选区 + 标注工具栏 + 确认 / Esc 取消）
- 📎 **截图自动进输入框**：框选确认后图片自动作为附件出现在输入框（模拟粘贴 + 剪贴板），回车即发
- ↻ **顶栏强刷按钮**：纯白样式放在"标准模式"旁边，一键清缓存重载（等价 Ctrl+F5，加载插件最新代码）
- 🛡️ **桥接自愈看门狗**：每 2 分钟自检，桥接服务挂了自动拉起
- 🎨 **按钮样式统一**：截图按钮运行时复制旁边圆形按钮的尺寸/边框，明暗主题自适应

**v0.2.0** 新增：

- 🎬 **视频内嵌播放**：对话消息里的 `.mp4/.webm/.mov` 链接自动升级为内嵌视频播放器
- 🎵 **音频内嵌播放**：`.mp3/.wav/.ogg/.m4a/.aac/.flac/.opus` 链接自动升级为音频播放条
- 🖼️ **图片直出**：本地生成的图片经桥接 `/media` 通道在对话框内联显示（即看即显）
- 🐋 **鲸鱼开关细节面板升级**：实时延迟彩色状态点（<300ms 绿 / <700ms 琥珀 / >700ms 红）、节点切换下拉框、渐变主按钮、弹出动画、明暗主题自适应
- 🔧 **路径全面参数化**：`config.env` / 环境变量配置，去掉本机写死路径，他人可直接安装使用

---

## ✨ 特性

- **一键启停**：点击右上角鲸鱼即可开关 Clash 代理（可配合 Windows 系统代理）
- **状态一目了然**：鲸鱼肚子 **绿色 = 开启**、无颜色 = 关闭、琥珀色 = 桥接离线
- **详情面板**：悬停显示当前节点、实时延迟（毫秒）、系统代理状态，内置 **46+ 节点切换**
- **自动换活节点**：节点失效时自动扫描并按真实 HTTPS 连通性切换
- **自动接管**：端口被坏配置/直连占用时自动终止并接管
- **用完自动关闭**：命令行模式执行完命令自动停止并恢复系统代理
- **明暗主题自适应**：使用 DSH 的 `--dsw-alias-*` 主题变量，与 DeepSeek Harness UI 风格一致
- **对话内媒体直出**：生成的图片/视频/音频（输出到 `outputs/imagegen`）可直接在对话框内联显示——图片即看即显、mp4/webm 自动升级为内嵌播放器、mp3/wav 等自动升级为音频播放条（通过桥接 `/media` 通道）
- **视频/音频内嵌**：对话消息里的 `.mp4/.webm/.mov` 链接自动变内嵌视频播放器，`.mp3/.wav/.ogg/.m4a/.aac/.flac/.opus` 自动变音频播放器
- **QQ 式框选截图**：输入框 📷 一键截屏（Flameshot），截图自动进输入框
- **一键强刷**：顶栏 ↻ 按钮清缓存重载，加载插件最新代码
- **桥接自愈**：看门狗自动拉起掉线的桥接服务

## 🧩 组成

| 模块 | 说明 |
|---|---|
| `clash.ps1` | Clash 代理管理脚本（启动/停止/换节点/自检/接管） |
| `bridge/proxy-bridge.cjs` | 本地 HTTP 桥接服务（127.0.0.1:54123），供 GUI 插件调用（状态/节点/媒体/截图） |
| `dsh-plugin/` | DeepSeek Harness 客户端插件（鲸鱼开关 UI + 媒体内嵌 + 截图/强刷按钮） |
| `launchers/` | 双击即用的 .bat 模板（启动/关闭/状态） |

## 🚀 安装

### 1. 前置

- Windows + PowerShell 5.1+ / 7
- [Clash for Windows](https://github.com/Fndroid/clash_for_windows_pkg)（或其他 clash 内核）已安装并导入订阅
- **Flameshot**（QQ 式截图依赖）：`winget install Flameshot.Flameshot`（可用环境变量 `FLAMESHOT_EXE` 指定路径）
- DeepSeek Harness Desktop（Web GUI）

### 2. 配置路径

复制 `config.example` 为 `config.env`，填入你的 Clash 应用目录：

```ini
CLASH_APP_DIR=D:\Apps\Clash.for.Windows
```

> 也可用环境变量 `CLASH_APP_DIR` 代替。

### 3. 启动桥接服务（GUI 开关依赖）

```bat
node bridge\proxy-bridge.cjs
```

建议加入开机自启（启动文件夹放一个 .vbs 或计划任务），详见下文。

### 4. 安装 DSH 插件

将 `dsh-plugin` 目录注册为 web profile 的插件包（二选一）：

```powershell
# 方式 A：通过 dsh 命令行（推荐，支持 git 地址）
dsh plugin --profile web add https://github.com/xituisuany-max/dsh-clash-proxy-toggle

# 方式 B：手动注册
# 在 harness-home\profiles\web\package.json 的 dependencies 加入：
#   "@dsh-external/dsh-client-ui-proxy-toggle": "file:<本仓库>\dsh-plugin"
# 并把它追加到 dsh.profile.bundles 列表，然后重启 DeepSeek Harness Desktop
```

> 插件客户端默认连接 `http://127.0.0.1:54123`，可在页面注入 `window.__DSH_PROXY_BRIDGE__` 覆盖。

### 5. 命令行用法（不装插件也能用）

```powershell
.\clash.ps1 -Command "node fetch.js"          # 启动→执行→自动关闭
.\clash.ps1 -ProxyTest https://www.google.com/generate_204   # 自检后关闭
.\clash.ps1 -SystemProxy                        # 常驻 + 开启系统代理（Ctrl+C 或另开终端 -Stop）
.\clash.ps1 -Profile 1 -Node "香港 · 01"       # 指定订阅/节点
.\clash.ps1 -Region 日本                        # 自动换活节点时优先日本
.\clash.ps1 -Status / -Stop
```

`launchers\` 里的 `.bat.example` 改名为 `.bat` 后双击即用（路径自动解析，可放任意位置）。

## ⚙️ 工作原理

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  DSH Web GUI (浏览器)    │  HTTP  │  bridge/proxy-bridge.cjs │
│  右上角鲸鱼插件          │ ─────► │  127.0.0.1:54123          │
│  fetch /status /start…   │        └────────────┬─────────────┘
└─────────────────────────┘                     │ spawn powershell
                                                ▼
                                       clash.ps1（启动/停止/换节点）
                                                │
                                                ▼
                                    clash-win64 核心（订阅配置在 CLASH_APP_DIR\data）
```

- 插件每 2 秒轮询 `/status`，Agent 或命令行操作后界面自动同步
- `clash.ps1` 通过 Clash external-controller API（UTF-8）切换节点、扫描活节点

## 🔒 安全说明

- 本仓库**不含任何订阅数据**：节点密码、订阅 token 等在你的 `CLASH_APP_DIR\data` 里，请勿提交
- `config.env`、`.clash-run/`、`*.yml` 订阅文件已在 `.gitignore` 中排除
- 桥接服务仅监听 `127.0.0.1`，不对外暴露

## 📄 License

[MIT](LICENSE)
