-- Безопасная схема с проверками и миграциями
-- Выполняйте этот файл, если получили ошибки при выполнении основной схемы

-- Удаляем существующие триггеры (если есть)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
DROP TRIGGER IF EXISTS update_counterparties_updated_at ON counterparties;
DROP TRIGGER IF EXISTS update_trade_data_updated_at ON trade_data;
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS update_customer_orders_updated_at ON customer_orders;
DROP TRIGGER IF EXISTS update_payments_in_updated_at ON payments_in;
DROP TRIGGER IF EXISTS update_payments_out_updated_at ON payments_out;
DROP TRIGGER IF EXISTS update_cash_in_updated_at ON cash_in;
DROP TRIGGER IF EXISTS update_cash_out_updated_at ON cash_out;
DROP TRIGGER IF EXISTS update_losses_updated_at ON losses;
DROP TRIGGER IF EXISTS update_turnover_updated_at ON turnover;
DROP TRIGGER IF EXISTS update_profit_by_product_updated_at ON profit_by_product;
DROP TRIGGER IF EXISTS update_money_by_account_updated_at ON money_by_account;
DROP TRIGGER IF EXISTS update_product_metrics_updated_at ON product_metrics;

-- Удаляем существующие индексы (если есть)
DROP INDEX IF EXISTS idx_products_moy_sklad_id;
DROP INDEX IF EXISTS idx_products_article;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_stock_product_id;
DROP INDEX IF EXISTS idx_sales_moy_sklad_id;
DROP INDEX IF EXISTS idx_sales_moment;
DROP INDEX IF EXISTS idx_purchases_moy_sklad_id;
DROP INDEX IF EXISTS idx_purchases_moment;
DROP INDEX IF EXISTS idx_counterparties_moy_sklad_id;
DROP INDEX IF EXISTS idx_customer_orders_moment;
DROP INDEX IF EXISTS idx_payments_in_moment;
DROP INDEX IF EXISTS idx_payments_out_moment;
DROP INDEX IF EXISTS idx_turnover_article;
DROP INDEX IF EXISTS idx_profit_by_product_article;
DROP INDEX IF EXISTS idx_product_metrics_article;
DROP INDEX IF EXISTS idx_product_metrics_priority;
DROP INDEX IF EXISTS idx_trade_data_category;

-- Удаляем существующие таблицы (если нужно пересоздать)
-- ВНИМАНИЕ: Это удалит все данные! Раскомментируйте только если нужно пересоздать таблицы
-- DROP TABLE IF EXISTS product_metrics CASCADE;
-- DROP TABLE IF EXISTS money_by_account CASCADE;
-- DROP TABLE IF EXISTS profit_by_product CASCADE;
-- DROP TABLE IF EXISTS turnover CASCADE;
-- DROP TABLE IF EXISTS losses CASCADE;
-- DROP TABLE IF EXISTS cash_out CASCADE;
-- DROP TABLE IF EXISTS cash_in CASCADE;
-- DROP TABLE IF EXISTS payments_out CASCADE;
-- DROP TABLE IF EXISTS payments_in CASCADE;
-- DROP TABLE IF EXISTS customer_orders CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;
-- DROP TABLE IF EXISTS trade_data CASCADE;
-- DROP TABLE IF EXISTS stock CASCADE;
-- DROP TABLE IF EXISTS counterparties CASCADE;
-- DROP TABLE IF EXISTS purchases CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- Добавляем недостающие столбцы в существующие таблицы (миграция)
DO $$ 
BEGIN
  -- Проверяем и добавляем moy_sklad_id в products, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'moy_sklad_id'
  ) THEN
    ALTER TABLE products ADD COLUMN moy_sklad_id TEXT;
    ALTER TABLE products ADD CONSTRAINT products_moy_sklad_id_unique UNIQUE (moy_sklad_id);
  END IF;

  -- Проверяем и добавляем article в products, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'article'
  ) THEN
    ALTER TABLE products ADD COLUMN article TEXT;
    ALTER TABLE products ADD CONSTRAINT products_article_unique UNIQUE (article);
  END IF;
END $$;

-- Теперь создаем таблицы (если их еще нет)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  article TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock DECIMAL(10, 2) DEFAULT 0,
  reserve DECIMAL(10, 2) DEFAULT 0,
  in_transit DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  inn TEXT,
  kpp TEXT,
  legal_address TEXT,
  actual_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  state_name TEXT,
  positions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  positions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turnover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL,
  product_name TEXT,
  quantity DECIMAL(10, 2) DEFAULT 0,
  sum DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS profit_by_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL,
  product_name TEXT,
  revenue DECIMAL(10, 2) DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  profit DECIMAL(10, 2) DEFAULT 0,
  margin DECIMAL(5, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS money_by_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  income DECIMAL(10, 2) DEFAULT 0,
  outcome DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_name, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT UNIQUE NOT NULL,
  product_name TEXT,
  turnover_ratio DECIMAL(10, 4) DEFAULT 0,
  turnover_days DECIMAL(10, 2) DEFAULT 0,
  margin_percent DECIMAL(5, 2) DEFAULT 0,
  margin_amount DECIMAL(10, 2) DEFAULT 0,
  liquidity_score DECIMAL(5, 2) DEFAULT 0,
  sales_velocity DECIMAL(10, 2) DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  avg_revenue_per_day DECIMAL(10, 2) DEFAULT 0,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  avg_stock DECIMAL(10, 2) DEFAULT 0,
  recommendation TEXT,
  priority_score DECIMAL(5, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_moy_sklad_id ON products(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_moy_sklad_id ON sales(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_sales_moment ON sales(moment);
CREATE INDEX IF NOT EXISTS idx_purchases_moy_sklad_id ON purchases(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_purchases_moment ON purchases(moment);
CREATE INDEX IF NOT EXISTS idx_counterparties_moy_sklad_id ON counterparties(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_moment ON customer_orders(moment);
CREATE INDEX IF NOT EXISTS idx_payments_in_moment ON payments_in(moment);
CREATE INDEX IF NOT EXISTS idx_payments_out_moment ON payments_out(moment);
CREATE INDEX IF NOT EXISTS idx_turnover_article ON turnover(article);
CREATE INDEX IF NOT EXISTS idx_profit_by_product_article ON profit_by_product(article);
CREATE INDEX IF NOT EXISTS idx_product_metrics_article ON product_metrics(article);
CREATE INDEX IF NOT EXISTS idx_product_metrics_priority ON product_metrics(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_trade_data_category ON trade_data(category);

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counterparties_updated_at BEFORE UPDATE ON counterparties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_orders_updated_at BEFORE UPDATE ON customer_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_in_updated_at BEFORE UPDATE ON payments_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_out_updated_at BEFORE UPDATE ON payments_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_in_updated_at BEFORE UPDATE ON cash_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_out_updated_at BEFORE UPDATE ON cash_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_losses_updated_at BEFORE UPDATE ON losses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnover_updated_at BEFORE UPDATE ON turnover
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_by_product_updated_at BEFORE UPDATE ON profit_by_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_money_by_account_updated_at BEFORE UPDATE ON money_by_account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_metrics_updated_at BEFORE UPDATE ON product_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_data_updated_at BEFORE UPDATE ON trade_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

