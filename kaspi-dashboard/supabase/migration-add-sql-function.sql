-- ============================================
-- МИГРАЦИЯ: Добавление функции для SQL запросов
-- Выполните этот скрипт в SQL Editor Supabase
-- ============================================

-- Создаем функцию для безопасного выполнения SELECT запросов
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
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO service_role;

-- Комментарий к функции
COMMENT ON FUNCTION execute_readonly_query(TEXT) IS 'Безопасное выполнение SELECT запросов. Разрешены только запросы на чтение данных.';

-- Проверка установки
DO $$
BEGIN
  RAISE NOTICE 'Функция execute_readonly_query успешно создана!';
  RAISE NOTICE 'Теперь можно выполнять SQL запросы через AI чат.';
END $$;

