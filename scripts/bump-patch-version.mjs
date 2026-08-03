#!/usr/bin/env node
/**
 * 递增 package.json 的 patch 版本（x.y.Z → x.y.Z+1），并同步到 Tauri / Cargo。
 * 由 desktop:build:* 在打包前调用。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current = String(pkg.version ?? "").trim();
const match = current.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
if (!match) {
  console.error(`❌ package.json version 无效: ${current || "(空)"}`);
  process.exit(1);
}

const next = `${match[1]}.${match[2]}.${Number(match[3]) + 1}${match[4]}`;
pkg.version = next;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`↑ version ${current} → ${next}`);

const sync = spawnSync(process.execPath, [join(root, "scripts", "sync-app-version.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}
