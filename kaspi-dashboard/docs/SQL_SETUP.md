# Настройка SQL функций в Supabase

Для работы SQL запросов через AI чат необходимо создать функцию в Supabase.

## Быстрая установка

Запустите команду для автоматической установки:

```bash
npm run install-sql-function
```

Скрипт покажет SQL код, который нужно выполнить.

## Ручная установка

### Шаг 1: Откройте SQL Editor в Supabase

1. Войдите в ваш проект Supabase
2. Перейдите в раздел **SQL Editor**
3. Нажмите **New Query**

### Шаг 2: Выполните SQL скрипт

Скопируйте и выполните содержимое файла `supabase/migration-add-sql-function.sql`:

```sql
-- Функция для безопасного выполнения SELECT запросов
CREATE OR REPLACE FUNCTION execute_readonly_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
  result_array JSONB[] := ARRAY[]::JSONB[];
BEGIN
  -- Проверка, что запрос начинается с SELECT, WITH, EXPLAIN, SHOW или DESCRIBE
  IF NOT (upper(trim(query_text)) ~ '^(SELECT|WITH|EXPLAIN|SHOW|DESCRIBE|DESC)') THEN
    RAISE EXCEPTION 'Разрешены только SELECT запросы. Запрос должен начинаться с SELECT, WITH, EXPLAIN, SHOW или DESCRIBE.';
  END IF;

  -- Проверка на запрещенные команды
  IF upper(query_text) ~ '(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL|MERGE|REPLACE)' THEN
    RAISE EXCEPTION 'Обнаружены запрещенные команды. Разрешены только SELECT запросы.';
  END IF;

  -- Выполнение запроса
  FOR result_record IN EXECUTE query_text
  LOOP
    result_array := array_append(result_array, to_jsonb(result_record));
  END LOOP;

  -- Возврат результатов
  RETURN QUERY SELECT unnest(result_array) AS result;
END;
$$;

-- Предоставляем доступ к функции
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO anon;

-- Комментарий к функции
COMMENT ON FUNCTION execute_readonly_query(TEXT) IS 'Безопасное выполнение SELECT запросов. Разрешены только запросы на чтение данных.';
```

## Шаг 3: Проверка установки

После выполнения скрипта вы должны увидеть сообщение:
```
Success. No rows returned
```

Это означает, что функция создана успешно.

## Шаг 4: Тестирование

Проверьте работу функции, выполнив тестовый запрос:

```sql
SELECT * FROM execute_readonly_query('SELECT article, name FROM products LIMIT 5');
```

Должны вернуться результаты в формате JSONB.

## Безопасность

Функция `execute_readonly_query`:
- ✅ Разрешает только SELECT запросы
- ✅ Блокирует INSERT, UPDATE, DELETE, DROP и другие опасные команды
- ✅ Выполняется с правами SECURITY DEFINER (требует осторожности)
- ✅ Валидирует запросы перед выполнением

## Альтернативный способ (если функция не работает)

Если по каким-то причинам функция не работает, можно использовать прямой доступ через PostgREST API, но это менее безопасно и требует дополнительной настройки.

---

**Важно:** После создания функции SQL запросы в AI чате будут работать автоматически.

