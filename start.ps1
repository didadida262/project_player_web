# 流媒体播放器 - PowerShell 启动脚本
# 设置编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  流媒体播放器 - 启动脚本" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否已安装
try {
    $nodeVersion = node --version
    Write-Host "[信息] Node.js 版本: $nodeVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js！" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 检查后端依赖
Write-Host "[步骤 1/4] 检查后端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[警告] 后端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 后端依赖安装失败！" -ForegroundColor Red
        Set-Location ..
        Read-Host "按回车键退出"
        exit 1
    }
    Set-Location ..
    Write-Host "[信息] 后端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "[信息] 后端依赖已安装" -ForegroundColor Green
}
Write-Host ""

# 检查前端依赖
Write-Host "[步骤 2/4] 检查前端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[警告] 前端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 前端依赖安装失败！" -ForegroundColor Red
        Set-Location ..
        Read-Host "按回车键退出"
        exit 1
    }
    Set-Location ..
    Write-Host "[信息] 前端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "[信息] 前端依赖已安装" -ForegroundColor Green
}
Write-Host ""

# 启动后端服务
Write-Host "[步骤 3/4] 启动后端服务..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '[后端] 正在启动服务...' -ForegroundColor Cyan; npm start" -WindowStyle Normal
Write-Host "[信息] 后端服务启动中，等待 3 秒..." -ForegroundColor Green
Start-Sleep -Seconds 3
Write-Host ""

# 启动前端项目
Write-Host "[步骤 4/4] 启动前端项目..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '[前端] 正在启动开发服务器...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  启动完成！" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[后端服务] 通常运行在: http://localhost:3000" -ForegroundColor Green
Write-Host "[前端项目] 通常运行在: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "提示: 两个服务窗口已打开，请勿关闭！" -ForegroundColor Yellow
Write-Host "      关闭窗口将停止对应的服务。" -ForegroundColor Yellow
Write-Host ""
Write-Host "按回车键退出此窗口（不影响已启动的服务）..." -ForegroundColor Gray
Read-Host

