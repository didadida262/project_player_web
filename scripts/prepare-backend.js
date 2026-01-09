const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../backend');
const tempDir = path.join(__dirname, '../.temp-backend');

// 删除临时目录（如果存在）
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// 创建临时目录
fs.mkdirSync(tempDir, { recursive: true });

// 复制 backend 目录（包括 node_modules）
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(sourceDir, tempDir);
console.log('Backend prepared for packaging');

