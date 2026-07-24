# Isshin Player

面向本地资源的多模态流媒体播放器，基于 **Tauri 2 + Vite/React + Rust HTTP API**，支持 macOS / Windows。

## 技术栈

- **桌面壳**：Tauri 2（替代 Electron）
- **前端**：Vite + React 18 + TypeScript + Tailwind，`HashRouter` + `base: "./"`
- **本地 API**：Rust（Axum）内嵌于桌面进程，兼容原 Express 接口：`/health`、`/getFiles`、`/video`（支持 Range）
- **可选**：`backend/` 仍保留 Node/Express 实现，可单独 `node backend/index.js` 调试

## 快速上手

```bash
sh install-deps.sh   # frontend + root (Tauri CLI)

# 开发（自动起 Vite :5173 + Tauri 窗口 + API :3001）
yarn dev

# 前端单独构建
yarn build

# 打包桌面应用
yarn dist
# yarn dist:mac
# yarn dist:win
```

## 环境变量

- `PLAYER_API_PORT`：本地 API 端口，默认 `3001`
- `PLAYER_API_DEFAULT_PATH`：默认扫描目录
- `VITE_API_DEV` / `VITE_API_PROD`：覆盖前端 API 基址

## 说明

- 「在文件夹中显示」通过 Tauri command `show_item_in_folder` 调用系统资源管理器
- 产物目录：`src-tauri/target/release/bundle/`
