@echo off
echo ========================================
echo   БЫСТРОЕ ОБНОВЛЕНИЕ WSL
echo ========================================
echo.
echo Этот скрипт обновит WSL за 1-2 минуты
echo.
echo ВАЖНО: Запустите от имени администратора!
echo.
pause

echo.
echo [1/2] Обновление WSL...
wsl --update

if %errorLevel% equ 0 (
    echo.
    echo [2/2] Перезапуск WSL...
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
    echo [ОШИБКА] Не удалось обновить WSL
    echo.
    echo Попробуйте выполнить вручную:
    echo   wsl --update
    echo.
)

pause

