#!/usr/bin/env node

/**
 * 文件重命名脚本 V7
 * 功能：扫描指定文件夹，将文件名从格式 "【时长6小时】值得你单曲循环的100首纯音乐合集！世界上最受欢迎的100首纯音乐！适合自习看书的轻音乐！放松空灵的音乐 净化大脑 消除疲惫 (P35. 文件名.mp4"
 *       重命名为 "文件名.mp4"
 * 
 * 使用方法：
 *   node scripts/rename-files-v7.js <文件夹路径>
 * 
 * 例如：
 *   node scripts/rename-files-v7.js "C:\Users\Username\Videos"
 *   node scripts/rename-files-v7.js "F:/RESP/cate_纯音乐"
 */

const fs = require('fs');
const path = require('path');

// 从文件名中提取实际文件名的正则表达式
// 匹配格式：... (P数字. 文件名称.扩展名 - 没有右括号，扩展名在括号内
// 例如：
//   【时长6小时】值得你单曲循环的100首纯音乐合集！世界上最受欢迎的100首纯音乐！适合自习看书的轻音乐！放松空灵的音乐 净化大脑 消除疲惫 (P35. 文件名.mp4
//   【时长6小时】值得你单曲循环的100首纯音乐合集！世界上最受欢迎的100首纯音乐！适合自习看书的轻音乐！放松空灵的音乐 净化大脑 消除疲惫 (P88. 纯音乐-.mp4
const FILENAME_PATTERN_WITH_BRACKET = /\(P\d+\.\s*(.+?)\)(\.[^.]+)$/;  // 有右括号，扩展名在括号外
// 没有右括号的格式：需要匹配到文件末尾，文件名可能包含特殊字符如连字符
// 使用 [^.] 来匹配扩展名，确保能匹配 .mp4, .flv 等常见扩展名
const FILENAME_PATTERN_WITHOUT_BRACKET = /\(P\d+\.\s*(.+?)(\.[^.]+)$/;  // 没有右括号，扩展名在括号内

/**
 * 提取文件名
 * @param {string} filename - 原始文件名
 * @returns {string|null} - 提取的文件名，如果不匹配则返回 null
 */
function extractFilename(filename) {
  // 先尝试匹配有右括号的格式：... (P数字. 文件名).扩展名
  let match = filename.match(FILENAME_PATTERN_WITH_BRACKET);
  if (match) {
    const extractedName = match[1].trim(); // 提取的文件名部分
    const extension = match[2]; // 文件扩展名
    return extractedName + extension;
  }
  
  // 再尝试匹配没有右括号的格式：... (P数字. 文件名.扩展名
  // 注意：这个格式中，扩展名在括号内，需要确保匹配到文件末尾
  match = filename.match(FILENAME_PATTERN_WITHOUT_BRACKET);
  if (match) {
    const extractedName = match[1].trim(); // 提取的文件名部分
    const extension = match[2]; // 文件扩展名
    // 确保提取到了有效的文件名和扩展名
    if (extractedName && extension) {
      return extractedName + extension;
    }
  }
  
  // 如果上面的正则都不匹配，尝试更宽松的匹配：直接查找 (P数字. 后面的内容直到扩展名
  // 这个正则会匹配到文件末尾，确保能处理各种情况
  const fallbackPattern = /\(P\d+\.\s*([^)]+?)(\.[a-zA-Z0-9]{2,4})$/;
  match = filename.match(fallbackPattern);
  if (match) {
    const extractedName = match[1].trim();
    const extension = match[2];
    if (extractedName && extension) {
      return extractedName + extension;
    }
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
    console.error('  2. 在 PowerShell 中，建议使用引号包裹路径: node scripts/rename-files-v7.js "F:\\RESP\\cate_纯音乐"');
    console.error('  3. 或者使用正斜杠: node scripts/rename-files-v7.js "F:/RESP/cate_纯音乐"');
    console.error('  4. 或者使用单引号: node scripts/rename-files-v7.js \'F:\\RESP\\cate_纯音乐\'');
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
        // 检查新文件名是否已存在，如果存在则添加序号
        let finalName = newName;
        let counter = 1;
        let newPath = path.join(folderPath, finalName);
        
        // 如果目标文件已存在且不是当前文件，则添加序号
        while (fs.existsSync(newPath) && newPath !== filePath) {
          // 分离文件名和扩展名
          const nameWithoutExt = path.parse(finalName).name;
          const ext = path.parse(finalName).ext;
          // 如果已经有序号，先移除旧的序号
          const baseName = nameWithoutExt.replace(/\s*\(\d+\)$/, '');
          // 生成新的带序号的文件名
          finalName = `${baseName} (${counter})${ext}`;
          newPath = path.join(folderPath, finalName);
          counter++;
        }

        if (renameFile(filePath, finalName)) {
          if (counter > 1) {
            console.log(`  (已添加序号以避免冲突)`);
          }
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
    console.log('使用方法: node scripts/rename-files-v7.js <文件夹路径>');
    console.log('\n示例:');
    console.log('  node scripts/rename-files-v7.js "C:\\Users\\Username\\Videos"');
    console.log('  node scripts/rename-files-v7.js "F:/RESP/cate_纯音乐"');
    console.log('  node scripts/rename-files-v7.js "./videos"');
    console.log('\n注意: 在 PowerShell 中，建议使用引号包裹路径，或使用正斜杠');
    console.log('\n支持的文件名格式:');
    console.log('  原格式: "【时长6小时】值得你单曲循环的100首纯音乐合集！世界上最受欢迎的100首纯音乐！适合自习看书的轻音乐！放松空灵的音乐 净化大脑 消除疲惫 (P35. 文件名.mp4"');
    console.log('  新格式: "文件名.mp4"');
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

