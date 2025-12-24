const path = require("path");
const { app, BrowserWindow } = require("electron");

const { startServer } = require("../backend/index");

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

