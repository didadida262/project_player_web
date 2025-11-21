#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
yarn install

echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
yarn install

echo "Installing root dependencies..."
cd "$PROJECT_ROOT"
yarn install

echo "Done. You can now run yarn dev / yarn build / yarn dist."

