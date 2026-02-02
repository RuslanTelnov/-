# Update WSL script
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", "`"$scriptPath`""
    exit
}

Write-Host "Updating WSL..." -ForegroundColor Cyan
wsl --update

if ($LASTEXITCODE -eq 0) {
    Write-Host "Shutting down WSL..." -ForegroundColor Yellow
    wsl --shutdown
    Write-Host "Done! Please restart Docker Desktop" -ForegroundColor Green
} else {
    Write-Host "Error updating WSL" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

