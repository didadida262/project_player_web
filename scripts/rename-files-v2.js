#!/usr/bin/env node

/**
 * 文件重命名脚本 V2
 * 功能：扫描指定文件夹，将文件名从格式 "曾经的QQ音乐三巨头！这TM才叫音乐！无损音质 99首合集 (P18. 18. 文件名称).mp4"
 *       重命名为 "文件名称.mp4"
 * 
 * 使用方法：
 *   node scripts/rename-files-v2.js <文件夹路径>
 * 
 * 例如：
 *   node scripts/rename-files-v2.js "C:\Users\Username\Videos"
 *   node scripts/rename-files-v2.js "F:/RESP/cate_音乐"
 */

const fs = require('fs');
const path = require('path');

// 从文件名中提取实际文件名的正则表达式
// 匹配格式：... (P数字. 数字. 文件名称).扩展名
// 例如：曾经的QQ音乐三巨头！这TM才叫音乐！无损音质 99首合集 (P18. 18. 徐良&孙羽幽-情话).mp4
const FILENAME_PATTERN = /\(P\d+\.\s*\d+\.\s*(.+?)\)(\.[^.]+)$/;

/**
 * 提取文件名
 * @param {string} filename - 原始文件名
 * @returns {string|null} - 提取的文件名，如果不匹配则返回 null
 */
function extractFilename(filename) {
  const match = filename.match(FILENAME_PATTERN);
  if (match) {
    const extractedName = match[1].trim(); // 提取的文件名部分
    const extension = match[2]; // 文件扩展名
    return extractedName + extension;
  }
  return null;
}

/**
 * 重命名文件
 * @param {string} filePath - 文件完整路径
 * @param {string} newName - 新文件名
 */
function renameFile(filePath, newName) {
  const dir = path.dirname(filePath);
  const newPath = path.join(dir, newName);
  
  try {
    fs.renameSync(filePath, newPath);
    console.log(`✓ 重命名成功: ${path.basename(filePath)} -> ${newName}`);
    return true;
  } catch (error) {
    console.error(`✗ 重命名失败: ${path.basename(filePath)}`, error.message);
    return false;
  }
}

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
 * 扫描文件夹并重命名文件
 * @param {string} folderPath - 文件夹路径
 */
function scanAndRename(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.error(`错误: 文件夹不存在: ${folderPath}`);
    console.error('\n提示:');
    console.error('  1. 请检查路径是否正确');
    console.error('  2. 在 PowerShell 中，建议使用引号包裹路径: node scripts/rename-files-v2.js "F:\\RESP\\cate_音乐"');
    console.error('  3. 或者使用正斜杠: node scripts/rename-files-v2.js "F:/RESP/cate_音乐"');
    console.error('  4. 或者使用单引号: node scripts/rename-files-v2.js \'F:\\RESP\\cate_音乐\'');
    process.exit(1);
  }

  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) {
    console.error(`错误: 路径不是文件夹: ${folderPath}`);
    process.exit(1);
  }

  console.log(`开始扫描文件夹: ${folderPath}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  try {
    const files = fs.readdirSync(folderPath);

    if (files.length === 0) {
      console.log('文件夹为空，没有文件需要处理。');
      return;
    }

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      
      // 跳过子文件夹
      if (fs.statSync(filePath).isDirectory()) {
        console.log(`⊘ 跳过文件夹: ${file}`);
        continue;
      }

      const newName = extractFilename(file);
      
      if (newName) {
        // 检查新文件名是否已存在
        const newPath = path.join(folderPath, newName);
        if (fs.existsSync(newPath) && newPath !== filePath) {
          console.log(`⚠ 跳过: ${file} -> ${newName} (目标文件已存在)`);
          skipCount++;
          continue;
        }

        if (renameFile(filePath, newName)) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        console.log(`⊘ 跳过: ${file} (不匹配格式)`);
        skipCount++;
      }
    }

    console.log(`\n处理完成:`);
    console.log(`  成功: ${successCount} 个文件`);
    console.log(`  跳过: ${skipCount} 个文件`);
    console.log(`  失败: ${errorCount} 个文件`);

  } catch (error) {
    console.error(`错误: 读取文件夹失败`, error.message);
    process.exit(1);
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法: node scripts/rename-files-v2.js <文件夹路径>');
    console.log('\n示例:');
    console.log('  node scripts/rename-files-v2.js "C:\\Users\\Username\\Videos"');
    console.log('  node scripts/rename-files-v2.js "F:/RESP/cate_音乐"');
    console.log('  node scripts/rename-files-v2.js "./videos"');
    console.log('\n注意: 在 PowerShell 中，建议使用引号包裹路径，或使用正斜杠');
    console.log('\n支持的文件名格式:');
    console.log('  原格式: "曾经的QQ音乐三巨头！这TM才叫音乐！无损音质 99首合集 (P18. 18. 文件名称).mp4"');
    console.log('  新格式: "文件名称.mp4"');
    process.exit(1);
  }

  const folderPath = args[0];
  
  // 规范化路径，处理反斜杠和转义问题
  const absolutePath = normalizePath(folderPath);
  
  // 调试信息（可选，可以通过环境变量控制）
  if (process.env.DEBUG) {
    console.log(`原始路径: ${folderPath}`);
    console.log(`规范化后: ${absolutePath}`);
  }

  scanAndRename(absolutePath);
}

// 运行主程序
main();

