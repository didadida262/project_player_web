; Isshin Player NSIS installer hooks
; Stop running processes and force-overwrite files on upgrade.

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "Preparing overwrite install for ${PRODUCTNAME}..."
  SetOverwrite on

  ; Best-effort: stop any running instance so the main binary can be replaced.
  ; Exit code is ignored (process may not be running).
  ExecWait 'taskkill /F /IM "${MAINBINARYNAME}.exe" /T' $0
  Sleep 800

  ; If an old binary is still present and locked, fail loudly instead of
  ; silently leaving the previous version on disk.
  ${If} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
    ClearErrors
    Delete "$INSTDIR\${MAINBINARYNAME}.exe"
    ${If} ${Errors}
      MessageBox MB_ICONSTOP \
        "无法覆盖旧版本文件：$INSTDIR\${MAINBINARYNAME}.exe$\r$\n$\r$\n请先手动关闭 Isshin Player（含托盘进程）后重新运行安装包。"
      Abort
    ${EndIf}
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Overwrite install finished."
!macroend
