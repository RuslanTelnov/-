-- Скрипт для проверки созданных таблиц и их структуры
-- Выполните этот скрипт, чтобы убедиться, что все создано правильно

-- Проверяем все созданные таблицы
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'products', 'stock', 'sales', 'purchases', 'counterparties', 
    'stores', 'customer_orders', 'payments_in', 'payments_out',
    'cash_in', 'cash_out', 'losses', 'turnover', 'profit_by_product',
    'money_by_account', 'product_metrics', 'trade_data'
  )
ORDER BY table_name;

-- Проверяем структуру таблицы products (самая важная)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Проверяем индексы
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'stock', 'sales', 'purchases', 'counterparties', 
    'stores', 'customer_orders', 'payments_in', 'payments_out',
    'cash_in', 'cash_out', 'losses', 'turnover', 'profit_by_product',
    'money_by_account', 'product_metrics', 'trade_data'
  )
ORDER BY tablename, indexname;

-- Проверяем триггеры
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

