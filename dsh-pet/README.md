# 🐳 dsh-client-ui-pet — DSH 鲸鱼娘桌宠插件

一只住在 DSH Web GUI 角落的 Q 版蓝发女仆鲸鱼娘。

## 功能

- **可拖动 + 吸附角落**：拖到任意位置松手，自动吸附最近的屏幕角（4 角）
- **浮动 + 呼吸动画**：常驻时轻微上下浮动、缓慢呼吸缩放
- **5 个动作序列帧动画**（素材经本地 proxy-bridge `/media/pet/<action>_0/<n>.png` 提供）：

  | 动作 | 目录 | 帧数 | 帧率 | 触发 |
  |---|---|---|---|---|
  | idle 待机 | `pet/idle_0/` | 41 | 8 fps | 默认循环 |
  | happy 开心 | `pet/happy_0/` | 62 | 12 fps | 单击（蹦跳+台词气泡） |
  | wave 挥手 | `pet/wave_0/` | 41 | 8 fps | 双击循环切换 |
  | sleep 睡觉 | `pet/sleep_0/` | 41 | 8 fps | 双击循环切换 |
  | cry 哭哭 | `pet/cry_0/` | 41 | 8 fps | 双击循环切换 |

- **单击**：蹦跳 + 随机台词气泡（`啊呜~ 好好吃！` / `主人辛苦啦！` 等）
- **双击**：循环切换 wave → sleep → cry（带气泡提示动作名），播完自动回 idle；sleep 为循环动作
- **明暗主题自适应**：气泡颜色跟随 DSH 主题变量

## 素材规格

- 5 个动作均为 RunningHub MiniMax H3 **多图生视频（Ref2VA）** 生成，1:1 方屏
- 绿幕背景 → 本地 chroma-key 抠图 → 透明 PNG 序列帧（220×220）
- 角色：深蓝渐变长卷发 + 鱼鳍发梢 + 呆毛、蓝白女仆装、围裙印蓝色小鲸鱼、蓝色鱼尾、Q 版 2-3 头身

## 结构

```
dsh-pet/
├── package.json         # @dsh-external/dsh-client-ui-pet v0.2.0
├── cordis.patch.yml     # Cordis 补丁（客户端插件注册）
└── lib/
    ├── index.js         # 插件入口（转发 client）
    └── client.js        # 桌宠 UI：拖动/吸附/序列帧引擎/气泡/双击切换
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

- 帧目录：`G:\deepseek harness\outputs\imagegen\pet\{idle,happy,wave,sleep,cry}_0\{1..N}.png`
- 源视频：`G:\deepseek harness\outputs\imagegen\pet-{happy,wave,sleep,cry}-720p.mp4`（736×736 1:1）

## License

MIT
