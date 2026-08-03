import { readFileSync } from "node:fs";
import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
);

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  clearScreen: false,
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version ?? "0.0.0"),
  },
  server: {
    host: host || "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    include: ["flv.js"],
  },
});
