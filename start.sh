#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

function ensure_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "[错误] 未检测到 $1，请先安装。"
    case "$1" in
      yarn)
        echo "安装 Yarn: https://classic.yarnpkg.com/lang/en/docs/install/"
        ;;
      *)
        echo "下载地址: https://nodejs.org/"
        ;;
    esac
    exit 1
  fi
}

ensure_command node
ensure_command npm
ensure_command yarn

echo "===================================="
echo "  流媒体播放器 - mac 启动脚本"
echo "===================================="
echo
echo "[信息] Node.js 版本: $(node --version)"
echo

function install_deps() {
  local label="$1"
  local dir="$2"
  local use_yarn="${3:-false}"
  local skip_husky="${4:-false}"
  if [ ! -d "$dir/node_modules" ]; then
    echo "[警告] ${label}依赖未安装，正在安装..."
    (
      cd "$dir"
      if [ "$use_yarn" = true ]; then
        if [ "$skip_husky" = true ]; then
          HUSKY=0 yarn install
        else
          yarn install
        fi
      else
        if [ "$skip_husky" = true ]; then
          HUSKY=0 npm install
        else
          npm install
        fi
      fi
    )
  else
    echo "[信息] ${label}依赖已安装"
  fi
  echo
}

install_deps "后端" "$BACKEND_DIR"
install_deps "前端" "$FRONTEND_DIR" true true

function open_terminal() {
  local workdir="$1"
  local message="$2"
  local cmd="$3"
  osascript <<EOF >/dev/null
tell application "Terminal"
  activate
  do script "cd \"$workdir\" && echo \"$message\" && bash -lc \"${cmd}\""
end tell
EOF
}

echo "[步骤 3/4] 启动后端服务..."
open_terminal "$BACKEND_DIR" "[后端] 正在启动服务..." "npm start"
echo "[信息] 后端服务启动中，等待 3 秒..."
sleep 3
echo

echo "[步骤 4/4] 启动前端项目..."
open_terminal "$FRONTEND_DIR" "[前端] 正在启动开发服务器..." "yarn dev"
echo

echo "===================================="
echo "  启动完成！"
echo "===================================="
echo
echo "[后端服务] 通常运行在: http://localhost:3000"
echo "[前端项目] 通常运行在: http://localhost:5173"
echo
echo "提示: 两个服务窗口已打开，请勿关闭！"
echo "       关闭窗口将停止对应的服务。"

