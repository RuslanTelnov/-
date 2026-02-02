-- Пошаговое создание таблиц с проверками
-- Выполняйте этот скрипт полностью в SQL Editor Supabase

-- Шаг 1: Создаем функцию для обновления updated_at (если еще нет)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Шаг 2: Создаем таблицу products (товары)
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

-- Шаг 3: Создаем таблицу stock (остатки)
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

-- Шаг 4: Создаем таблицу sales (продажи)
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

-- Шаг 5: Создаем таблицу purchases (закупки)
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

-- Шаг 6: Создаем таблицу counterparties (контрагенты)
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

-- Шаг 7: Создаем таблицу stores (склады)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Шаг 8: Создаем таблицу customer_orders (заказы покупателей)
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

-- Шаг 9: Создаем таблицу payments_in (входящие платежи)
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

-- Шаг 10: Создаем таблицу payments_out (исходящие платежи)
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

-- Шаг 11: Создаем таблицу cash_in (приходные ордера)
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

-- Шаг 12: Создаем таблицу cash_out (расходные ордера)
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

-- Шаг 13: Создаем таблицу losses (списания)
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

-- Шаг 14: Создаем таблицу turnover (обороты)
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

-- Шаг 15: Создаем таблицу profit_by_product (прибыль по товарам)
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

-- Шаг 16: Создаем таблицу money_by_account (деньги по счетам)
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

-- Шаг 17: Создаем таблицу product_metrics (метрики товаров)
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

-- Шаг 18: Создаем таблицу trade_data (торговые данные)
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

-- Шаг 19: Создаем индексы
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

-- Шаг 20: Создаем триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_counterparties_updated_at ON counterparties;
CREATE TRIGGER update_counterparties_updated_at BEFORE UPDATE ON counterparties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_orders_updated_at ON customer_orders;
CREATE TRIGGER update_customer_orders_updated_at BEFORE UPDATE ON customer_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_in_updated_at ON payments_in;
CREATE TRIGGER update_payments_in_updated_at BEFORE UPDATE ON payments_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_out_updated_at ON payments_out;
CREATE TRIGGER update_payments_out_updated_at BEFORE UPDATE ON payments_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_in_updated_at ON cash_in;
CREATE TRIGGER update_cash_in_updated_at BEFORE UPDATE ON cash_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_out_updated_at ON cash_out;
CREATE TRIGGER update_cash_out_updated_at BEFORE UPDATE ON cash_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_losses_updated_at ON losses;
CREATE TRIGGER update_losses_updated_at BEFORE UPDATE ON losses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_turnover_updated_at ON turnover;
CREATE TRIGGER update_turnover_updated_at BEFORE UPDATE ON turnover
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profit_by_product_updated_at ON profit_by_product;
CREATE TRIGGER update_profit_by_product_updated_at BEFORE UPDATE ON profit_by_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_money_by_account_updated_at ON money_by_account;
CREATE TRIGGER update_money_by_account_updated_at BEFORE UPDATE ON money_by_account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_metrics_updated_at ON product_metrics;
CREATE TRIGGER update_product_metrics_updated_at BEFORE UPDATE ON product_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_data_updated_at ON trade_data;
CREATE TRIGGER update_trade_data_updated_at BEFORE UPDATE ON trade_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

