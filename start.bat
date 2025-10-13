@echo off
chcp 65001 >nul
echo ====================================
echo   流媒体播放器 - 启动脚本
echo ====================================
echo.

REM 检查 Node.js 是否已安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js！
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js 版本:
node --version
echo.

REM 检查后端依赖
echo [步骤 1/4] 检查后端依赖...
if not exist "backend\node_modules" (
    echo [警告] 后端依赖未安装，正在安装...
    cd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 后端依赖安装失败！
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [信息] 后端依赖已安装
)
echo.

REM 检查前端依赖
echo [步骤 2/4] 检查前端依赖...
if not exist "frontend\node_modules" (
    echo [警告] 前端依赖未安装，正在安装...
    cd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 前端依赖安装失败！
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [信息] 前端依赖已安装
)
echo.

REM 启动后端服务
echo [步骤 3/4] 启动后端服务...
start "后端服务 - Backend Server" cmd /k "cd backend && echo [后端] 正在启动服务... && npm start"
echo [信息] 后端服务启动中，等待 3 秒...
timeout /t 3 /nobreak >nul
echo.

REM 启动前端项目
echo [步骤 4/4] 启动前端项目...
start "前端项目 - Frontend App" cmd /k "cd frontend && echo [前端] 正在启动开发服务器... && npm run dev"
echo.

echo ====================================
echo   启动完成！
echo ====================================
echo.
echo [后端服务] 通常运行在: http://localhost:3000
echo [前端项目] 通常运行在: http://localhost:5173
echo.
echo 提示: 两个服务窗口已打开，请勿关闭！
echo       关闭窗口将停止对应的服务。
echo.
pause

