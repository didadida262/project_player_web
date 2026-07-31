#!/usr/bin/env node
/**
 * Guard desktop bundle scripts: Windows installers must be built on Windows.
 * Usage: node scripts/ensure-desktop-platform.mjs mac|win
 */
const target = process.argv[2];
const platform = process.platform;

if (target === "mac" && platform !== "darwin") {
  console.error(
    "\n❌ macOS 安装包（.app / .dmg）只能在 macOS 上构建。\n" +
      "   当前系统: " +
      platform +
      "\n   请在本机执行: yarn desktop:build:mac\n",
  );
  process.exit(1);
}

if (target === "win" && platform !== "win32") {
  console.error(
    "\n❌ Windows 安装包（.msi / .exe）只能在 Windows 上构建。\n" +
      "   当前系统: " +
      platform +
      "\n   请在 Windows 上执行: yarn desktop:build:win\n",
  );
  process.exit(1);
}
