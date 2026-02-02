# 🐳 Настройка локального Supabase через Docker

Этот проект настроен для работы с локальным Supabase через Docker, что позволяет записывать всю информацию в базу данных.

## 🚀 Быстрый старт

### 1. Установка Docker

Убедитесь, что у вас установлен Docker Desktop:
- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: https://docs.docker.com/engine/install/

### 2. Настройка окружения

```bash
# Запустите скрипт настройки
npm run docker:setup
```

Это создаст файл `.env.docker` с настройками по умолчанию.

**⚠️ ВАЖНО:** Обновите пароли в `.env.docker` перед запуском!

### 3. Запуск Docker

```bash
# Запустить все сервисы Supabase
npm run docker:up
```

Первый запуск может занять 1-2 минуты.

### 4. Выполнение миграций

```bash
# Проверка готовности
npm run docker:migrate
```

Затем выполните миграции через Supabase Studio (http://localhost:3001) или psql.

### 5. Настройка .env.local

Обновите `.env.local` для работы с локальным Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 📋 Доступные команды

```bash
# Настройка
npm run docker:setup          # Настройка окружения

# Управление контейнерами
npm run docker:up              # Запустить контейнеры
npm run docker:down            # Остановить контейнеры
npm run docker:restart         # Перезапустить контейнеры
npm run docker:logs            # Просмотр логов

# Миграции
npm run docker:migrate         # Проверка готовности к миграциям
```

## 🌐 Доступные сервисы

После запуска доступны:

- **API Gateway:** http://localhost:8000
- **Supabase Studio:** http://localhost:3001
- **PostgREST:** http://localhost:3000
- **Realtime:** ws://localhost:4000
- **Storage API:** http://localhost:5000
- **PostgreSQL:** localhost:54322

## 📝 Логирование операций

Все операции автоматически записываются в таблицу `operation_logs` в Supabase.

Для включения логирования выполните миграцию:
```sql
-- В Supabase Studio (http://localhost:3001) → SQL Editor
-- Выполните: supabase/migration-add-operation-logs.sql
```

Затем используйте утилиту логирования в коде:
```typescript
import { logOperation, logSync, logApiRequest } from '@/lib/utils/logger'

// Логирование синхронизации
await logSync('products', 'start', { count: 100 })

// Логирование API запроса
await logApiRequest('/api/sync', 'POST', { userId: '123' })

// Логирование операции с данными
await logDataOperation('products', 'create', 'product-id', { name: 'Product' })
```

## ❌ Решение проблем

### Ошибка при установке Docker

Если при запуске возникает ошибка, пришлите текст ошибки — я помогу исправить.

**Частые проблемы:**

1. **Docker не запущен:**
   ```bash
   # Проверьте статус Docker
   docker --version
   docker-compose --version
   ```

2. **Порты заняты:**
   - Измените порты в `docker-compose.yml`
   - Или остановите процессы, использующие порты 8000, 3000, 3001, 4000, 5000, 5001, 54322

3. **Недостаточно памяти:**
   - Убедитесь, что у Docker выделено минимум 4GB RAM
   - Настройки: Docker Desktop → Settings → Resources

### Ошибка подключения к базе данных

1. Убедитесь, что контейнеры запущены:
   ```bash
   docker-compose ps
   ```

2. Проверьте логи:
   ```bash
   docker-compose logs supabase-db
   ```

3. Подождите 30-60 секунд после запуска для полной инициализации

## 📚 Дополнительная документация

- [Полная документация по Docker Setup](docs/DOCKER_SETUP.md)
- [Документация по файлам Supabase](docs/SUPABASE_FILES.md)
- [Документация API](docs/API_MAPPING.md)

## 🔄 Переключение между локальным и облачным Supabase

Для переключения просто обновите переменные в `.env.local`:

**Локальный:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
```

**Облачный:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

