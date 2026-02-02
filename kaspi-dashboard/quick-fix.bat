@echo off
echo ========================================
echo   БЫСТРОЕ ОБНОВЛЕНИЕ WSL
echo ========================================
echo.
echo Выполняется обновление WSL...
echo.

REM Используем cmd напрямую, обходя PowerShell
wsl --update

if %errorLevel% equ 0 (
    echo.
    echo Перезапуск WSL...
    wsl --shutdown
    echo.
    echo ========================================
    echo   ГОТОВО!
    echo ========================================
    echo.
    echo Теперь перезапустите Docker Desktop
    echo.
) else (
    echo.
    echo Ошибка. Попробуйте вручную:
    echo   wsl --update
    echo.
)

pause

