# project_player_web

一个面向本地资源的多模态流媒体播放器，结合 Express 后端、Vite + React 前端和 Electron 桌面端，支持 Windows 和 macOS 系统，提供目录浏览、边看边下、视频/音频播放、PDF/图片预览与国际化的完整体验。

## 技术选型与能力映射

- **后端**：`Node.js + Express 5` 负责目录树扫描（`/getFiles`）、视频流代理（`/video`）、HLS/mp4 支持、CORS、全局错误处理与 MIME 分类，满足低延迟流媒体服务需求。
- **前端**：`Vite + React 18 + TypeScript + Tailwind` 构建 SPA，启用 `HashRouter` 保证 Electron pack 的路径稳定，`ResourcesProvider` 管理目录、播放、PDF/图片、Toast 状态，`VideoContainer` 自动识别 HLS 与普通视频。
- **Electron**：主进程在 `electron/main.js` 同步启动 Express 后端，开发模式加载 Vite，生产加载 `frontend/dist`（`base: "./"`）；`electron-builder` 在根 `package.json > build` 控制 `Miles Player` 名称、`dist_electron` 输出、Windows `nsis/portable` 和 macOS `dmg/zip` 以及 icon/appId。

## 核心功能

- 🎬 **流媒体播放**：同时支持 HLS、mp4、音频，Electron 通过 `range` 请求实现边看边下。
- 📁 **本地目录导航**：前端调 `/getFiles` 展示目录/文件信息，支持分类筛选。
- 📄 **PDF/Picture 预览**：资源上下文统一调度 `handlePdfFile`/`handleCommonFile`、`SelectDir` 组件配合多类型渲染。
- 🌐 **国际化 + 主题**：`i18next` 支持中英切换，`ThemeProvider` 提供亮/暗主题，Toast 通知增强 UX。
- 💽 **打包友好**：`install-deps.sh` 依次安装 backend/frontend/root 依赖，`yarn dev` 并行 Vite + Electron，`yarn dist` 生成 Windows 安装包，`yarn dist:mac` 生成 macOS `.dmg/.zip`。

## 快速上手

```bash
cd project_player_web
sh scripts/install-deps.sh      # backend -> frontend -> root

# 开发
yarn dev                        # 启动前端 5173 + Electron 3001

# 打包 Windows 应用程序
yarn build
yarn dist              # 默认构建便携版（portable），不需要 NSIS
# 或使用以下命令：
# yarn dist:win        # 构建便携版
# yarn dist:win:nsis   # 构建 NSIS 安装程序（需要网络下载 NSIS）
# yarn dist:win:all    # 构建所有格式（便携版 + 安装程序）

# 打包 macOS 应用程序（生成 dist_electron/ 下的 .dmg 和 .zip）
yarn build
yarn dist:mac
```

## 额外说明

- `.gitignore` 已排除 `dist_electron/`、`frontend/dist/`、`node_modules/` 等大文件。
- 通过 `package.json > build.productName/icon/appId` 可修改应用名/图标，`electron/main.js` 的 `BrowserWindow` 也可设置 `icon`。
- API 地址可用 `VITE_API_DEV`/`VITE_API_PROD` 或 `PLAYER_API_PORT` 环境变量覆盖，默认 `PLAYER_API_PORT=3001`。
- **Windows 构建说明**：
  - 默认构建便携版（portable），无需下载额外工具，可直接运行
  - 便携版支持 x64 架构，生成单个 `.exe` 文件，无需安装
  - 如需构建 NSIS 安装程序，使用 `yarn dist:win:nsis`（需要网络下载 NSIS 工具）
  - NSIS 安装程序支持自定义安装目录，会自动创建桌面和开始菜单快捷方式
  - 如需自定义图标，请在 `package.json > build.win.icon` 中指定 `.ico` 文件路径
  - **构建已禁用代码签名**，适合开发和测试环境
  - **网络问题处理**：如果遇到下载工具失败（NSIS、winCodeSign 等），可以：
    - 使用 `yarn dist:win` 只构建便携版（不需要下载工具）
    - 清理 electron-builder 缓存后重试：
      - Windows: 删除 `%LOCALAPPDATA%\electron-builder\Cache` 目录
      - 或在 PowerShell 中执行: `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"`
