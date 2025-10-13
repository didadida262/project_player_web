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
# 安装后端依赖
cd backend
npm install
# 或使用 yarn
yarn install

# 安装前端依赖
cd ../frontend
npm install
# 或使用 yarn
yarn install
```

#### 2. 启动后端服务

```bash
cd backend
npm start
# 或使用 yarn
yarn start
```

后端服务默认运行在 http://localhost:3000

#### 3. 启动前端项目

在新的终端窗口中：

```bash
cd frontend
npm run dev
# 或使用 yarn
yarn dev
```

前端项目默认运行在 http://localhost:5173

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
npm run build
# 或使用 yarn
yarn build
```

构建产物将输出到 `frontend/dist` 目录。

### 预览生产版本
```bash
cd frontend
npm run preview
# 或使用 yarn
yarn preview
```

## 许可证

ISC

## 作者

项目维护者