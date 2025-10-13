@echo off
echo 选择后端启动方式:
echo 1. 普通启动 (无自动重启)
echo 2. PM2启动 (带自动重启)
echo 3. 开发模式 (nodemon)
echo.
set /p choice="请选择 (1-3): "

cd backend

if "%choice%"=="1" (
    echo 启动普通模式...
    npm start
) else if "%choice%"=="2" (
    echo 启动PM2模式 (带自动重启)...
    npm run start:pm2
) else if "%choice%"=="3" (
    echo 启动开发模式...
    npm run start:dev
) else (
    echo 无效选择，使用默认启动...
    npm start
)

pause
