#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
yarn install

echo "Installing root (Tauri CLI) dependencies..."
cd "$PROJECT_ROOT"
yarn install

echo "Done. Run: yarn desktop:dev"
