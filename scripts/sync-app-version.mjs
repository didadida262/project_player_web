#!/usr/bin/env node
/**
 * 以 package.json 为唯一版本源，同步到 Tauri / Cargo。
 * 产物命名规则（Tauri 默认）：{productName}_{version}_{arch}.dmg
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const tauriConfPath = join(root, "src-tauri", "tauri.conf.json");
const cargoPath = join(root, "src-tauri", "Cargo.toml");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = String(pkg.version ?? "").trim();
if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`❌ package.json version 无效: ${version || "(空)"}`);
  process.exit(1);
}

const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
if (tauriConf.version !== version) {
  tauriConf.version = version;
  writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);
  console.log(`→ tauri.conf.json version = ${version}`);
}

const cargo = readFileSync(cargoPath, "utf8");
const cargoNext = cargo.replace(
  /^version = "[^"]*"/m,
  `version = "${version}"`,
);
if (cargoNext !== cargo) {
  writeFileSync(cargoPath, cargoNext);
  console.log(`→ Cargo.toml version = ${version}`);
}

const productName = tauriConf.productName ?? "App";
console.log(
  `✓ 版本 ${version} 已同步；macOS DMG 将命名为：${productName}_${version}_<arch>.dmg`,
);
