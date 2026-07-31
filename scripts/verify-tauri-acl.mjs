#!/usr/bin/env node
/**
 * Fail the build if a registered invoke command is missing from the Tauri ACL manifest.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libRs = fs.readFileSync(path.join(root, "src-tauri/src/lib.rs"), "utf8");
const aclPath = path.join(root, "src-tauri/gen/schemas/acl-manifests.json");

if (!fs.existsSync(aclPath)) {
  console.error(
    "❌ Missing ACL manifest. Run: cargo build --manifest-path src-tauri/Cargo.toml",
  );
  process.exit(1);
}

const acl = JSON.parse(fs.readFileSync(aclPath, "utf8"));
const allowed = new Set();
for (const permission of Object.values(acl["__app-acl__"]?.permissions ?? {})) {
  for (const command of permission.commands?.allow ?? []) {
    allowed.add(command);
  }
}

const handlerMatch = libRs.match(
  /invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\]\)/,
);
if (!handlerMatch) {
  console.error("❌ Could not parse invoke_handler from src-tauri/src/lib.rs");
  process.exit(1);
}

const registered = [...handlerMatch[1].matchAll(/([a-z][a-z0-9_]*)/g)]
  .map((match) => match[1])
  .filter((name) => name !== "tauri");

const missing = registered.filter((command) => !allowed.has(command));
if (missing.length > 0) {
  console.error("❌ Tauri ACL is missing registered commands:");
  for (const command of missing) {
    console.error(`   - ${command}`);
  }
  console.error(
    "\nFix: add commands to src-tauri/permissions and capabilities,",
  );
  console.error(
    "then run: cargo build --manifest-path src-tauri/Cargo.toml",
  );
  process.exit(1);
}

console.log(`✓ Tauri ACL covers ${registered.length} registered commands`);
