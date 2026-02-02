-- Политики Row Level Security (RLS) для Supabase
-- Выполните эти команды после создания таблиц

-- Включаем RLS для всех таблиц
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_data ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все пользователи могут читать)
CREATE POLICY "Allow public read access on products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on sales"
  ON sales FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on purchases"
  ON purchases FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on counterparties"
  ON counterparties FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on trade_data"
  ON trade_data FOR SELECT
  USING (true);

-- Политики для записи (только через service role key)
-- Для записи используется supabaseAdmin в API routes, поэтому
-- эти политики можно не создавать, если вы используете service role key

-- Если нужна запись через anon key, создайте политики:
-- CREATE POLICY "Allow service role write access"
--   ON products FOR ALL
--   USING (auth.role() = 'service_role');

-- ВАЖНО: Для продакшена рекомендуется настроить более строгие политики
-- с аутентификацией пользователей

