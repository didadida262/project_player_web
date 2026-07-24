# Isshin Player

本地资源多模态流媒体播放器。浏览本地目录，播放视频 / 音频，预览 PDF 与图片，支持边下边看（HTTP Range）。

桌面端基于 **Tauri 2**，体积与内存占用远小于 Electron。

## 功能

- 本地目录浏览与关键词过滤
- 视频：HLS / FLV / MP4 等（`hls.js` / `flv.js` / 原生 `<video>`）
- 音频播放、PDF / 图片预览
- 在系统资源管理器中定位文件
- 中英国际化、亮暗主题

## 架构

```
┌─────────────────────────────────────────┐
│  Tauri 窗口                              │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ React (Vite)│───▶│ Rust Axum API  │  │
│  │ :5173 (dev) │    │ :3001          │  │
│  └─────────────┘    └────────────────┘  │
│         │  invoke: show_item_in_folder  │
└─────────┴───────────────────────────────┘
```

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面壳 | Tauri 2 | 窗口、系统能力、打包 |
| 前端 | Vite + React 18 + TS + Tailwind | `HashRouter`，`base: "./"` |
| 本地 API | Rust + Axum | 内嵌于桌面进程，默认 `127.0.0.1:3001` |

API 路由（与旧 Node 版兼容）：

| 路径 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /getFiles?path=&keyword=` | 一级目录列出（目录 + 音视频） |
| `GET /video?path=` | 媒体流，支持 `Range` |

可选：`backend/` 仍保留 Node/Express 实现，可单独运行调试，桌面端运行时不依赖它。

## 环境要求

- Node.js ≥ 18、Yarn
- Rust（[rustup](https://rustup.rs/)）
- macOS：Xcode Command Line Tools；Windows：按 [Tauri 文档](https://v2.tauri.app/start/prerequisites/) 安装构建依赖

国内网络建议配置 crates 镜像（如 [rsproxy](https://rsproxy.cn/)），否则首次编译可能很慢。

## 快速开始

```bash
# 安装依赖（frontend + Tauri CLI）
sh install-deps.sh

# 开发：Vite :5173 + Tauri 窗口 + API :3001
yarn dev
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `yarn dev` | 开发模式 |
| `yarn build` | 仅构建前端到 `frontend/dist` |
| `yarn dist` | 打包当前平台桌面应用 |
| `yarn dist:mac` | macOS：`.app` / `.dmg` |
| `yarn dist:win` | Windows：NSIS / MSI |

产物目录：`src-tauri/target/release/bundle/`

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `PLAYER_API_PORT` | `3001` | 本地 API 端口 |
| `PLAYER_API_DEFAULT_PATH` | 当前工作目录 | 默认扫描根路径 |
| `VITE_API_DEV` / `VITE_API_PROD` | `http://127.0.0.1:3001` | 覆盖前端 API 基址 |

## 目录结构

```
Isshin-Player/
├── frontend/          # React 前端
├── src-tauri/         # Tauri + Rust API
├── backend/           # 可选 Node/Express API（独立调试）
├── install-deps.sh
└── package.json
```

## 许可证

Private — Isshin Player Team
