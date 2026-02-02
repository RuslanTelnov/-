# Исправление ошибки "WSL needs updating" в Docker Desktop

## Проблема

Docker Desktop показывает ошибку:
> **WSL needs updating**  
> Your version of Windows Subsystem for Linux (WSL) is too old.

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

1. **Запустите скрипт от имени администратора:**
   - Правый клик на `scripts/fix-wsl.bat` → **Запуск от имени администратора**
   - Или правый клик на `scripts/fix-wsl.ps1` → **Запуск от имени администратора**

2. Скрипт автоматически обновит WSL

3. **Перезапустите Docker Desktop**

### Вариант 2: Ручное исправление

1. **Откройте PowerShell или Command Prompt от имени администратора:**
   - Нажмите `Win + X`
   - Выберите "Windows PowerShell (Администратор)" или "Терминал (Администратор)"

2. **Выполните команду:**
   ```powershell
   wsl --update
   ```

3. **Дождитесь завершения обновления**

4. **Перезапустите WSL:**
   ```powershell
   wsl --shutdown
   ```

5. **Перезапустите Docker Desktop**

### Вариант 3: Через командную строку (если PowerShell не работает)

1. Откройте Command Prompt от имени администратора

2. Выполните:
   ```cmd
   wsl --update
   ```

3. Перезапустите Docker Desktop

## Проверка версии WSL

После обновления проверьте версию:

```powershell
wsl --version
```

Должна быть версия 2.0 или выше.

## Если обновление не помогло

### 1. Установите WSL вручную

```powershell
# В PowerShell от имени администратора
wsl --install
```

### 2. Установите обновления Windows

1. Откройте **Параметры Windows** (Win + I)
2. Перейдите в **Обновление и безопасность** → **Центр обновления Windows**
3. Установите все доступные обновления
4. Перезагрузите компьютер

### 3. Обновите Docker Desktop

1. Откройте Docker Desktop
2. Перейдите в **Settings** (Настройки)
3. Нажмите **Check for updates** (Проверить обновления)
4. Установите последнюю версию

### 4. Переустановите WSL

Если ничего не помогает:

```powershell
# Отключить WSL
wsl --unregister <имя_дистрибутива>

# Установить заново
wsl --install
```

## Дополнительная информация

- [Документация Microsoft по WSL](https://learn.microsoft.com/en-us/windows/wsl/)
- [Руководство по обновлению WSL](https://learn.microsoft.com/en-us/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package)

## После исправления

После успешного обновления WSL:

1. ✅ Перезапустите Docker Desktop
2. ✅ Дождитесь полного запуска (иконка Docker в трее станет зеленой)
3. ✅ Запустите проект:
   ```bash
   npm run docker:setup
   npm run docker:up
   ```

## Проверка работы Docker

После перезапуска проверьте:

```bash
docker --version
docker-compose --version
```

Обе команды должны вывести версии без ошибок.

