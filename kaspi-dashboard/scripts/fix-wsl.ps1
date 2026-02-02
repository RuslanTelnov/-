# Скрипт для обновления WSL в Windows
# Запустите этот скрипт от имени администратора

Write-Host "🔧 Обновление Windows Subsystem for Linux (WSL)..." -ForegroundColor Cyan
Write-Host ""

# Проверяем, запущен ли скрипт от имени администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Ошибка: Скрипт должен быть запущен от имени администратора!" -ForegroundColor Red
    Write-Host "Правый клик на файле → Запуск от имени администратора" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Или выполните вручную:" -ForegroundColor Yellow
    Write-Host "  wsl --update" -ForegroundColor White
    pause
    exit 1
}

# Проверяем версию WSL
Write-Host "📊 Проверка текущей версии WSL..." -ForegroundColor Cyan
$wslVersion = wsl --version 2>&1
Write-Host $wslVersion

Write-Host ""
Write-Host "🔄 Обновление WSL..." -ForegroundColor Cyan
Write-Host ""

# Обновляем WSL
try {
    wsl --update
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ WSL успешно обновлен!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
        Write-Host "1. Перезапустите Docker Desktop" -ForegroundColor White
        Write-Host "2. Или выполните: wsl --shutdown" -ForegroundColor White
        Write-Host "3. Затем запустите Docker Desktop снова" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Ошибка при обновлении WSL" -ForegroundColor Red
        Write-Host "Попробуйте выполнить вручную: wsl --update" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте выполнить вручную:" -ForegroundColor Yellow
    Write-Host "  wsl --update" -ForegroundColor White
}

Write-Host ""
pause

