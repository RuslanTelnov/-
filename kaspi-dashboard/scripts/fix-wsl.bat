@echo off
REM Скрипт для обновления WSL в Windows
REM Запустите этот скрипт от имени администратора

echo.
echo ========================================
echo   Обновление Windows Subsystem for Linux
echo ========================================
echo.

REM Проверяем права администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ОШИБКА] Скрипт должен быть запущен от имени администратора!
    echo.
    echo Правый клик на файле -^> Запуск от имени администратора
    echo.
    echo Или выполните вручную:
    echo   wsl --update
    echo.
    pause
    exit /b 1
)

echo [INFO] Проверка текущей версии WSL...
wsl --version
echo.

echo [INFO] Обновление WSL...
wsl --update

if %errorLevel% equ 0 (
    echo.
    echo [УСПЕХ] WSL успешно обновлен!
    echo.
    echo Следующие шаги:
    echo 1. Перезапустите Docker Desktop
    echo 2. Или выполните: wsl --shutdown
    echo 3. Затем запустите Docker Desktop снова
    echo.
) else (
    echo.
    echo [ОШИБКА] Не удалось обновить WSL
    echo Попробуйте выполнить вручную: wsl --update
    echo.
)

pause

