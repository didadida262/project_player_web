# project_player_web

流媒体读取视频，边看边下。

## 项目简介

这是一个基于 Node.js + Express 后端和 React + Vite + TypeScript 前端的流媒体播放器项目，支持边看边下载功能。

## 项目结构

```
project_player_web/
├── backend/                 # 后端服务
│   ├── index.js            # Express 服务入口
│   ├── package.json        # 后端依赖配置
│   └── README.md           # 后端说明文档
├── frontend/               # 前端项目
│   ├── src/               # 源代码目录
│   │   ├── api/           # API 接口封装
│   │   ├── components/    # React 组件
│   │   ├── i18n/          # 国际化配置
│   │   ├── layouts/       # 布局组件
│   │   ├── pages/         # 页面组件
│   │   ├── provider/      # 上下文提供者
│   │   ├── router/        # 路由配置
│   │   ├── styles/        # 样式文件
│   │   ├── utils/         # 工具函数
│   │   ├── App.tsx        # 应用主组件
│   │   └── main.tsx       # 应用入口
│   ├── public/            # 静态资源
│   ├── package.json       # 前端依赖配置
│   ├── vite.config.ts     # Vite 配置
│   └── tsconfig.json      # TypeScript 配置
├── start.bat              # Windows 启动脚本（批处理）
├── start.ps1              # Windows 启动脚本（PowerShell）
└── README.md              # 项目说明文档
```

## 技术栈

### 后端
- Node.js
- Express 5.x
- WebSocket (ws)
- MySQL
- JWT 身份验证

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Ant Design
- i18next (国际化)
- Axios

## 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

## 快速开始

### 方法一：使用启动脚本（推荐）

#### Windows 批处理脚本
双击运行 `start.bat` 或在命令行中执行：
```bash
start.bat
```

#### PowerShell 脚本
在 PowerShell 中执行：
```powershell
.\start.ps1
```

### 方法二：手动启动

#### 1. 安装依赖

```bash
# 顺序安装后端、前端、再根目录的依赖
cd project_player_web
sh scripts/install-deps.sh
```

#### 2. 启动服务

```bash
# 后端（独立调试时）
cd backend
yarn start
#
# 前端（独立调试时）
cd ../frontend
yarn dev
```

后端服务默认运行在 http://localhost:3001，前端开发服务器在 http://localhost:5173

## 桌面客户端（Electron）

最新的桌面版本把前端 + 后端同时打包成了一个 macOS 应用，Electron 启动时会自动托管后端接口。

### 开发

1. 运行 `sh scripts/install-deps.sh`（脚本会依次去 `backend`、`frontend`、根目录安装依赖）。
2. 执行 `yarn dev`，该命令会并行启动 Vite（前端）和 Electron（托管后端，总是监听 `3001`）。

默认情况下前端请求 `http://127.0.0.1:3001`，也可以通过设置环境变量 `PLAYER_API_PORT` 或 `VITE_API_DEV`/`VITE_API_PROD` 来覆盖。

### 打包发布（macOS）

1. 运行 `yarn build`（确保已通过 `scripts/install-deps.sh` 预装依赖）。
2. 运行 `yarn dist`，Electron Builder 会把前端、后端、依赖打包到 `dist_electron`，输出 `Project Player.dmg` / `Project Player.zip`。
3. 双击 `.dmg` 或 `.zip` 中的 `.app` 即可安装/运行。


## 功能特性

- 🎬 流媒体视频播放
- 📥 边看边下载
- 🎵 音频播放支持
- 📄 PDF 文件查看
- 🖼️ 图片预览
- 🌐 国际化支持（中文/英文）
- 🎨 主题切换
- 📱 响应式设计

## 开发说明

### 后端开发
- 入口文件：`backend/index.js`
- 使用 Express 5 框架
- 支持 WebSocket 实时通信
- 集成 MySQL 数据库

### 前端开发
- 使用 Vite 作为构建工具，支持热更新
- TypeScript 提供类型安全
- Tailwind CSS 实现样式
- React Router 处理路由

## 构建生产版本

### 前端构建
```bash
cd frontend
yarn build
```

构建产物将输出到 `frontend/dist` 目录。

### 预览生产版本
```bash
cd frontend
yarn preview
```

## 许可证

ISC

## 作者

项目维护者