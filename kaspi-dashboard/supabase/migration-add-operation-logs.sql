-- Миграция: Добавление таблицы для логирования всех операций
-- Выполните этот скрипт в SQL Editor Supabase

-- Создаем таблицу для логов операций
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'sync', 'api', 'calculation', 'dashboard', etc.
  entity_type TEXT, -- 'products', 'sales', 'stock', etc.
  entity_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'read', 'sync'
  details JSONB,
  user_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_operation_type ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_entity_type ON operation_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_operation_logs_entity_id ON operation_logs(entity_id);

-- Комментарии к таблице
COMMENT ON TABLE operation_logs IS 'Логи всех операций в системе';
COMMENT ON COLUMN operation_logs.operation_type IS 'Тип операции: sync, api, calculation, dashboard, etc.';
COMMENT ON COLUMN operation_logs.entity_type IS 'Тип сущности: products, sales, stock, etc.';
COMMENT ON COLUMN operation_logs.action IS 'Действие: create, update, delete, read, sync';
COMMENT ON COLUMN operation_logs.details IS 'Дополнительные детали операции в формате JSON';

-- Политика RLS (если используется)
-- ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow service role full access" ON operation_logs FOR ALL USING (true);

-- Проверка установки
DO $$
BEGIN
  RAISE NOTICE 'Таблица operation_logs успешно создана!';
  RAISE NOTICE 'Теперь все операции будут логироваться в Supabase.';
END $$;

