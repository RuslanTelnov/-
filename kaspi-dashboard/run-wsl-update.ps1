# Скрипт для обновления WSL
# Запуск от имени администратора

Write-Host "Обновление WSL..." -ForegroundColor Cyan
Write-Host ""

# Проверяем права администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Запуск от имени администратора..." -ForegroundColor Yellow
    # Перезапускаем скрипт от имени администратора
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PWD'; wsl --update; Write-Host 'Готово! Теперь выполните: wsl --shutdown' -ForegroundColor Green; pause"
    exit
}

# Выполняем обновление
Write-Host "[1/2] Обновление WSL..." -ForegroundColor Yellow
wsl --update

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[2/2] Перезапуск WSL..." -ForegroundColor Yellow
    wsl --shutdown
    Write-Host ""
    Write-Host "Готово! Теперь перезапустите Docker Desktop" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Ошибка при обновлении WSL" -ForegroundColor Red
}

Write-Host ""
pause

