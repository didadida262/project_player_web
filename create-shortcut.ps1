# 创建桌面快捷方式脚本
# 使用方法: 在项目根目录右键 -> "使用 PowerShell 运行"

$projectRoot = $PSScriptRoot
$exePath = Join-Path $projectRoot "dist_electron\win-unpacked\Miles Player.exe"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Miles Player.lnk"

if (-Not (Test-Path $exePath)) {
    Write-Host "错误: 找不到 exe 文件。请先运行 'yarn dist:win' 构建应用程序。" -ForegroundColor Red
    Write-Host "查找路径: $exePath" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $exePath
$Shortcut.WorkingDirectory = Split-Path $exePath
$Shortcut.Description = "Miles Player - 多模态流媒体播放器"
# 如果有图标文件，可以设置：
# $Shortcut.IconLocation = "path\to\icon.ico"
$Shortcut.Save()

Write-Host "✓ 桌面快捷方式创建成功！" -ForegroundColor Green
Write-Host "位置: $shortcutPath" -ForegroundColor Cyan
Read-Host "按回车键退出"


