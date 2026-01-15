const path = require("path");
const { app, BrowserWindow } = require("electron");

// 在打包后，backend 位于 resources/backend 目录中
// 在开发环境中，backend 位于项目根目录的 backend 文件夹中
let backendPath;
if (app.isPackaged) {
  // 打包后，backend 在 resources 目录中
  backendPath = path.join(process.resourcesPath, "backend");
} else {
  // 开发环境，backend 在项目根目录
  backendPath = path.join(__dirname, "../backend");
}

// 将 backend 的 node_modules 添加到模块搜索路径
const backendNodeModules = path.join(backendPath, "node_modules");
if (require("fs").existsSync(backendNodeModules)) {
  const Module = require("module");
  // 保存原始的 _nodeModulePaths 函数
  const originalNodeModulePaths = Module._nodeModulePaths;
  // 重写 _nodeModulePaths 函数
  Module._nodeModulePaths = function(from) {
    // 调用原始函数获取路径
    const paths = originalNodeModulePaths.call(this, from);
    // 将 backend/node_modules 添加到搜索路径
    if (paths.indexOf(backendNodeModules) === -1) {
      paths.unshift(backendNodeModules);
    }
    return paths;
  };
}

const { startServer } = require(path.join(backendPath, "index"));

const isDev = process.env.NODE_ENV === "development";
const rendererUrl = isDev ? process.env.ELECTRON_DEV_URL || "http://127.0.0.1:5173" : null;
const backendPort = Number(process.env.PLAYER_API_PORT || 3001);

let backendInstance = null;

const startBackend = () => {
  if (backendInstance) {
    return backendInstance;
  }

  backendInstance = startServer({
    port: backendPort,
    defaultPath: process.env.PLAYER_API_DEFAULT_PATH,
  });

  return backendInstance;
};

const createMainWindow = async () => {
  // 设置最小尺寸
  const minWidth = 1280;
  const minHeight = 900;
  
  const win = new BrowserWindow({
    width: minWidth,      // 初始宽度设为最小宽度
    height: minHeight,    // 初始高度设为最小高度
    minWidth: minWidth,   // 最小宽度，禁止拖拽变小
    minHeight: minHeight, // 最小高度，禁止拖拽变小
    title: "Miles Player",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (rendererUrl) {
    await win.loadURL(rendererUrl);
    if (isDev) {
      win.webContents.openDevTools();
    }
  } else {
    const indexPath = path.join(__dirname, "../frontend/dist/index.html");
    await win.loadFile(indexPath);
  }

  return win;
};

const cleanup = () => {
  if (backendInstance?.server) {
    backendInstance.server.close();
    backendInstance = null;
  }
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    cleanup();
    app.quit();
  }
});

app.on("before-quit", cleanup);

app.whenReady().then(() => {
  startBackend();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      startBackend();
      createMainWindow();
    }
  });
});

