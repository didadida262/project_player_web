const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // 引入 CORS 模块
const { getMimeTypeFromExtension, FILE_TYPE_CATEGORIES } = require("./mimeTypes");

const DEFAULT_PORT = 3001;
const DEFAULT_SCAN_PATH = process.env.PLAYER_API_DEFAULT_PATH || process.cwd();

// 全局错误处理
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
  console.log("服务将在3秒后自动重启...");
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的Promise拒绝:", reason);
  console.log("服务将在3秒后自动重启...");
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

// 深度搜索
async function deepreadDirectory(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await readDirectory(fullPath);
        files.push(...subFiles);
      } else {
        const fileType = path.extname(entry.name).replace(".", "") || "unknown";
        files.push({
          name: entry.name,
          type: fileType,
          fullPath: fullPath,
        });
      }
    }

    return files;
  } catch (err) {
    console.error(`读取目录 ${dirPath} 时出错:`, err);
    return [];
  }
}

// 一级扫描
async function readDirectory(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const fileType = entry.isDirectory()
        ? FILE_TYPE_CATEGORIES.DIRECTORY
        : getMimeTypeFromExtension(entry.name);
      files.push({
        name: entry.name,
        type: fileType,
        path: fullPath,
      });
    }

    return files;
  } catch (err) {
    console.error(`读取目录 ${dirPath} 时出错:`, err);
    return [];
  }
}

const createExpressApp = (options = {}) => {
  const basePath = options.defaultPath || DEFAULT_SCAN_PATH;

  const app = express();

  app.use(
    cors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    }),
  );

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/getFiles", async (req, res) => {
    const scanPath = req.query.path || basePath;
    const files = await readDirectory(scanPath);
    res.json(files);
  });

  app.get("/video", (req, res) => {
    const videoPath = req.query.path;
    if (!videoPath) {
      return res.status(400).json({ message: "path required" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = getMimeTypeFromExtension(videoPath);
    console.log("contentType>>", contentType);

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  });

  return app;
};

const startServer = (options = {}) => {
  const port = options.port || Number(process.env.PLAYER_API_PORT) || DEFAULT_PORT;
  const app = createExpressApp(options);
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Default scan path: ${options.defaultPath || DEFAULT_SCAN_PATH}`);
  });
  return { server, port };
};

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
};