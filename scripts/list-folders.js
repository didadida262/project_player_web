#!/usr/bin/env node

/**
 * 文件夹列表导出脚本
 * 功能：扫描指定路径下的所有文件夹，将文件夹名称写入txt文件
 * 
 * 使用方法：
 *   node scripts/list-folders.js <目标路径>
 * 
 * 例如：
 *   node scripts/list-folders.js "C:\Users\Username\Documents"
 *   node scripts/list-folders.js "F:/RESP"
 */

const fs = require('fs');
const path = require('path');

/**
 * 规范化路径，处理 Windows 路径中的反斜杠问题
 * @param {string} folderPath - 原始路径
 * @returns {string} - 规范化后的路径
 */
function normalizePath(folderPath) {
  if (!folderPath) return folderPath;
  
  // 将反斜杠统一转换为正斜杠，然后使用 path 模块处理
  // 这样可以避免 PowerShell 转义问题
  let normalized = folderPath.replace(/\\/g, '/');
  
  // 如果是绝对路径（Windows 盘符），保持盘符格式
  if (/^[A-Za-z]:/.test(normalized)) {
    // Windows 绝对路径：C:/path/to/folder
    return path.resolve(normalized);
  }
  
  // 相对路径
  return path.resolve(process.cwd(), normalized);
}

/**
 * 扫描文件夹并导出文件夹名称列表
 * @param {string} targetPath - 目标路径
 */
function scanAndExportFolders(targetPath) {
  if (!fs.existsSync(targetPath)) {
    console.error(`错误: 路径不存在: ${targetPath}`);
    console.error('\n提示:');
    console.error('  1. 请检查路径是否正确');
    console.error('  2. 在 PowerShell 中，建议使用引号包裹路径: node scripts/list-folders.js "F:\\RESP"');
    console.error('  3. 或者使用正斜杠: node scripts/list-folders.js "F:/RESP"');
    console.error('  4. 或者使用单引号: node scripts/list-folders.js \'F:\\RESP\'');
    process.exit(1);
  }

  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    console.error(`错误: 路径不是文件夹: ${targetPath}`);
    process.exit(1);
  }

  console.log(`开始扫描文件夹: ${targetPath}\n`);

  try {
    const items = fs.readdirSync(targetPath);
    const folders = [];

    // 遍历所有项目，筛选出文件夹
    for (const item of items) {
      const itemPath = path.join(targetPath, item);
      
      try {
        const itemStat = fs.statSync(itemPath);
        if (itemStat.isDirectory()) {
          folders.push(item);
        }
      } catch (error) {
        // 如果无法访问某个项目（如权限问题），跳过
        console.warn(`⚠ 跳过无法访问的项目: ${item}`);
        continue;
      }
    }

    // 对文件夹名称进行排序（可选，按字母顺序）
    folders.sort();

    // 生成txt文件路径
    const txtFilePath = path.join(targetPath, 'folders-list.txt');

    // 准备写入内容
    let content = '';
    if (folders.length === 0) {
      content = '未找到任何文件夹。\n';
      console.log('未找到任何文件夹。');
    } else {
      // 添加标题和统计信息
      content += `文件夹列表\n`;
      content += `扫描路径: ${targetPath}\n`;
      content += `扫描时间: ${new Date().toLocaleString('zh-CN')}\n`;
      content += `文件夹总数: ${folders.length}\n`;
      content += `${'='.repeat(50)}\n\n`;

      // 写入每个文件夹名称
      folders.forEach((folder, index) => {
        content += `${index + 1}. ${folder}\n`;
      });

      console.log(`找到 ${folders.length} 个文件夹:`);
      folders.forEach((folder, index) => {
        console.log(`  ${index + 1}. ${folder}`);
      });
    }

    // 写入文件（覆盖模式）
    fs.writeFileSync(txtFilePath, content, 'utf8');

    console.log(`\n✓ 文件夹列表已导出到: ${txtFilePath}`);
    console.log(`  文件大小: ${fs.statSync(txtFilePath).size} 字节`);

  } catch (error) {
    console.error(`错误: 读取文件夹失败`, error.message);
    process.exit(1);
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法: node scripts/list-folders.js <目标路径>');
    console.log('\n示例:');
    console.log('  node scripts/list-folders.js "C:\\Users\\Username\\Documents"');
    console.log('  node scripts/list-folders.js "F:/RESP"');
    console.log('  node scripts/list-folders.js "./videos"');
    console.log('\n注意: 在 PowerShell 中，建议使用引号包裹路径，或使用正斜杠');
    console.log('\n功能说明:');
    console.log('  - 扫描指定路径下的所有文件夹');
    console.log('  - 将文件夹名称列表导出到目标路径下的 folders-list.txt 文件');
    console.log('  - 如果 txt 文件已存在，将直接覆盖');
    process.exit(1);
  }

  const targetPath = args[0];
  
  // 规范化路径，处理反斜杠和转义问题
  const absolutePath = normalizePath(targetPath);
  
  // 调试信息（可选，可以通过环境变量控制）
  if (process.env.DEBUG) {
    console.log(`原始路径: ${targetPath}`);
    console.log(`规范化后: ${absolutePath}`);
  }

  scanAndExportFolders(absolutePath);
}

// 运行主程序
main();

