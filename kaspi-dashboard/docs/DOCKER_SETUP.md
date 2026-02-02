# Настройка локального Supabase через Docker

Это руководство поможет вам настроить локальный Supabase для разработки с использованием Docker.

## Требования

- Docker Desktop (включает Docker и Docker Compose)
- Node.js 18+ и npm
- Минимум 4GB свободной RAM

## Быстрый старт

### 1. Настройка окружения

```bash
# Запустите скрипт настройки
npm run docker:setup
```

Скрипт создаст файл `.env.docker` с настройками по умолчанию.

**⚠️ ВАЖНО:** Обновите пароли в `.env.docker` перед запуском!

### 2. Запуск Docker контейнеров

```bash
# Запустить все сервисы
npm run docker:up

# Или вручную
docker-compose up -d
```

Первый запуск может занять 1-2 минуты для загрузки образов.

### 3. Проверка статуса

```bash
# Просмотр логов
npm run docker:logs

# Или проверить статус контейнеров
docker-compose ps
```

### 4. Выполнение миграций

```bash
# Проверка готовности к миграциям
npm run docker:migrate
```

Затем выполните миграции через Supabase Studio или psql (см. ниже).

### 5. Настройка .env.local

Обновите файл `.env.local` для работы с локальным Supabase:

```env
# Локальный Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Доступные сервисы

После запуска доступны:

- **API Gateway (Kong):** http://localhost:8000
- **Supabase Studio:** http://localhost:3001
- **PostgREST (REST API):** http://localhost:3000
- **Realtime:** ws://localhost:4000
- **Storage API:** http://localhost:5000
- **PostgreSQL:** localhost:54322

## Выполнение миграций

### Вариант 1: Через Supabase Studio

1. Откройте http://localhost:3001
2. Перейдите в **SQL Editor**
3. Скопируйте содержимое `supabase/schema-working.sql`
4. Выполните SQL
5. Повторите для миграций:
   - `supabase/migration-add-store-to-stock.sql`
   - `supabase/migration-add-sql-function.sql` (опционально)

### Вариант 2: Через psql

```bash
# Подключение к PostgreSQL
psql -h localhost -p 54322 -U postgres -d postgres

# Или выполнить SQL файл напрямую
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/schema-working.sql
```

**Пароль по умолчанию:** `your-super-secret-and-long-postgres-password` (из `.env.docker`)

## Управление контейнерами

```bash
# Запустить
npm run docker:up

# Остановить
npm run docker:down

# Перезапустить
npm run docker:restart

# Просмотр логов
npm run docker:logs

# Остановить и удалить данные (⚠️ удалит все данные!)
docker-compose down -v
```

## Логирование всех операций

Для записи всех операций в Supabase создайте таблицу логов:

```sql
-- Создание таблицы для логов
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'sync', 'api', 'calculation', etc.
  entity_type TEXT, -- 'products', 'sales', 'stock', etc.
  entity_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'read'
  details JSONB,
  user_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_operation_type ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_entity_type ON operation_logs(entity_type);
```

Затем используйте эту таблицу в вашем коде для логирования всех операций.

## Решение проблем

### Ошибка при запуске Docker

Если при запуске `docker-compose up -d` возникает ошибка:

1. **Проверьте, что Docker запущен:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Проверьте, что порты свободны:**
   - 8000, 3000, 3001, 4000, 5000, 5001, 54322
   - Если порты заняты, измените их в `docker-compose.yml`

3. **Проверьте логи:**
   ```bash
   docker-compose logs
   ```

### Ошибка подключения к базе данных

1. Убедитесь, что контейнер `supabase-postgres` запущен:
   ```bash
   docker-compose ps
   ```

2. Проверьте логи PostgreSQL:
   ```bash
   docker-compose logs supabase-db
   ```

3. Проверьте переменные окружения в `.env.docker`

### Ошибка миграций

1. Убедитесь, что база данных полностью запущена (подождите 30-60 секунд после `docker-compose up`)
2. Проверьте подключение через Studio: http://localhost:3001
3. Выполните миграции по одной, начиная с `schema-working.sql`

## Переключение между локальным и облачным Supabase

Для переключения между локальным и облачным Supabase просто обновите переменные в `.env.local`:

**Локальный:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
```

**Облачный:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## Дополнительные ресурсы

- [Документация Supabase](https://supabase.com/docs)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [Локальная разработка Supabase](https://supabase.com/docs/guides/cli/local-development)

