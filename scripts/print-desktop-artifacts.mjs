#!/usr/bin/env node
/**
 * 打包完成后打印分发产物路径（DMG / NSIS 等）。
 * Usage: node scripts/print-desktop-artifacts.mjs mac|mac-intel|win
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const tauriConf = JSON.parse(
  readFileSync(join(root, "src-tauri", "tauri.conf.json"), "utf8"),
);
const productName = tauriConf.productName ?? "App";
const version = pkg.version;

function listDir(label, dir, pattern) {
  if (!existsSync(dir)) {
    console.log(`  ${label}: (目录不存在) ${dir}`);
    return;
  }
  const files = readdirSync(dir).filter(
    (name) => !name.startsWith("rw.") && pattern.test(name),
  );
  if (!files.length) {
    console.log(`  ${label}: (暂无文件) ${dir}`);
    return;
  }
  for (const file of files) {
    console.log(`  ${label}: ${join(dir, file)}`);
  }
}

switch (target) {
  case "mac":
  case "macos":
    listDir("DMG", join(root, "src-tauri/target/release/bundle/dmg"), /\.dmg$/i);
    listDir(
      ".app",
      join(root, "src-tauri/target/release/bundle/macos"),
      /\.app$/i,
    );
    console.log(
      `\n  预期 DMG 文件名: ${productName}_${version}_aarch64.dmg（Apple Silicon）`,
    );
    break;
  case "mac-intel":
  case "macos-intel":
    listDir(
      "DMG",
      join(root, "src-tauri/target/x86_64-apple-darwin/release/bundle/dmg"),
      /\.dmg$/i,
    );
    listDir(
      ".app",
      join(root, "src-tauri/target/x86_64-apple-darwin/release/bundle/macos"),
      /\.app$/i,
    );
    console.log(
      `\n  预期 DMG 文件名: ${productName}_${version}_x86_64.dmg（Intel）`,
    );
    break;
  case "win":
  case "windows":
    listDir("MSI", join(root, "src-tauri/target/release/bundle/msi"), /\.msi$/i);
    listDir(
      "NSIS",
      join(root, "src-tauri/target/release/bundle/nsis"),
      /\.exe$/i,
    );
    console.log(`
  升级说明：
  - 请优先使用 NSIS 安装包（*-setup.exe）升级；MSI 与 NSIS 互不覆盖。
  - 安装前请关闭正在运行的 ${productName}。
  - 若检测到旧版本，安装程序会提示后覆盖安装到原目录。
  - 安装完成后请从开始菜单/桌面快捷方式启动，并确认标题栏版本为 v${version}。
`);
    break;
  default:
    console.error(
      "Usage: node scripts/print-desktop-artifacts.mjs <mac|mac-intel|win>",
    );
    process.exit(1);
}
