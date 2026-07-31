# 创建桌面快捷方式脚本
# 使用方法: 在项目根目录右键 -> "使用 PowerShell 运行"

$projectRoot = $PSScriptRoot
$candidates = @(
    (Join-Path $projectRoot "src-tauri\target\release\isshin-player.exe"),
    (Join-Path $projectRoot "src-tauri\target\release\Isshin Player.exe")
)
$exePath = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Isshin Player.lnk"

if (-Not $exePath) {
    Write-Host "错误: 找不到 exe 文件。请先运行 'yarn desktop:build:win' 构建应用程序。" -ForegroundColor Red
    Write-Host "预期路径: src-tauri\target\release\isshin-player.exe" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $exePath
$Shortcut.WorkingDirectory = Split-Path $exePath
$Shortcut.Description = "Isshin Player - 多模态流媒体播放器"
$Shortcut.Save()

Write-Host "桌面快捷方式创建成功！" -ForegroundColor Green
Write-Host "位置: $shortcutPath" -ForegroundColor Cyan
Read-Host "按回车键退出"
